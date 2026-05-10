import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Zap,LayoutDashboard,Activity,TrendingUp,Cpu,Bell,Settings,Wifi,WifiOff,Menu,X } from 'lucide-react';
const NAV=[{href:'/',label:'Overview',icon:LayoutDashboard},{href:'/realtime',label:'Realtime',icon:Activity},{href:'/forecasting',label:'Forecast',icon:TrendingUp},{href:'/appliances',label:'Appliances',icon:Cpu},{href:'/alerts',label:'Alerts',icon:Bell},{href:'/settings',label:'Settings',icon:Settings}];
export default function Layout({children,isOnline=true,alertCount=0}){
  const {pathname}=useRouter();
  const [open,setOpen]=useState(false);
  const [time,setTime]=useState('');
  useEffect(()=>{const tick=()=>setTime(new Date().toLocaleTimeString('en-GB',{hour12:false}));tick();const id=setInterval(tick,1000);return()=>clearInterval(id);},[]);
  return(
    <div className="flex min-h-screen grid-bg">
      {open&&<div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={()=>setOpen(false)}/>}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col bg-surface border-r border-border w-52 transition-transform duration-200 ${open?'translate-x-0':'-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0"><Zap size={15} className="text-accent"/></div>
          <div><div className="font-display font-bold text-text text-sm leading-none">ENERGY</div><div className="font-display text-dim text-xs">MONITOR</div></div>
          <button className="ml-auto md:hidden" onClick={()=>setOpen(false)}><X size={15} className="text-dim"/></button>
        </div>
        <div className="px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2"><span className={`pulse-dot${isOnline?'':' off'}`}/><span className="text-xs font-mono text-dim">{isOnline?'ONLINE':'OFFLINE'}</span></div>
          <div className="font-mono text-xs text-muted mt-0.5">{time}</div>
        </div>
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({href,label,icon:Icon})=>(
            <Link key={href} href={href} className={`nav-a${pathname===href?' active':''}`} onClick={()=>setOpen(false)}>
              <Icon size={15}/><span>{label}</span>
              {label==='Alerts'&&alertCount>0&&<span className="ml-auto bg-danger text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-mono">{alertCount}</span>}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-border"><div className="text-xs text-muted font-mono">FYP · EE · 2024</div><div className="text-xs text-muted">AI Energy System v1.0</div></div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-20">
          <button className="md:hidden" onClick={()=>setOpen(true)}><Menu size={18} className="text-dim"/></button>
          <div className="flex items-center gap-1.5">{isOnline?<Wifi size={13} className="text-success"/>:<WifiOff size={13} className="text-danger"/>}<span className="text-xs font-mono text-dim">{isOnline?'Live · 30s refresh':'Connection lost'}</span></div>
          <span className="ml-auto font-mono text-xs text-dim hidden sm:block">{time}</span>
        </header>
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
