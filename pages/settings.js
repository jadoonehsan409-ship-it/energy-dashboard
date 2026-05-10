import { useState } from 'react';
import Layout from '../components/Layout';
import { useEnergyData } from '../hooks/useEnergyData';
import { Save,CheckCircle,ExternalLink } from 'lucide-react';

const CURR=['PKR','USD','GBP','EUR','INR','AED','SAR','BDT'];

export default function SettingsPage({settings,updateSettings}){
  const {isOnline,alerts}=useEnergyData(settings);
  const [form,setForm]=useState({...settings});
  const [saved,setSaved]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{updateSettings(form);setSaved(true);setTimeout(()=>setSaved(false),3000);};

  return(
    <Layout isOnline={isOnline} alertCount={alerts.length}>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="font-display text-2xl font-bold text-text">Settings</h1><p className="text-dim text-xs mt-0.5">Configure data source, pricing, and alerts</p></div>
        <button onClick={save} className="btn flex items-center gap-2">{saved?<CheckCircle size={13} className="text-success"/>:<Save size={13}/>}{saved?'Saved!':'Save Changes'}</button>
      </div>

      <div className="max-w-xl space-y-4">
        <div className="card">
          <div className="font-display font-semibold text-text mb-3">Data Source — Google Sheets</div>
          <label>Published CSV URL</label>
          <input type="text" value={form.sheetsUrl||''} onChange={e=>set('sheetsUrl',e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv"/>
          <div className="text-xs text-muted mt-1.5">File → Share → Publish to web → CSV → Copy URL. Paste it here AND in .env.local</div>
        </div>

        <div className="card">
          <div className="font-display font-semibold text-text mb-3">Electricity Pricing</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label>Currency</label><select value={form.currency||'PKR'} onChange={e=>set('currency',e.target.value)}>{CURR.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><label>Rate per kWh</label><input type="number" step="0.01" value={form.ratePerKwh||'25'} onChange={e=>set('ratePerKwh',e.target.value)} placeholder="25"/></div>
          </div>
          <div className="mt-2.5 p-2.5 bg-surface rounded-lg border border-border text-xs text-dim">Costs calculated at: <span className="text-accent font-mono">{form.currency} {form.ratePerKwh}/kWh</span></div>
        </div>

        <div className="card">
          <div className="font-display font-semibold text-text mb-3">Alert Settings</div>
          <div className="space-y-3">
            <div><label>Alert Email</label><input type="email" value={form.alertEmail||''} onChange={e=>set('alertEmail',e.target.value)} placeholder="yourname@gmail.com"/><div className="text-xs text-muted mt-1">Alerts: high usage, sensor offline, monthly limit</div></div>
            <div><label>Monthly Threshold (kWh)</label><input type="number" value={form.monthlyThreshold||'150'} onChange={e=>set('monthlyThreshold',e.target.value)} placeholder="150"/></div>
          </div>
        </div>

        <div className="card" style={{borderColor:'rgba(0,194,255,0.2)'}}>
          <div className="font-display font-semibold text-text mb-3">Gmail App Password Setup</div>
          <div className="space-y-2 text-xs text-dim">
            {['Go to Google Account → Security → enable 2-Step Verification','Search "App Passwords" in Google Account','Create App Password for "Mail" → get 16-char code','Add to .env.local: GMAIL_USER and GMAIL_APP_PASSWORD'].map((s,i)=>(
              <div key={i} className="flex gap-2"><span className="text-accent font-mono font-bold flex-shrink-0">{i+1}.</span><span>{s}</span></div>
            ))}
            <div className="bg-bg rounded-lg p-2.5 font-mono text-xs text-text border border-border mt-1">GMAIL_USER=your@gmail.com<br/>GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx</div>
          </div>
        </div>

        <div className="card">
          <div className="font-display font-semibold text-text mb-3">Deployment Links</div>
          {[{label:'Vercel Dashboard',url:'https://vercel.com/dashboard',desc:'Deploy this dashboard'},{label:'Hugging Face Spaces',url:'https://huggingface.co/spaces',desc:'Host Python ML models'},{label:'Google Sheets',url:'https://sheets.google.com',desc:'Your live sensor data'}].map(({label,url,desc})=>(
            <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-border hover:border-accent/40 transition-colors mb-2">
              <div><div className="text-text text-sm font-medium">{label}</div><div className="text-dim text-xs">{desc}</div></div>
              <ExternalLink size={12} className="text-dim flex-shrink-0"/>
            </a>
          ))}
        </div>

        <button onClick={save} className="btn w-full justify-center">{saved?<CheckCircle size={13} className="text-success"/>:<Save size={13}/>}{saved?'Saved!':'Save All Changes'}</button>
      </div>
    </Layout>
  );
}
