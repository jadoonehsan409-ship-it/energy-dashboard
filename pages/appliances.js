import { useState } from 'react';
import Layout from '../components/Layout';
import { useEnergyData } from '../hooks/useEnergyData';
import { getApplianceBreakdown } from '../lib/processData';
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,PieChart,Pie,Cell } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const AC={Refrigerator_ACTIVE:'#00C2FF',Refrigerator_IDLE:'#7DD3FC',LED_Bulbs:'#10B981',Mobile_Charger:'#C4B5FD',WashingMachine_WASH:'#F59E0B',WashingMachine_SPIN:'#FCD34D',Iron:'#EF4444',Water_Pump:'#86EFAC',Mixed_Load:'#94A3B8'};
const gc=(n)=>AC[n]||'#4A5568';
const PERIODS=[{label:'Today',days:1},{label:'7 Days',days:7},{label:'30 Days',days:30}];

export default function Appliances({settings}){
  const {rawData,isOnline,alerts,loading}=useEnergyData(settings);
  const [period,setPeriod]=useState(7);
  const cur=settings.currency||'PKR';
  const rate=parseFloat(settings.ratePerKwh||25);
  const bd=getApplianceBreakdown(rawData,period);
  const total=bd.reduce((s,a)=>s+a.kwh,0);

  const TT=({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return(<div className="card p-2.5 text-xs"><div className="font-medium text-text mb-1">{d.name?.replace(/_/g,' ')}</div><div style={{color:gc(d.name)}}>{d.kwh?.toFixed(3)} kWh</div><div className="text-dim">{total>0?Math.round(d.kwh/total*100):0}% of total</div><div className="text-success">{cur} {(d.kwh*rate).toFixed(2)}</div></div>);};

  return(
    <Layout isOnline={isOnline} alertCount={alerts.length}>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="font-display text-2xl font-bold text-text">Appliances</h1><p className="text-dim text-xs mt-0.5">Energy consumption by load type</p></div>
        <div className="flex gap-1.5">
          {PERIODS.map(({label,days})=>(
            <button key={days} onClick={()=>setPeriod(days)} className="text-xs px-2.5 py-1.5 rounded-lg border transition-all" style={{borderColor:period===days?'#00C2FF':'#1E2A45',color:period===days?'#00C2FF':'#94A3B8',background:period===days?'rgba(0,194,255,0.1)':'transparent'}}>{label}</button>
          ))}
        </div>
      </div>

      {loading?<div className="h-64 flex items-center justify-center text-dim text-sm">Loading...</div>:bd.length===0?<div className="h-64 flex items-center justify-center text-dim text-sm">No data for this period</div>:(
        <>
          {bd[0]&&total>0&&(bd[0].kwh/total)>0.5&&(
            <div className="abanner aw mb-4"><AlertTriangle size={14} className="flex-shrink-0"/><div><span className="font-medium">{bd[0].name?.replace(/_/g,' ')}</span> is using {Math.round(bd[0].kwh/total*100)}% of energy. Consider reducing usage time.</div></div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <div className="font-display font-semibold text-text mb-3">kWh by Appliance</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={bd.map(d=>({...d,sn:d.name.replace(/_/g,' ').slice(0,16)}))} layout="vertical" margin={{top:0,right:35,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" horizontal={false}/>
                  <XAxis type="number" tick={{fill:'#4A5568',fontSize:10}} tickLine={false} axisLine={false}/>
                  <YAxis type="category" dataKey="sn" tick={{fill:'#94A3B8',fontSize:10}} tickLine={false} width={105}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="kwh" radius={[0,4,4,0]}>{bd.map(e=><Cell key={e.name} fill={gc(e.name)} fillOpacity={0.85}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="font-display font-semibold text-text mb-3">Usage Share</div>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={bd} dataKey="kwh" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {bd.map(e=><Cell key={e.name} fill={gc(e.name)}/>)}
                  </Pie>
                  <Tooltip formatter={(v,n)=>[`${Number(v).toFixed(3)} kWh`,n.replace(/_/g,' ')]} contentStyle={{background:'#141B2E',border:'1px solid #1E2A45',borderRadius:'8px',fontSize:'11px'}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="font-display font-semibold text-text mb-3">Full Breakdown</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border">{['Appliance','kWh','Share',`Cost (${cur})`,'Recommendation'].map(h=><th key={h} className="text-left py-2 pr-3 text-dim font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {bd.map(app=>{
                    const share=total>0?Math.round(app.kwh/total*100):0;
                    return(
                      <tr key={app.name} className="border-b border-border/40 hover:bg-surface/50">
                        <td className="py-1.5 pr-3"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:gc(app.name)}}/><span className="text-text">{app.name.replace(/_/g,' ')}</span></div></td>
                        <td className="py-1.5 pr-3 font-mono" style={{color:gc(app.name)}}>{app.kwh.toFixed(3)}</td>
                        <td className="py-1.5 pr-3"><div className="flex items-center gap-2"><div className="h-1.5 bg-border rounded-full w-14"><div className="h-full rounded-full" style={{width:`${share}%`,background:gc(app.name)}}/></div><span className="font-mono text-dim">{share}%</span></div></td>
                        <td className="py-1.5 pr-3 font-mono text-success">{(app.kwh*rate).toFixed(2)}</td>
                        <td className="py-1.5 pr-3" style={{color:share>40?'#EF4444':share>25?'#F59E0B':'#10B981'}}>{share>40?'⚠ High — reduce usage':share>25?'↓ Moderate — monitor':'✓ Normal'}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-border"><td className="pt-2 font-medium text-text">Total</td><td className="pt-2 font-mono font-bold text-accent">{total.toFixed(3)}</td><td className="pt-2 font-mono text-dim">100%</td><td className="pt-2 font-mono font-bold text-success">{(total*rate).toFixed(2)}</td><td/></tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
