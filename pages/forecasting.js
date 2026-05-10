import Layout from '../components/Layout';
import { useEnergyData } from '../hooks/useEnergyData';
import { ComposedChart,Area,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,ReferenceLine,Legend } from 'recharts';
import { TrendingUp,Calendar } from 'lucide-react';
import { format,getDay } from 'date-fns';

const TT=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div className="card p-2.5 text-xs min-w-36"><div className="text-dim font-medium mb-1">{label}</div>{payload.map(p=>p.value!=null&&<div key={p.name} className="flex justify-between gap-3" style={{color:p.color||'#E2E8F0'}}><span>{p.name}</span><span className="font-mono">{Number(p.value).toFixed(3)} kWh</span></div>)}</div>);};
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Forecasting({settings}){
  const {daily,forecast,chartData,alerts,isOnline,loading}=useEnergyData(settings);
  const cur=settings.currency||'PKR';
  const rate=parseFloat(settings.ratePerKwh||25);
  const today=format(new Date(),'yyyy-MM-dd');
  const fTotal=forecast.reduce((s,f)=>s+f.yhat,0);

  const dowAvgs=()=>{
    const s=Array(7).fill(0),c=Array(7).fill(0);
    daily.forEach(({date,kwh})=>{const d=getDay(new Date(date));s[d]+=kwh;c[d]++;});
    const mx=Math.max(...s.map((x,i)=>c[i]>0?x/c[i]:0));
    return DOW.map((name,i)=>({name,avg:c[i]>0?parseFloat((s[i]/c[i]).toFixed(3)):0,max:mx,isWeekend:i===0||i===6}));
  };
  const dowData=dowAvgs();
  const last7=daily.slice(-7);
  const l7avg=last7.length?( last7.reduce((s,d)=>s+d.kwh,0)/last7.length).toFixed(3):'0.000';

  return(
    <Layout isOnline={isOnline} alertCount={alerts.length}>
      <div className="mb-5"><h1 className="font-display text-2xl font-bold text-text">Energy Forecast</h1><p className="text-dim text-xs mt-0.5">7-day prediction · weekly seasonality · ±1.5σ confidence bands</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        {forecast.slice(0,4).map(f=>(
          <div key={f.date} className="card text-center">
            <div className="text-xs text-dim mb-1">{format(new Date(f.date),'EEE dd MMM')}</div>
            <div className="font-mono text-xl font-bold text-amber">{f.yhat.toFixed(2)}</div>
            <div className="text-xs text-muted">kWh</div>
            <div className="text-xs text-dim mt-1">{f.yhat_lower.toFixed(2)}–{f.yhat_upper.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div><div className="font-display font-semibold text-text flex items-center gap-2"><TrendingUp size={14} className="text-amber"/>Historical + 7-Day Forecast</div><div className="text-xs text-dim mt-0.5">Shaded region = confidence band</div></div>
          <div className="text-right"><div className="text-xs text-dim">7-day total</div><div className="font-mono text-lg text-amber font-bold">{fTotal.toFixed(2)} kWh</div><div className="text-xs text-dim">{cur} {(fTotal*rate).toFixed(0)}</div></div>
        </div>
        {loading?<div className="h-72 flex items-center justify-center text-dim text-sm">Loading...</div>:chartData.length<5?<div className="h-72 flex items-center justify-center text-dim text-sm">Need 14+ days of data</div>:(
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{top:5,right:8,left:-18,bottom:0}}>
              <defs>
                <linearGradient id="ga2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00C2FF" stopOpacity={0.4}/><stop offset="95%" stopColor="#00C2FF" stopOpacity={0}/></linearGradient>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/><stop offset="95%" stopColor="#F59E0B" stopOpacity={0.03}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:'#4A5568',fontSize:10}} tickLine={false} tickFormatter={d=>d?d.slice(5):''} interval={3}/>
              <YAxis tick={{fill:'#4A5568',fontSize:10}} tickLine={false} axisLine={false}/>
              <Tooltip content={<TT/>}/>
              <Legend wrapperStyle={{fontSize:'11px',color:'#94A3B8',paddingTop:'8px'}}/>
              <ReferenceLine x={today} stroke="#4A5568" strokeDasharray="4 2" label={{value:'Today',fill:'#4A5568',fontSize:9}}/>
              <Area type="monotone" dataKey="yhat_upper" stroke="none" fill="url(#gc)" name="Upper" legendType="none" connectNulls={false}/>
              <Area type="monotone" dataKey="yhat_lower" stroke="none" fill="#080C18" name="Lower" legendType="none" connectNulls={false}/>
              <Area type="monotone" dataKey="actual" stroke="#00C2FF" fill="url(#ga2)" strokeWidth={2} dot={false} name="Actual (kWh)" connectNulls={false}/>
              <Line type="monotone" dataKey="yhat" stroke="#F59E0B" strokeWidth={2} strokeDasharray="6 3" dot={{fill:'#F59E0B',r:3}} name="Forecast (kWh)" connectNulls={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <div className="font-display font-semibold text-text mb-3 flex items-center gap-2"><Calendar size={13} className="text-accent"/>Day-of-Week Pattern</div>
          <div className="space-y-2">
            {dowData.map(({name,avg,max,isWeekend})=>(
              <div key={name} className="flex items-center gap-2">
                <span className="text-xs text-dim w-7">{name}</span>
                <div className="flex-1 h-4 bg-border/40 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:max>0?`${(avg/max)*100}%`:'0%',background:isWeekend?'#10B981':'#00C2FF'}}/></div>
                <span className="text-xs font-mono text-dim w-12 text-right">{avg.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="font-display font-semibold text-text mb-3">Next 7 Days</div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border"><th className="text-left py-1 text-dim font-medium">Date</th><th className="text-right py-1 text-dim font-medium">kWh</th><th className="text-right py-1 text-dim font-medium">Range</th><th className="text-right py-1 text-dim font-medium">{cur}</th></tr></thead>
            <tbody>
              {forecast.map(f=>(
                <tr key={f.date} className="border-b border-border/40">
                  <td className="py-1 text-dim">{format(new Date(f.date),'EEE dd/MM')}</td>
                  <td className="py-1 text-right font-mono text-amber">{f.yhat.toFixed(3)}</td>
                  <td className="py-1 text-right font-mono text-muted text-xs">{f.yhat_lower.toFixed(1)}–{f.yhat_upper.toFixed(1)}</td>
                  <td className="py-1 text-right font-mono text-success">{(f.yhat*rate).toFixed(0)}</td>
                </tr>
              ))}
              <tr className="border-t border-border"><td className="pt-1.5 font-medium text-text">Total</td><td className="pt-1.5 text-right font-mono font-bold text-amber">{fTotal.toFixed(3)}</td><td/><td className="pt-1.5 text-right font-mono font-bold text-success">{(fTotal*rate).toFixed(0)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{borderColor:'rgba(0,194,255,0.2)'}}>
        <div className="text-xs text-dim leading-relaxed"><span className="text-accent font-medium">How this forecast works: </span>Weekly seasonal decomposition on daily totals. Computes day-of-week baseline, applies 14-day linear trend, generates confidence bands from residual variance. Current 7-day avg: <span className="font-mono text-text">{l7avg} kWh/day</span>.</div>
      </div>
    </Layout>
  );
}
