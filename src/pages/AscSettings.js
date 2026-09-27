import React,{useEffect,useRef,useState} from "react";
import {Container,Paper,Typography,Button,TextField,MenuItem,Alert,Box} from "@mui/material";
import * as XLSX from "xlsx";
import {callAPI} from "../api";

const weekdays=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

function normalizeKey(v){
  return String(v||"").trim().toLowerCase().replace(/[\s_\-]+/g,"");
}

function pick(obj,names){
  const keys=Object.keys(obj||{});
  for(const name of names){
    const wanted=normalizeKey(name);
    const found=keys.find(k=>normalizeKey(k)===wanted);
    if(found!==undefined)return obj[found];
  }
  return "";
}

function normalizeRecords(rows){
  return (Array.isArray(rows)?rows:[]).map(r=>({
    daySlot:Number(pick(r,["daySlot","DaySlot","day","اليوم","رقم اليوم"])),
    period:Number(pick(r,["period","Period","الحصة","رقم الحصة"])),
    className:String(pick(r,["className","Class","class","الفصل"])||"").trim(),
    teacher:String(pick(r,["teacher","Teacher","المعلم","اسم المعلم"])||"").trim(),
    raw:String(pick(r,["raw","OriginalCell","originalCell","الخلية الأصلية"])||"").trim()
  })).filter(r=>r.daySlot>=1&&r.daySlot<=5&&r.period>=1&&r.period<=5&&/^([123][A-D])$/.test(r.className)&&r.teacher);
}

async function readSelectedFile(file){
  const name=String(file?.name||"").toLowerCase();
  if(name.endsWith(".json")){
    const text=await file.text();
    const data=JSON.parse(text);
    const source=Array.isArray(data)?data:(data?.records||[]);
    const records=normalizeRecords(source);
    if(!records.length)throw new Error("ملف JSON لا يحتوي على سجلات جدول صالحة");
    return records;
  }

  if(name.endsWith(".xlsx")||name.endsWith(".xls")){
    const buffer=await file.arrayBuffer();
    const wb=XLSX.read(buffer,{type:"array"});
    let records=[];
    for(const sheetName of wb.SheetNames){
      const ws=wb.Sheets[sheetName];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:"",raw:false});
      records=records.concat(normalizeRecords(rows));
    }
    if(!records.length){
      throw new Error("لم أجد أعمدة DaySlot / Period / Class / Teacher في ملف Excel المختار");
    }
    return records;
  }

  throw new Error("اختر ملف JSON أو Excel بصيغة XLSX/XLS");
}

export default function AscSettings(){
 const [config,setConfig]=useState({days:{},periods:{},delay:10});
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [selectedFile,setSelectedFile]=useState("");
 const fileInputRef=useRef(null);

 useEffect(()=>{callAPI("getAscSettings").then(r=>{if(r.success)setConfig(r.config);else setMessage(r.error||"تعذر تحميل الإعدادات");}).catch(e=>setMessage(String(e)));},[]);
 const update=(field,i,v)=>setConfig(old=>({...old,[field]:{...old[field],[i]:v}}));

 async function saveSettings(){
   setBusy(true);
   try{
     const r=await callAPI("saveAscSettings",{config});
     setMessage(r.success?"تم حفظ المطابقة":r.error||"فشلت العملية");
   }catch(e){setMessage(String(e));}
   finally{setBusy(false);}
 }

 function chooseNewTimetable(){
   // مهم: تصفير القيمة يجبر المتصفح على فتح الاختيار ومعالجة الملف
   // حتى إذا اختار المستخدم نفس اسم الملف مرة أخرى.
   if(fileInputRef.current){
     fileInputRef.current.value="";
     fileInputRef.current.click();
   }
 }

 async function importSelectedTimetable(event){
   const file=event.target.files?.[0];
   if(!file)return; // الإلغاء لا يغيّر الجدول الحالي
   setBusy(true);
   setSelectedFile(file.name);
   setMessage("جاري قراءة الجدول الجديد...");
   try{
     const records=await readSelectedFile(file);
     const r=await callAPI("importAscTimetable",{records});
     setMessage(r.success?`تم استيراد الجدول الجديد (${r.count} سجلًا) من: ${file.name}`:r.error||"فشل استيراد الجدول");
   }catch(e){
     setMessage(e?.message||String(e));
   }finally{
     setBusy(false);
     // لا نحتفظ بالملف في input، وبالتالي الضغطة التالية تطلب ملفًا من جديد.
     if(fileInputRef.current)fileInputRef.current.value="";
   }
 }

 return <Container maxWidth="md" sx={{mt:3,mb:5}} dir="rtl"><Paper sx={{p:3}}>
 <Typography variant="h5" gutterBottom>إعداد جدول aSc Timetables</Typography>
 <Typography sx={{mb:2}}>عند كل استيراد سيُطلب منك اختيار ملف الجدول الجديد يدويًا. لن يتم استخدام ملف سابق تلقائيًا.</Typography>
 {selectedFile&&<Typography sx={{mb:2,fontWeight:700}}>آخر ملف تم اختياره: {selectedFile}</Typography>}
 {message&&<Alert severity="info" sx={{mb:2}}>{message}</Alert>}
 <input ref={fileInputRef} type="file" accept=".json,.xlsx,.xls,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={importSelectedTimetable} style={{display:"none"}} />
 <Typography variant="h6">ترتيب أيام ملف aSc</Typography>{[1,2,3,4,5].map(i=><TextField key={i} select fullWidth margin="dense" label={"اليوم رقم "+i+" في ملف الجدول"} value={config.days?.[i]??""} onChange={e=>update("days",i,e.target.value)}><MenuItem value="">غير محدد</MenuItem>{weekdays.map((d,n)=><MenuItem key={n} value={String(n)}>{d}</MenuItem>)}</TextField>)}
 <Typography variant="h6" sx={{mt:3}}>مطابقة الحصص مع Sessions</Typography>{[1,2,3,4,5].map(i=><TextField key={i} select fullWidth margin="dense" label={"حصة aSc رقم "+i} value={config.periods?.[i]??""} onChange={e=>update("periods",i,e.target.value)}><MenuItem value="">غير مطابقة (لا تنبيه)</MenuItem>{[1,2,3,4,5].map(n=><MenuItem key={n} value={String(n)}>{"Session "+n}</MenuItem>)}</TextField>)}
 <Typography sx={{mt:2}}>المهلة: 10 دقائق. التنبيهات تظهر للإدارة فقط، مع جميع المعلمين المشتركين.</Typography>
 <Box sx={{display:"flex",gap:2,mt:2,flexWrap:"wrap"}}>
   <Button variant="contained" disabled={busy} onClick={saveSettings}>حفظ المطابقة</Button>
   <Button variant="outlined" disabled={busy} onClick={chooseNewTimetable}>{busy?"جاري الاستيراد...":"اختيار واستيراد جدول جديد"}</Button>
 </Box>
 </Paper></Container>;
}
