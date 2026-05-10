import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useEnergyData } from '../hooks/useEnergyData';
import DatePicker from 'react-datepicker';
import { LineChart,Line,AreaChart,Area,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Legend } from 'recharts';
import { filterByDateRange } from '../lib/processData';
import { format } from 'date-fns';
import { Activity,RefreshCw } from 'lucide-react';

const METRICS=[{key:'power',label:'Power',unit:'W',color:'#00C2FF'},{key:'voltage',label:'Voltage',unit:'V',color:'#86EFAC'},{key:'current',label:'Current',unit:'A',color:'#FCD34D'},{key:'powerFactor',label:'PF',unit:'',color:'#C4B5FD'}];
const TT=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div className="card p-2.5 text-xs"><div className="text-dim mb-1">{label}</div>{payload.map(p=>p.value!=null&&<div key={p.name} style={{color:p.color||'#E2E8F0'}}>{p.name}: {Number(p.value).toFixed(2)}</div>)}</div>);};

export default function Realtime({settings}){
  const {rawData,loading,isOnline,alerts,refetch,lastFetch}=useEnergyData(settings);
  const [from,setFrom]=useState(null);
  const [to,setTo]=useState(null);
  const [metric,setMetric]=useState('power');
  const [showAll,setShowAll]=useState(false);

  const filtered=useMemo(()=>{
    let d=from||to?filterByDateRange(rawData,from,to):rawData.slice(-200);
    return d.map(r=>({...r,tl:r.time?format(new Date(r.time),'HH:mm:ss'):'',dl:r.time?format(new Date(r.time),'dd/MM HH:mm'):''}));
  },[rawData,from,to]);

  const m=METRICS.find(x=>x.key===metric)||METRICS[0];

  return(
    <Layout isOnline={isOnline} alertCount={alerts.length}>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="font-display text-2xl font-bold text-text">Realtime Monitor</h1><p className="text-dim text-xs mt-0.5">{filtered.length} readings · {lastFetch?format(new Date(lastFetch),'HH:mm:ss'):''}</p></div>
        <button onClick={refetch} className="btn btn-sm"><RefreshCw size={12}/>Refresh</button>
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2"><span className="text-xs text-dim">From</span><DatePicker selected={from} onChange={setFrom} placeholderText="Start" className="w-28 text-xs" dateFormat="dd/MM/yyyy"/></div>
        <div className="flex items-center gap-2"><span className="text-xs text-dim">To</span><DatePicker selected={to} onChange={setTo} minDate={from} placeholderText="End" className="w-28 text-xs" dateFormat="dd/MM/yyyy"/></div>
        {(from||to)&&<button className="btn btn-sm" onClick={()=>{setFrom(null);setTo(null);}}>Clear</button>}
        <div className="ml-auto flex gap-1.5 flex-wrap">
          {METRICS.map(mx=>(
            <button key={mx.key} onClick={()=>setMetric(mx.key)} className="text-xs px-2.5 py-1 rounded-lg border transition-all" style={{borderColor:metric===mx.key?mx.color:'#1E2A45',color:metric===mx.key?mx.color:'#94A3B8',background:metric===mx.key?`${mx.color}15`:'transparent'}}>{mx.label}</button>
          ))}
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3"><Activity size={14} style={{color:m.color}}/><span className="font-display font-semibold text-text">{m.label} ({m.unit})</span></div>
        {loading?<div className="h-64 flex items-center justify-center text-dim text-sm">Loading...</div>:filtered.length===0?<div className="h-64 flex items-center justify-center text-dim text-sm">No data for selected range</div>:(
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={filtered} margin={{top:5,right:8,left:-22,bottom:0}}>
              <defs><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={m.color} stopOpacity={0.3}/><stop offset="95%" stopColor={m.color} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false}/>
              <XAxis dataKey={from||to?'dl':'tl'} tick={{fill:'#4A5568',fontSize:10}} tickLine={false} interval={Math.floor(filtered.length/7)}/>
              <YAxis tick={{fill:'#4A5568',fontSize:10}} tickLine={false} axisLine={false}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotone" dataKey={m.key} stroke={m.color} fill="url(#gm)" strokeWidth={1.5} dot={false} name={m.label}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card mb-4">
        <div className="font-display font-semibold text-text mb-3">Power vs Current</div>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={filtered} margin={{top:5,right:8,left:-22,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false}/>
            <XAxis dataKey="tl" tick={{fill:'#4A5568',fontSize:9}} tickLine={false} interval={Math.floor(filtered.length/6)}/>
            <YAxis yAxisId="l" tick={{fill:'#4A5568',fontSize:9}} tickLine={false} axisLine={false}/>
            <YAxis yAxisId="r" orientation="right" tick={{fill:'#4A5568',fontSize:9}} tickLine={false} axisLine={false}/>
            <Tooltip content={<TT/>}/>
            <Legend wrapperStyle={{fontSize:'11px',color:'#94A3B8'}}/>
            <Line yAxisId="l" type="monotone" dataKey="power" stroke="#00C2FF" dot={false} strokeWidth={1.5} name="Power (W)"/>
            <Line yAxisId="r" type="monotone" dataKey="current" stroke="#FCD34D" dot={false} strokeWidth={1.5} name="Current (A)"/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-semibold text-text">Raw Readings</span>
          <button className="text-xs text-dim hover:text-accent transition-colors" onClick={()=>setShowAll(!showAll)}>{showAll?'Show less':'Show all'}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border">{['Time','Voltage','Current','Power','PF','Hz','Load'].map(h=><th key={h} className="text-left py-1.5 pr-3 text-dim font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {(showAll?filtered:filtered.slice(-12)).reverse().map((r,i)=>(
                <tr key={i} className="border-b border-border/40 hover:bg-surface/50">
                  <td className="py-1.5 pr-3 font-mono text-dim text-xs">{r.dl}</td>
                  <td className="py-1.5 pr-3 font-mono" style={{color:'#86EFAC'}}>{r.voltage?.toFixed(1)}</td>
                  <td className="py-1.5 pr-3 font-mono" style={{color:'#FCD34D'}}>{r.current?.toFixed(3)}</td>
                  <td className="py-1.5 pr-3 font-mono" style={{color:'#00C2FF'}}>{r.power?.toFixed(1)}</td>
                  <td className="py-1.5 pr-3 font-mono" style={{color:'#C4B5FD'}}>{r.powerFactor?.toFixed(3)}</td>
                  <td className="py-1.5 pr-3 font-mono text-dim">{r.frequency?.toFixed(1)}</td>
                  <td className="py-1.5 pr-3"><span className="px-1.5 py-0.5 rounded text-xs bg-accent/10 text-accent">{r.loadLabel?.replace(/_/g,' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
