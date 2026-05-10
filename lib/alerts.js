import { detectAnomaly, getApplianceBreakdown } from './processData';
export function generateAlerts(data,settings={}) {
  const alerts=[],now=new Date();
  if(!data?.length){alerts.push({id:'no-data',type:'NO_DATA',severity:'high',title:'No sensor data',message:'Dashboard is not receiving data. Check your Google Sheets connection.',time:now.toISOString()});return alerts;}
  const last=data[data.length-1],mins=(now-new Date(last.time))/60000;
  if(mins>2) alerts.push({id:'offline',type:'SENSOR_OFFLINE',severity:'high',title:'Sensor offline / No power',message:`No data for ${Math.round(mins)} min. Meter may be off or sensor disconnected.`,time:now.toISOString()});
  const an=detectAnomaly(data);
  if(an.isAnomaly&&an.percentAbove>20) alerts.push({id:'high-use',type:'HIGH_USAGE',severity:an.percentAbove>50?'high':'warn',title:`Usage ${an.percentAbove}% above normal`,message:`Today: ${an.todayKwh} kWh vs avg ${an.avgKwh} kWh. Bill may be higher than usual.`,time:now.toISOString()});
  const bd=getApplianceBreakdown(data,1),total=bd.reduce((s,a)=>s+a.kwh,0);
  if(bd[0]&&total>1&&(bd[0].kwh/total)>0.6) alerts.push({id:'hi-app',type:'HIGH_APPLIANCE',severity:'warn',title:`${bd[0].name.replace(/_/g,' ')} using ${Math.round(bd[0].kwh/total*100)}% of energy`,message:`${bd[0].name.replace(/_/g,' ')} consumed ${bd[0].kwh.toFixed(2)} kWh today. Consider reducing usage.`,time:now.toISOString()});
  if(settings.currentMonthKwh&&settings.monthlyThreshold&&settings.currentMonthKwh>settings.monthlyThreshold) alerts.push({id:'monthly',type:'MONTHLY_EXCEEDED',severity:'high',title:'Monthly limit exceeded',message:`Used ${settings.currentMonthKwh} kWh this month, exceeding your ${settings.monthlyThreshold} kWh limit.`,time:now.toISOString()});
  return alerts;
}
