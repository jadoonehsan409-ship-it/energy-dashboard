import { useState } from 'react';
import Layout from '../components/Layout';
import { useEnergyData } from '../hooks/useEnergyData';
import { AlertTriangle,WifiOff,Zap,Bell,CheckCircle,Mail } from 'lucide-react';
import { format } from 'date-fns';

const IC={HIGH_USAGE:Zap,SENSOR_OFFLINE:WifiOff,HIGH_APPLIANCE:AlertTriangle,MONTHLY_EXCEEDED:AlertTriangle,NO_DATA:WifiOff};
const SC={high:'#EF4444',warn:'#F59E0B',info:'#00C2FF'};
const SB={high:'rgba(239,68,68,0.08)',warn:'rgba(245,158,11,0.08)',info:'rgba(0,194,255,0.08)'};

export default function Alerts({settings}){
  const {alerts,isOnline}=useEnergyData(settings);
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);

  const sendTest=async()=>{
    if(!settings.alertEmail){alert('Set your email in Settings first');return;}
    setSending(true);
    try{await fetch('/api/send-alert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:settings.alertEmail,subject:'Test Alert',message:'Your Energy Monitor alerts are working correctly.',alertType:'HIGH_USAGE'})});setSent(true);setTimeout(()=>setSent(false),4000);}
    catch(e){alert('Failed. Check Gmail settings.');}
    setSending(false);
  };

  return(
    <Layout isOnline={isOnline} alertCount={alerts.filter(a=>!a.resolved).length}>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="font-display text-2xl font-bold text-text">Alerts</h1><p className="text-dim text-xs mt-0.5">{alerts.length===0?'No active alerts':`${alerts.length} active alert${alerts.length!==1?'s':''}`}</p></div>
        <div className="flex items-center gap-2">
          {sent&&<div className="flex items-center gap-1 text-xs text-success"><CheckCircle size={12}/>Sent!</div>}
          <button onClick={sendTest} disabled={sending} className="btn btn-sm"><Mail size={12}/>{sending?'Sending...':'Test Email'}</button>
        </div>
      </div>

      <div className="mb-5">
        <div className="text-xs text-dim font-medium uppercase tracking-wider mb-2">Active Now</div>
        {alerts.length===0?(
          <div className="card flex items-center gap-2.5 text-success"><CheckCircle size={15}/><span className="text-sm">All clear — no active alerts</span></div>
        ):(
          <div className="space-y-2">
            {alerts.map(a=>{const Icon=IC[a.type]||Bell;const col=SC[a.severity]||'#00C2FF';return(
              <div key={a.id} className="card flex items-start gap-3" style={{borderColor:col,borderLeftWidth:'3px',background:SB[a.severity]}}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:`${col}20`}}><Icon size={13} style={{color:col}}/></div>
                <div className="flex-1 min-w-0"><div className="font-medium text-sm text-text">{a.title}</div><div className="text-xs text-dim mt-0.5 leading-relaxed">{a.message}</div><div className="text-xs text-muted mt-1">{format(new Date(a.time),'dd MMM yyyy HH:mm')}</div></div>
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{color:col,background:`${col}15`}}>{a.severity}</span>
              </div>
            );})}
          </div>
        )}
      </div>

      <div className="card">
        <div className="font-display font-semibold text-text mb-3 flex items-center gap-2"><Bell size={13} className="text-accent"/>Alert Thresholds</div>
        <div className="space-y-0">
          {[
            {label:'High usage trigger',value:'20% above 7-day average',color:'#EF4444'},
            {label:'Sensor offline trigger',value:'No data for 2 minutes',color:'#EF4444'},
            {label:'Monthly threshold',value:`${settings.monthlyThreshold||150} kWh`,color:'#F59E0B'},
            {label:'Email alerts to',value:settings.alertEmail||'Not configured',color:'#00C2FF'},
          ].map(({label,value,color})=>(
            <div key={label} className="flex justify-between items-center py-2 border-b border-border/40 text-xs">
              <span className="text-dim">{label}</span><span className="font-mono" style={{color}}>{value}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-dim mt-3">Change thresholds in <span className="text-accent">Settings</span>.</div>
      </div>
    </Layout>
  );
}
