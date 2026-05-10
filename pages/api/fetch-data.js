import { fetchSheetData } from '../../lib/fetchSheets';
export default async function handler(req,res) {
  const url=process.env.SHEETS_CSV_URL;
  if(!url) return res.status(400).json({error:'SHEETS_CSV_URL not set',data:[]});
  try{const data=await fetchSheetData(url);res.setHeader('Cache-Control','no-store');return res.json({data,fetchedAt:new Date().toISOString()});}
  catch(e){return res.status(500).json({error:e.message,data:[]});}
}
