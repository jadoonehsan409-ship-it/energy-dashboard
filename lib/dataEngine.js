// lib/dataEngine.js
// Background engine: fetches Google Sheets, processes all calculations

import Papa from 'papaparse';
import { parseISO, subDays, startOfMonth, format, differenceInMinutes } from 'date-fns';

// ── Fetch raw CSV from Google Sheets ──────────────────────────────────────────
export async function fetchSheetData(sheetsUrl) {
  try {
    const res = await fetch(sheetsUrl + '&t=' + Date.now()); // bust cache
    const text = await res.text();
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
    return data.map(row => ({
      time:        new Date(row.Time),
      voltage:     parseFloat(row.Voltage)      || 0,
      current:     parseFloat(row.Current)      || 0,
      power:       parseFloat(row.Power)        || 0,
      energy:      parseFloat(row.Energy)       || 0,
      frequency:   parseFloat(row.Frequency)    || 0,
      powerFactor: parseFloat(row['Power Factor'] || row.Power_Factor) || 0,
      loadLabel:   row.Load_Label || 'Unknown',
    })).filter(r => !isNaN(r.time.getTime()) && r.voltage > 0);
  } catch (e) {
    console.error('Sheet fetch error:', e);
    return [];
  }
}

// ── Check if sensor is online ─────────────────────────────────────────────────
export function getSensorStatus(data) {
  if (!data || data.length === 0) return { online: false, reason: 'No data received' };
  const latest = data[data.length - 1];
  const minsSinceLast = differenceInMinutes(new Date(), latest.time);
  if (minsSinceLast > 2)  return { online: false, reason: `No data for ${minsSinceLast} minutes — sensor may be offline` };
  if (latest.voltage < 10) return { online: false, reason: 'Voltage too low — possible power outage' };
  return { online: true, lastSeen: latest.time };
}

// ── Latest reading ────────────────────────────────────────────────────────────
export function getLatestReading(data) {
  if (!data || data.length === 0) return null;
  return data[data.length - 1];
}

// ── Convert cumulative energy → hourly kWh ────────────────────────────────────
export function toHourlyKwh(data) {
  if (!data || data.length < 2) return [];
  const hourly = {};
  data.forEach(row => {
    const key = format(row.time, 'yyyy-MM-dd HH');
    if (!hourly[key]) hourly[key] = { time: row.time, maxEnergy: row.energy, label: row.loadLabel };
    if (row.energy > hourly[key].maxEnergy) hourly[key].maxEnergy = row.energy;
  });
  const hours = Object.values(hourly).sort((a, b) => a.time - b.time);
  const result = [];
  for (let i = 1; i < hours.length; i++) {
    const diff = hours[i].maxEnergy - hours[i - 1].maxEnergy;
    if (diff > 0 && diff < 10) { // filter resets & spikes
      result.push({ time: hours[i].time, kwh: parseFloat((diff / 1000).toFixed(4)), label: hours[i].label });
    }
  }
  return result;
}

