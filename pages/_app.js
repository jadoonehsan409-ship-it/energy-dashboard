import '../styles/globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import { useState, useEffect } from 'react';
export default function App({Component,pageProps}){
  const [settings,setSettings]=useState({ratePerKwh:'25',currency:'PKR',alertEmail:'',monthlyThreshold:'150',sheetsUrl:''});
  useEffect(()=>{try{const s=localStorage.getItem('es');if(s)setSettings(JSON.parse(s));}catch(e){}}, []);
  const updateSettings=(s)=>{setSettings(s);try{localStorage.setItem('es',JSON.stringify(s));}catch(e){}};
  return <Component {...pageProps} settings={settings} updateSettings={updateSettings}/>;
}
