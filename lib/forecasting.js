import { format, addDays, getDay } from 'date-fns';
export function generateForecast(daily,days=7) {
  if(!daily||daily.length<14) return [];
  const sums=Array(7).fill(0),cnts=Array(7).fill(0);
  daily.forEach(({date,kwh})=>{const d=getDay(new Date(date));sums[d]+=kwh;cnts[d]++;});
  const gMean=daily.reduce((s,d)=>s+d.kwh,0)/daily.length;
  const si=sums.map((s,i)=>cnts[i]>0?(s/cnts[i])/gMean:1);
  const rec=daily.slice(-14),n=rec.length;
  const xs=rec.map((_,i)=>i),ys=rec.map(d=>d.kwh);
  const xm=xs.reduce((a,b)=>a+b,0)/n,ym=ys.reduce((a,b)=>a+b,0)/n;
  const slope=xs.reduce((s,x,i)=>s+(x-xm)*(ys[i]-ym),0)/xs.reduce((s,x)=>s+Math.pow(x-xm,2),0);
  const intercept=ym-slope*xm;
  const resStd=Math.sqrt(rec.map((d,i)=>Math.pow(d.kwh-(intercept+slope*i),2)).reduce((a,b)=>a+b,0)/n);
  const last=new Date(daily[daily.length-1].date);
  return Array.from({length:days},(_,i)=>{
    const fd=addDays(last,i+1),dow=getDay(fd);
    const yhat=Math.max(0,(intercept+slope*(n+i))*si[dow]);
    return {date:format(fd,'yyyy-MM-dd'),yhat:parseFloat(yhat.toFixed(3)),yhat_lower:parseFloat(Math.max(0,yhat-1.5*resStd).toFixed(3)),yhat_upper:parseFloat((yhat+1.5*resStd).toFixed(3)),isForecast:true};
  });
}
export function mergeForChart(daily,forecast) {
  return [...daily.map(d=>({date:d.date,actual:d.kwh,yhat:null,yhat_lower:null,yhat_upper:null})),...forecast.map(f=>({date:f.date,actual:null,yhat:f.yhat,yhat_lower:f.yhat_lower,yhat_upper:f.yhat_upper}))];
}