// ── Daily totals ──────────────────────────────────────────────────────────────
export function toDailyKwh(hourlyData) {
  const daily = {};
  hourlyData.forEach(row => {
    const key = format(row.time, 'yyyy-MM-dd');
    daily[key] = (daily[key] || 0) + row.kwh;
  });
  return Object.entries(daily)
    .map(([date, kwh]) => ({ date, kwh: parseFloat(kwh.toFixed(3)) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .filter(d => d.kwh > 0.1); // remove sensor-off days
}

// ── Monthly summary ───────────────────────────────────────────────────────────
export function getMonthlySummary(dailyData) {
  const now = new Date();
  const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const lastMonthStart = format(startOfMonth(subDays(now, 30)), 'yyyy-MM-dd');
  const lastMonthEnd   = format(subDays(startOfMonth(now), 1), 'yyyy-MM-dd');

  const thisMonth = dailyData.filter(d => d.date >= thisMonthStart);
  const lastMonth = dailyData.filter(d => d.date >= lastMonthStart && d.date <= lastMonthEnd);

  const thisTotal = thisMonth.reduce((s, d) => s + d.kwh, 0);
  const lastTotal = lastMonth.reduce((s, d) => s + d.kwh, 0);
  const daysIn    = thisMonth.length || 1;
  const projected = (thisTotal / daysIn) * 30;

  return {
    thisMonthKwh:  parseFloat(thisTotal.toFixed(2)),
    lastMonthKwh:  parseFloat(lastTotal.toFixed(2)),
    projectedKwh:  parseFloat(projected.toFixed(2)),
    dailyAvg:      parseFloat((thisTotal / daysIn).toFixed(3)),
    percentChange: lastTotal > 0 ? parseFloat(((thisTotal - lastTotal) / lastTotal * 100).toFixed(1)) : 0,
    daysRecorded:  daysIn,
  };
}

// ── Per-appliance breakdown ───────────────────────────────────────────────────
export function getApplianceBreakdown(hourlyData) {
  const breakdown = {};
  hourlyData.forEach(row => {
    const label = row.label || 'Unknown';
    if (!breakdown[label]) breakdown[label] = { kwh: 0, count: 0 };
    breakdown[label].kwh   += row.kwh;
    breakdown[label].count += 1;
  });
  const total = Object.values(breakdown).reduce((s, v) => s + v.kwh, 0);
  return Object.entries(breakdown)
    .map(([name, v]) => ({
      name,
      kwh:     parseFloat(v.kwh.toFixed(3)),
      percent: total > 0 ? parseFloat((v.kwh / total * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.kwh - a.kwh);
}

// ── Simple 7-day JS forecast (weighted moving average) ───────────────────────
export function generateForecast(dailyData, days = 7) {
  if (dailyData.length < 7) return [];
  const recent = dailyData.slice(-21); // last 3 weeks
  const weights = recent.map((_, i) => i + 1);
  const weightSum = weights.reduce((s, w) => s + w, 0);
  const baseValue = recent.reduce((s, d, i) => s + d.kwh * weights[i], 0) / weightSum;

  // Day-of-week adjustment
  const dowAvg = {};
  dailyData.forEach(d => {
    const dow = new Date(d.date).getDay();
    if (!dowAvg[dow]) dowAvg[dow] = [];
    dowAvg[dow].push(d.kwh);
  });
  const dowFactor = {};
  const globalAvg = dailyData.reduce((s, d) => s + d.kwh, 0) / dailyData.length;
  Object.entries(dowAvg).forEach(([dow, vals]) => {
    dowFactor[dow] = (vals.reduce((s, v) => s + v, 0) / vals.length) / globalAvg;
  });

  const lastDate = new Date(dailyData[dailyData.length - 1].date);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i + 1);
    const dow = date.getDay();
    const factor = dowFactor[dow] || 1;
    const pred = parseFloat((baseValue * factor).toFixed(3));
    const upper = parseFloat((pred * 1.30).toFixed(3));
    const lower = parseFloat(Math.max(0, pred * 0.70).toFixed(3));
    return { date: format(date, 'yyyy-MM-dd'), predicted: pred, upper, lower };
  });
}

// ── Cost calculation ──────────────────────────────────────────────────────────
export function calculateCost(kwh, ratePerKwh) {
  return parseFloat((kwh * ratePerKwh).toFixed(2));
}

// ── Alert detection ───────────────────────────────────────────────────────────
export function detectAlerts(monthlySummary, applianceBreakdown, sensorStatus, settings) {
  const alerts = [];

  if (!sensorStatus.online) {
    alerts.push({
      id: 'sensor-offline',
      type: 'critical',
      title: 'Sensor Offline',
      message: sensorStatus.reason,
      time: new Date(),
    });
  }

  if (monthlySummary.percentChange > (settings.usageAlertThreshold || 20)) {
    alerts.push({
      id: 'high-usage',
      type: 'warning',
      title: 'High Usage Alert',
      message: `This month is ${monthlySummary.percentChange}% higher than last month. Projected: ${monthlySummary.projectedKwh} kWh.`,
      time: new Date(),
    });
  }

  if (monthlySummary.projectedKwh > (settings.monthlyLimitKwh || 999)) {
    alerts.push({
      id: 'limit-exceeded',
      type: 'critical',
      title: 'Monthly Limit Exceeded',
      message: `Projected usage (${monthlySummary.projectedKwh} kWh) will exceed your limit of ${settings.monthlyLimitKwh} kWh.`,
      time: new Date(),
    });
  }

  if (applianceBreakdown.length > 0) {
    const top = applianceBreakdown[0];
    if (top.percent > 40) {
      alerts.push({
        id: 'top-load',
        type: 'info',
        title: `High Load: ${top.name}`,
        message: `${top.name} accounts for ${top.percent}% of your total consumption (${top.kwh} kWh). Consider reducing usage.`,
        time: new Date(),
      });
    }
  }

  return alerts;
}
