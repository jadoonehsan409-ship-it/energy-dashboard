import { useEffect, useRef } from 'react';
export default function LiveGauge({value=0,max=3000,label='Watts',color='#00C2FF'}){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2,r=W*.38,pct=Math.min(value/max,1);
    ctx.clearRect(0,0,W,H);
    ctx.beginPath();ctx.arc(cx,cy,r,Math.PI*.75,Math.PI*2.25);ctx.strokeStyle='#1E2A45';ctx.lineWidth=10;ctx.lineCap='round';ctx.stroke();
    if(pct>0){
      const g=ctx.createLinearGradient(0,0,W,0);g.addColorStop(0,color);g.addColorStop(1,pct>.7?'#EF4444':color);
      ctx.beginPath();ctx.arc(cx,cy,r,Math.PI*.75,Math.PI*.75+pct*Math.PI*1.5);ctx.strokeStyle=g;ctx.lineWidth=10;ctx.lineCap='round';ctx.stroke();
    }
    ctx.fillStyle='#E2E8F0';ctx.font='bold 26px "IBM Plex Mono"';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(Math.round(value),cx,cy-5);
    ctx.fillStyle='#94A3B8';ctx.font='11px "DM Sans"';ctx.fillText(label,cx,cy+14);
  },[value,max,label,color]);
  return <canvas ref={ref} width={170} height={170}/>;
}
