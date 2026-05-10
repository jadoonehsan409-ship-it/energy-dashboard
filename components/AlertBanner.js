import { AlertTriangle,WifiOff,Zap,X } from 'lucide-react';
const ICONS={HIGH_USAGE:Zap,SENSOR_OFFLINE:WifiOff,HIGH_APPLIANCE:AlertTriangle,MONTHLY_EXCEEDED:AlertTriangle,NO_DATA:WifiOff};
const CLS={high:'ah',warn:'aw',info:'ai'};
export default function AlertBanner({alert,onDismiss}){
  const Icon=ICONS[alert.type]||AlertTriangle;
  return(
    <div className={`abanner ${CLS[alert.severity]||'ai'}`}>
      <Icon size={14} className="flex-shrink-0 mt-0.5"/>
      <div className="flex-1 min-w-0"><div className="font-medium text-sm">{alert.title}</div><div className="text-xs opacity-80 mt-0.5">{alert.message}</div></div>
      {onDismiss&&<button onClick={()=>onDismiss(alert.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 ml-2"><X size={13}/></button>}
    </div>
  );
}
