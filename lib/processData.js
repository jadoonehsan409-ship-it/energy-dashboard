import { format, subDays, isValid } from 'date-fns';
export const parseTime = (s) => { if (!s) return null; const d = new Date(s); return isValid(d) ? d : null; };
export const getLiveReading = (data) => data?.length ? data[data.length - 1] : null;
export function getDailyTotals(data) {
  if (!data?.length) return [];
  const byDay = {};
  for (let i = 1; i < data.length; i++) {
    const t = parseTime(data[i].time); if (!t) continue;
    const diff = data[i].energy - data[i - 1].energy;
    if (diff > 0 && diff < 10000) { const k = format(t, 'yyyy-MM-dd'); byDay[k] = (byDay[k] || 0) + diff / 1000; }
  }
  return Object.entries(byDay).map(([date, kwh]) => ({ date, kwh: parseFloat(kwh.toFixed(3)) })).sort((a, b) => a.date.localeCompare(b.date));
}
export function getTodayKwh(data) {
  if (!data?.length) return 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const td = data.filter(r => { const t = parseTime(r.time); return t && format(t, 'yyyy-MM-dd') === today; });
  if (td.length < 2) return 0;
  const diff = td[td.length - 1].energy - td[0].energy;
  return diff > 0 ? parseFloat((diff / 1000).toFixed(3)) : 0;
}
export function getMonthKwh(data) {
  if (!data?.length) return 0;
  const mk = format(new Date(), 'yyyy-MM');
  const md = data.filter(r => { const t = parseTime(r.time); return t && format(t, 'yyyy-MM') === mk; });
  if (md.length < 2) return 0;
  const diff = md[md.length - 1].energy - md[0].energy;
  return diff > 0 ? parseFloat((diff / 1000).toFixed(2)) : 0;
}
export function getLastMonthKwh(data) {
  if (!data?.length) return 0;
  const now = new Date(); const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const mk = format(lm, 'yyyy-MM');
  const md = data.filter(r => { const t = parseTime(r.time); return t && format(t, 'yyyy-MM') === mk; });
  if (md.length < 2) return 0;
  const diff = md[md.length - 1].energy - md[0].energy;
  return diff > 0 ? parseFloat((diff / 1000).toFixed(2)) : 0;
}
export function getApplianceBreakdown(data, days = 7) {
  if (!data?.length) return [];
  const cutoff = subDays(new Date(), days);
  const recent = data.filter(r => { const t = parseTime(r.time); return t && t >= cutoff; });
  const by = {};
  for (let i = 1; i < recent.length; i++) {
    const t1 = parseTime(recent[i - 1].time), t2 = parseTime(recent[i].time);
    if (!t1 || !t2) continue;
    const hrs = (t2 - t1) / 3600000;
    if (hrs <= 0 || hrs > 1) continue;
    const lbl = recent[i].loadLabel || 'Unknown';
    by[lbl] = (by[lbl] || 0) + (recent[i].power * hrs) / 1000;
  }
  return Object.entries(by).map(([name, kwh]) => ({ name, kwh: parseFloat(kwh.toFixed(3)) })).sort((a, b) => b.kwh - a.kwh);
}
export function detectAnomaly(data) {
  const daily = getDailyTotals(data);
  if (daily.length < 3) return { isAnomaly: false, todayKwh: 0, avgKwh: 0, upperBound: 0, percentAbove: 0 };
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayKwh = getTodayKwh(data);
  const baseline = daily.filter(d => d.date !== today).slice(-7);
  if (!baseline.length) return { isAnomaly: false, todayKwh, avgKwh: 0, upperBound: 0, percentAbove: 0 };
  const avg = baseline.reduce((s, d) => s + d.kwh, 0) / baseline.length;
  const std = Math.sqrt(baseline.reduce((s, d) => s + Math.pow(d.kwh - avg, 2), 0) / baseline.length);
  const upper = avg + 1.5 * std;
  return { isAnomaly: todayKwh > upper, todayKwh: parseFloat(todayKwh.toFixed(3)), avgKwh: parseFloat(avg.toFixed(3)), upperBound: parseFloat(upper.toFixed(3)), percentAbove: avg > 0 ? Math.round(((todayKwh - avg) / avg) * 100) : 0 };
}
export function filterByDateRange(data, from, to) {
  return data.filter(r => { const t = parseTime(r.time); if (!t) return false; if (from && t < new Date(from)) return false; if (to && t > new Date(to)) return false; return true; });
}
export const estimateCost = (kwh, rate) => parseFloat((kwh * rate).toFixed(2));
