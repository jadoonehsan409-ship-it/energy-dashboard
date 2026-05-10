import nodemailer from 'nodemailer';
export default async function handler(req,res) {
  if(req.method!=='POST') return res.status(405).end();
  const {to,subject,message,alertType}=req.body;
  if(!to||!subject) return res.status(400).json({error:'Missing fields'});
  const u=process.env.GMAIL_USER,p=process.env.GMAIL_APP_PASSWORD;
  if(!u||!p) return res.status(500).json({error:'Email not configured'});
  try{
    const t=nodemailer.createTransport({service:'gmail',auth:{user:u,pass:p}});
    const c=alertType==='HIGH_USAGE'||alertType==='SENSOR_OFFLINE'?'#EF4444':'#F59E0B';
    await t.sendMail({from:`"Energy Monitor" <${u}>`,to,subject:`⚡ Energy Alert: ${subject}`,html:`<div style="font-family:Arial,sans-serif;max-width:500px;background:#080C18;color:#E2E8F0;border-radius:12px;overflow:hidden"><div style="background:#0F1629;padding:20px;border-bottom:1px solid #1E2A45"><h2 style="margin:0;color:#00C2FF;font-size:17px">⚡ Energy Monitor Alert</h2></div><div style="padding:20px"><div style="background:#141B2E;border-left:3px solid ${c};padding:14px;border-radius:8px"><h3 style="margin:0 0 8px;color:${c};font-size:14px">${subject}</h3><p style="margin:0;color:#CBD5E1;font-size:13px">${message}</p></div><p style="color:#94A3B8;font-size:11px;margin-top:14px">Time: ${new Date().toLocaleString()} · Type: ${alertType}</p></div></div>`});
    return res.json({success:true});
  }catch(e){return res.status(500).json({error:e.message});}
}
