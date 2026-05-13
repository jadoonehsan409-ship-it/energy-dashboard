import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { getDailyTotals, getTodayKwh, getMonthKwh, getLastMonthKwh, getApplianceBreakdown, detectAnomaly, getLiveReading, estimateCost } from '../lib/processData';
import { generateForecast, mergeForChart } from '../lib/forecasting';
import { generateAlerts } from '../lib/alerts';

// Live tab — last 500 rows, fetched every 30 seconds
const LIVE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbSJRflh9OFloDKHNzHKO3LvdamJhjulEWgospOAYP2dOgD3JEX6dfQOrLkBf2Iehrl1kPAr0phvhr/pub?gid=463350828&single=true&output=csv';

// History tab — recent 5000 rows, fetched once on load
const HISTORY_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-6G97-09OKa0ogiNKnMQIKx6-caMw404tz1eAr95HV9yRzwT51_dA5toc7dF3shJdzporH5p2z6sf/pub?gid=7749345&single=true&output=csv';

const parseCSV = (csv) => {
  return new Promise((resolve) => {
    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const cleaned = data
          .map(r => ({
            time: r.Time || r.time || '',
            voltage: parseFloat(r.Voltage || 0),
            current: parseFloat(r.Current || 0),
            power: parseFloat(r.Power || 0),
            energy: parseFloat(r.Energy || 0),
            frequency: parseFloat(r.Frequency || 0),
            powerFactor: parseFloat(r['Power Factor'] || r.PowerFactor || 0),
            loadLabel: r.Load_Label || r.LoadLabel || 'Unknown',
          }))
          .filter(r => r.time && !isNaN(r.power));
        resolve(cleaned);
      },
    });
  });
};

export function useEnergyData(settings = {}) {
  const [liveData, setLiveData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const sentRef = useRef(new Set());
  const hasLoaded = useRef(false);
  const historyLoaded = useRef(false);
  const retryCount = useRef(0);

  const rate = parseFloat(settings.ratePerKwh || 25);
  const alertEmail = settings.alertEmail || '';
  const monthlyThreshold = parseFloat(settings.monthlyThreshold || 150);

  // ── Fetch live data every 30 seconds ─────────────────────────────
  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(
        `${LIVE_URL}&t=${Date.now()}`,
        { cache: 'no-store', signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csv = await res.text();
      const cleaned = await parseCSV(csv);
      retryCount.current = 0;
      if (cleaned.length) {
        // Sheet returns newest first — reverse so newest is last
        const sorted = cleaned.reverse();
        setLiveData(sorted);
      }
      setLastFetch(new Date().toISOString());
      if (!hasLoaded.current) {
        hasLoaded.current = true;
        setLoading(false);
      }
    } catch (e) {
      console.error('Live fetch error:', e);
      retryCount.current += 1;
      if (retryCount.current <= 3) setTimeout(fetchLive, 5000);
      if (!hasLoaded.current) setLoading(false);
    }
  }, []);

  // ── Fetch history once on load ────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (historyLoaded.current) return;
    try {
      const res = await fetch(
        `${HISTORY_URL}&t=${Date.now()}`,
        { cache: 'no-store', signal: AbortSignal.timeout(60000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csv = await res.text();
      const cleaned = await parseCSV(csv);
      if (cleaned.length) {
        // Sort ascending by time, take last 5000 (most recent)
        const sorted = cleaned.sort((a, b) =>
          new Date(a.time) - new Date(b.time)
        );
        const recent = sorted.slice(-5000);
        setHistoryData(recent);
        historyLoaded.current = true;
      }
    } catch (e) {
      console.error('History fetch error:', e);
      // Retry after 10 seconds if failed
      setTimeout(fetchHistory, 10000);
    }
  }, []);

  // Live: fetch immediately + every 30 seconds
  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, 30000);
    return () => clearInterval(id);
  }, [fetchLive]);

  // History: fetch once on load
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── Merge history + live deduplicated ────────────────────────────
  const rawData = useMemo(() => {
    if (!historyData.length) return liveData;
    if (!liveData.length) return historyData;
    const liveTimes = new Set(liveData.map(r => r.time));
    const filtered = historyData.filter(r => !liveTimes.has(r.time));
    return [...filtered, ...liveData].sort((a, b) =>
      new Date(a.time) - new Date(b.time)
    );
  }, [historyData, liveData]);

  // ── Derived values ────────────────────────────────────────────────
  const live = getLiveReading(liveData);
  const daily = getDailyTotals(rawData);
  const todayKwh = getTodayKwh(liveData);
  const monthKwh = getMonthKwh(rawData);
  const lastMonthKwh = getLastMonthKwh(rawData);
  const applianceData = getApplianceBreakdown(liveData, 7);
  const anomaly = detectAnomaly(rawData);
  const forecast = generateForecast(daily);
  const chartData = mergeForChart(daily.slice(-30), forecast);
  const alerts = generateAlerts(liveData, {
    monthlyThreshold,
    currentMonthKwh: monthKwh
  });

  // ── Sensor online check ───────────────────────────────────────────
  useEffect(() => {
    if (!live) { setIsOnline(false); return; }
    const diffMin = (new Date() - new Date(live.time)) / 60000;
    setIsOnline(diffMin < 2);
  }, [live]);

  // ── Email alerts — once per session per type ──────────────────────
  useEffect(() => {
    if (!alertEmail || !alerts.length) return;
    alerts.forEach(async a => {
      if (sentRef.current.has(a.type)) return;
      sentRef.current.add(a.type);
      try {
        await fetch('/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: alertEmail,
            subject: a.title,
            message: a.message,
            alertType: a.type
          }),
        });
      } catch (e) { }
    });
  }, [alerts, alertEmail]);

  return {
    rawData, loading, isOnline, lastFetch,
    live, daily, todayKwh, monthKwh, lastMonthKwh,
    applianceData, anomaly, forecast, chartData, alerts,
    todayCost: estimateCost(todayKwh, rate),
    monthCost: estimateCost(monthKwh, rate),
    rate, refetch: fetchLive,
  };
}