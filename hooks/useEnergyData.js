import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { getDailyTotals, getTodayKwh, getMonthKwh, getLastMonthKwh, getApplianceBreakdown, detectAnomaly, getLiveReading, estimateCost } from '../lib/processData';
import { generateForecast, mergeForChart } from '../lib/forecasting';
import { generateAlerts } from '../lib/alerts';

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-6G97-09OKa0ogiNKnMQIKx6-caMw404tz1eAr95HV9yRzwT51_dA5toc7dF3shJdzporH5p2z6sf/pub?gid=2029829669&single=true&output=csv';

export function useEnergyData(settings = {}) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const sentRef = useRef(new Set());
  const hasLoaded = useRef(false);

  const rate = parseFloat(settings.ratePerKwh || 25);
  const alertEmail = settings.alertEmail || '';
  const monthlyThreshold = parseFloat(settings.monthlyThreshold || 150);

  const fetchData = useCallback(async () => {
    try {
      // Fetch directly from Google Sheets — no API route middleman
      const res = await fetch(`${SHEETS_URL}&t=${Date.now()}`, { cache: 'no-store' });
      const csv = await res.text();

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

          if (cleaned.length) {
            setRawData(cleaned);
          }
          setLastFetch(new Date().toISOString());
          // Only hide spinner after first successful load
          if (!hasLoaded.current) {
            hasLoaded.current = true;
            setLoading(false);
          }
        },
      });
    } catch (e) {
      console.error('Fetch error:', e);
      if (!hasLoaded.current) setLoading(false);
    }
  }, []);

  // Fetch immediately then every 10 seconds
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Derived values
  const live = getLiveReading(rawData);
  const daily = getDailyTotals(rawData);
  const todayKwh = getTodayKwh(rawData);
  const monthKwh = getMonthKwh(rawData);
  const lastMonthKwh = getLastMonthKwh(rawData);
  const applianceData = getApplianceBreakdown(rawData, 7);
  const anomaly = detectAnomaly(rawData);
  const forecast = generateForecast(daily);
  const chartData = mergeForChart(daily.slice(-30), forecast);
  const alerts = generateAlerts(rawData, { monthlyThreshold, currentMonthKwh: monthKwh });

  // Sensor online check — offline if last reading > 2 minutes ago
  useEffect(() => {
    if (!live) { setIsOnline(false); return; }
    const diffMin = (new Date() - new Date(live.time)) / 60000;
    setIsOnline(diffMin < 2);
  }, [live]);

  // Email alerts — send once per session per alert type
  useEffect(() => {
    if (!alertEmail || !alerts.length) return;
    alerts.forEach(async a => {
      if (sentRef.current.has(a.type)) return;
      sentRef.current.add(a.type);
      try {
        await fetch('/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: alertEmail, subject: a.title, message: a.message, alertType: a.type }),
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
    rate, refetch: fetchData,
  };
}