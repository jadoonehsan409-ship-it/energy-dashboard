// lib/useSettings.js
import { useState, useEffect } from 'react';

const DEFAULTS = {
  sheetsUrl: '',
  ratePerKwh: 25,
  currency: 'PKR',
  monthlyLimitKwh: 200,
  usageAlertThreshold: 20,
  alertEmail: '',
  gmailUser: '',
  gmailAppPassword: '',
  hfApiUrl: '',
  refreshInterval: 30,
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    const saved = localStorage.getItem('energyDashboardSettings');
    if (saved) {
      try { setSettings({ ...DEFAULTS, ...JSON.parse(saved) }); }
      catch (e) {}
    }
  }, []);

  const saveSettings = (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem('energyDashboardSettings', JSON.stringify(next));
  };

  return { settings, saveSettings };
}
