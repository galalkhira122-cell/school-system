import React,{useEffect,useRef,useState} from "react";
import {Container,Paper,Typography,Button,TextField,MenuItem,Alert,Box} from "@mui/material";
import {callAPI} from "../api";

const weekdays=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

export default function AscSettings(){
 const [config,setConfig]=useState({days:{},periods:{},delay:10});
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [selectedFile,setSelectedFile]=useState(null);
 const [timetable,setTimetable]=useState(null);
 const fileInputRef=useRef(null);

 useEffect(()=>{callAPI("getAscSettings").then(r=>{if(r.success)setConfig(r.config);else setMessage(r.error||"تعذر تحميل الإعدادات");}).catch(e=>setMessage(String(e)));},[]);
 const update=(field,i,v)=>setConfig(old=>({...old,[field]:{...old[field],[i]:v}}));

 function chooseNewFile(){
   // مهم: تصفير القيمة يضمن فتح/قراءة الملف من جديد حتى لو كان بنفس الاسم.
   if(fileInputRef.current) fileInputRef.current.value="";
   fileInputRef.current?.click();
 }

 async function onFileSelected(e){
   const file=e.target.files?.[0];
   if(!file)return;
   setMessage("");
   setSelectedFile(file.name);
   try{
     const text=await file.text();
     const parsed=JSON.parse(text);
     const records=Array.isArray(parsed)?parsed:parsed.records;
     const unmatched=Array.isArray(parsed?.unmatched)?parsed.unmatched:[];
     if(!Array.isArray(records)||records.length===0)throw new Error("الملف لا يحتوي على records صالحة");
     setTimetable({records,unmatched});
     setMessage(`تم اختيار الجدول الجديد: ${file.name} — ${records.length} سجلًا. اضغط استيراد لإرساله إلى Google Sheets.`);
   }catch(err){
     setTimetable(null);
     setMessage("تعذر قراءة الجدول. اختر ملف JSON الخاص بجدول aSc بصيغة صحيحة.");
   }
 }

 async function saveSettings(){
   setBusy(true);
   try{const r=await callAPI("saveAscSettings",{config});setMessage(r.success?"تم حفظ المطابقة":r.error||"فشلت العملية");}
   catch(e){setMessage(String(e));}finally{setBusy(false);}
 }

 async function importTimetable(){
   if(!timetable?.records?.length){
     setMessage("يجب اختيار ملف الجدول الجديد أولًا.");
     chooseNewFile();
     return;
   }
   setBusy(true);
   try{
     const r=await callAPI("importAscTimetable",{records:timetable.records});
     setMessage(r.success?`تم استيراد الجدول الجديد بنجاح (${r.count} سجلًا) من الملف: ${selectedFile}`:r.error||"فشل استيراد الجدول");
   }catch(e){setMessage(String(e));}finally{setBusy(false);}
 }

 return <Container maxWidth="md" sx={{mt:3,mb:5}} dir="rtl"><Paper sx={{p:3}}>
  <Typography variant="h5" gutterBottom>إعداد جدول aSc Timetables</Typography>
  <Typography sx={{mb:2}}>عند تحديث الجدول يجب اختيار ملف الجدول الجديد من الجهاز. لا يتم استخدام أي جدول مرفق داخل البرنامج تلقائيًا.</Typography>
  {message&&<Alert severity="info" sx={{mb:2}}>{message}</Alert>}

  <Typography variant="h6">ترتيب أيام ملف aSc</Typography>
  {[1,2,3,4,5].map(i=><TextField key={i} select fullWidth margin="dense" label={"اليوم رقم "+i+" في ملف الجدول"} value={config.days?.[i]??""} onChange={e=>update("days",i,e.target.value)}><MenuItem value="">غير محدد</MenuItem>{weekdays.map((d,n)=><MenuItem key={n} value={String(n)}>{d}</MenuItem>)}</TextField>)}

  <Typography variant="h6" sx={{mt:3}}>مطابقة الحصص مع Sessions</Typography>
  {[1,2,3,4,5].map(i=><TextField key={i} select fullWidth margin="dense" label={"حصة aSc رقم "+i} value={config.periods?.[i]??""} onChange={e=>update("periods",i,e.target.value)}><MenuItem value="">غير مطابقة (لا تنبيه)</MenuItem>{[1,2,3,4,5].map(n=><MenuItem key={n} value={String(n)}>{"Session "+n}</MenuItem>)}</TextField>)}

  <Typography sx={{mt:2}}>المهلة: 10 دقائق. التنبيهات تظهر للإدارة فقط، مع جميع المعلمين المشتركين.</Typography>
  <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={onFileSelected} style={{display:"none"}} />
  <Box sx={{display:"flex",gap:2,mt:2,flexWrap:"wrap"}}>
   <Button variant="contained" disabled={busy} onClick={saveSettings}>حفظ المطابقة</Button>
   <Button variant="outlined" disabled={busy} onClick={chooseNewFile}>اختيار جدول جديد من الجهاز</Button>
   <Button variant="outlined" disabled={busy||!timetable} onClick={importTimetable}>استيراد الجدول الجديد إلى Google Sheets</Button>
  </Box>
  {selectedFile&&<Typography sx={{mt:2}}><b>الملف المختار حاليًا:</b> {selectedFile}</Typography>}
  {timetable?.unmatched?.length>0&&<details style={{marginTop:24}}><summary>خلايا لم يتم تفسيرها — لا تصدر تنبيهات ({timetable.unmatched.length})</summary><div style={{maxHeight:260,overflow:"auto"}}>{timetable.unmatched.map((r,i)=><p key={i}>اليوم {r.daySlot} / الحصة {r.period} / {r.teacher}: {r.raw}</p>)}</div></details>}
 </Paper></Container>;
}
