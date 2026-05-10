import Papa from 'papaparse';
export async function fetchSheetData(url) {
  if(!url) return [];
  try {
    const res=await fetch(`${url}&t=${Date.now()}`,{cache:'no-store'});
    if(!res.ok) throw new Error('Fetch failed');
    const csv=await res.text();
    return new Promise(resolve=>{
      Papa.parse(csv,{header:true,skipEmptyLines:true,complete:({data})=>{
        resolve(data.map(r=>({time:r.Time||r.time||'',voltage:parseFloat(r.Voltage||r.voltage||0),current:parseFloat(r.Current||r.current||0),power:parseFloat(r.Power||r.power||0),energy:parseFloat(r.Energy||r.energy||0),frequency:parseFloat(r.Frequency||r.frequency||0),powerFactor:parseFloat(r['Power Factor']||r.power_factor||r.PowerFactor||0),loadLabel:r.Load_Label||r.load_label||r.LoadLabel||'Unknown'})).filter(r=>r.time&&!isNaN(r.power)));
      },error:()=>resolve([])});
    });
  } catch(e){console.error(e);return [];}
}
