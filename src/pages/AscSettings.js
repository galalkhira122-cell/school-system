import React,{useEffect,useRef,useState} from "react";
import {Container,Paper,Typography,Button,TextField,MenuItem,Alert,Box} from "@mui/material";
import * as XLSX from "xlsx";
import {callAPI} from "../api";

const weekdays=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const EN_DAYS={sunday:1,monday:2,tuesday:3,wednesday:4,thursday:5};

function parseAscWorkbook(arrayBuffer){
  const workbook=XLSX.read(arrayBuffer,{type:"array",cellDates:false});
  const sheet=workbook.Sheets[workbook.SheetNames[0]];
  if(!sheet)throw new Error("لم يتم العثور على ورقة داخل ملف Excel");

  const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:"",raw:false});
  if(rows.length<3)throw new Error("ملف الجدول لا يحتوي على بيانات كافية");

  // بعض ملفات aSc (ومنها الملف الحالي) يكون صف أسماء الأيام فارغًا،
  // بينما صف أرقام الحصص موجود. لذلك نكتشف صف الحصص أولًا ثم نستنتج
  // اليوم من تكرار الحصة رقم 1 بدل الاعتماد الإجباري على أسماء الأيام.
  let periodHeaderRow=-1;
  let bestHeaderScore=0;
  for(let r=0;r<Math.min(rows.length,6);r++){
    let score=0;
    for(let c=0;c<(rows[r]||[]).length;c++){
      const text=String(rows[r]?.[c]||"").trim();
      if(/^break\s*[12]\b/i.test(text) || /^\s*[1-5](?:\s|$)/.test(text))score++;
    }
    if(score>bestHeaderScore){bestHeaderScore=score;periodHeaderRow=r;}
  }
  if(periodHeaderRow<0 || bestHeaderScore<5)throw new Error("تعذر تحديد صف الحصص داخل ملف aSc");

  const dayByColumn={};
  const periodByColumn={};
  let inferredDaySlot=0;
  let previousPeriod=0;

  for(let c=0;c<(rows[periodHeaderRow]||[]).length;c++){
    const text=String(rows[periodHeaderRow]?.[c]||"").trim();
    if(!text)continue;
    if(/^break\b/i.test(text))continue;
    const m=text.match(/^\s*([1-5])(?:\s|$)/);
    if(!m)continue;
    const period=Number(m[1]);
    if(period===1 && (inferredDaySlot===0 || previousPeriod!==1))inferredDaySlot++;
    if(inferredDaySlot<1)inferredDaySlot=1;
    if(inferredDaySlot>5)continue;
    dayByColumn[c]=inferredDaySlot;
    periodByColumn[c]=period;
    previousPeriod=period;
  }

  if(!Object.keys(periodByColumn).length)throw new Error("لم يتم العثور على أعمدة Sessions داخل ملف aSc");

  const records=[];
  const unmatched=[];
  const seen=new Set();

  for(let r=periodHeaderRow+1;r<rows.length;r++){
    const teacher=String(rows[r]?.[0]||"").replace(/\s+/g," ").trim();
    if(!teacher)continue;

    Object.keys(periodByColumn).forEach(key=>{
      const c=Number(key);
      const raw=String(rows[r]?.[c]||"").trim();
      if(!raw)return;

      const normalized=raw.replace(/\r/g," ").replace(/\n/g," ");
      const classes=normalized.match(/[123][A-D]/gi)||[];
      const uniqueClasses=[...new Set(classes.map(x=>x.toUpperCase()))];

      if(!uniqueClasses.length){
        if(!/^break\b/i.test(raw))unmatched.push({daySlot:dayByColumn[c],period:periodByColumn[c],teacher,raw});
        return;
      }

      uniqueClasses.forEach(className=>{
        const rec={daySlot:dayByColumn[c],period:periodByColumn[c],className,teacher,raw};
        const id=[rec.daySlot,rec.period,rec.className,rec.teacher].join("|");
        if(!seen.has(id)){seen.add(id);records.push(rec);}
      });
    });
  }

  if(!records.length)throw new Error("لم يتم العثور على حصص صالحة في ملف aSc");
  return {records,unmatched,sheetName:workbook.SheetNames[0],periodHeaderRow:periodHeaderRow+1};
}

export default function AscSettings(){
 const [config,setConfig]=useState({days:{},periods:{},delay:10});
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [selectedFile,setSelectedFile]=useState("");
 const [timetable,setTimetable]=useState(null);
 const fileInputRef=useRef(null);

 useEffect(()=>{callAPI("getAscSettings").then(r=>{if(r.success)setConfig(r.config);else setMessage(r.error||"تعذر تحميل الإعدادات");}).catch(e=>setMessage(String(e)));},[]);
 const update=(field,i,v)=>setConfig(old=>({...old,[field]:{...old[field],[i]:v}}));

 function chooseNewFile(){
   if(fileInputRef.current)fileInputRef.current.value="";
   setSelectedFile("");
   setTimetable(null);
   fileInputRef.current?.click();
 }

 async function onFileSelected(e){
   const file=e.target.files?.[0];
   if(!file)return;
   setMessage("");
   setSelectedFile(file.name);
   setTimetable(null);
   try{
     const ext=file.name.split(".").pop()?.toLowerCase();
     if(!["xlsx","xls"].includes(ext))throw new Error("اختر ملف Excel بصيغة XLSX أو XLS");
     const buffer=await file.arrayBuffer();
     const parsed=parseAscWorkbook(buffer);
     setTimetable(parsed);
     setMessage(`تمت قراءة الجدول الجديد: ${file.name} — ${parsed.records.length} حصة صالحة. اضغط «استيراد الجدول الجديد» لإرساله إلى Google Sheets.`);
   }catch(err){
     setMessage(err?.message||"تعذر قراءة ملف جدول aSc");
   }
 }

 async function saveSettings(){
   setBusy(true);
   try{const r=await callAPI("saveAscSettings",{config});setMessage(r.success?"تم حفظ المطابقة":r.error||"فشلت العملية");}
   catch(e){setMessage(String(e));}finally{setBusy(false);}
 }

 async function importTimetable(){
   if(!timetable?.records?.length){
     setMessage("اختر ملف Excel الجديد أولًا.");
     chooseNewFile();
     return;
   }
   setBusy(true);
   try{
     const r=await callAPI("importAscTimetable",{records:timetable.records});
     if(r?.success){
       const check=await callAPI("getAscTimetableInfo");
       if(check?.success && Number(check.count)>0){
         setMessage(`تم الاستيراد فعليًا إلى ASC_Timetable — ${check.count} سجلًا من ${selectedFile}. تم التحقق من وجود البيانات داخل Google Sheets.`);
       }else{
         setMessage("أعاد الخادم نجاح الاستيراد، لكن التحقق وجد ASC_Timetable فارغًا. أعد نشر ملف doGet.gs المرفق ثم حاول مرة أخرى.");
       }
     }else setMessage(r?.error||"فشل استيراد الجدول");
   }catch(e){setMessage(String(e));}finally{setBusy(false);}
 }

 return <Container maxWidth="md" sx={{mt:3,mb:5}} dir="rtl"><Paper sx={{p:3}}>
  <Typography variant="h5" gutterBottom>إعداد جدول aSc Timetables</Typography>
  <Typography sx={{mb:2}}>في كل تحديث اختر ملف Excel الجديد من الجهاز. يتم قراءة تنسيق aSc الأصلي مباشرة، وتجاهل أعمدة Break، ثم استبدال بيانات ASC_Timetable بالجدول الجديد.</Typography>
  {message&&<Alert severity="info" sx={{mb:2}}>{message}</Alert>}

  <Typography variant="h6">ترتيب أيام ملف aSc</Typography>
  {[1,2,3,4,5].map(i=><TextField key={i} select fullWidth margin="dense" label={"اليوم رقم "+i+" في ملف الجدول"} value={config.days?.[i]??""} onChange={e=>update("days",i,e.target.value)}><MenuItem value="">غير محدد</MenuItem>{weekdays.map((d,n)=><MenuItem key={n} value={String(n)}>{d}</MenuItem>)}</TextField>)}

  <Typography variant="h6" sx={{mt:3}}>مطابقة الحصص مع Sessions</Typography>
  {[1,2,3,4,5].map(i=><TextField key={i} select fullWidth margin="dense" label={"حصة aSc رقم "+i} value={config.periods?.[i]??""} onChange={e=>update("periods",i,e.target.value)}><MenuItem value="">غير مطابقة (لا تنبيه)</MenuItem>{[1,2,3,4,5].map(n=><MenuItem key={n} value={String(n)}>{"Session "+n}</MenuItem>)}</TextField>)}

  <Typography sx={{mt:2}}>المهلة: 10 دقائق. التنبيهات تظهر للإدارة فقط، مع جميع المعلمين المشتركين.</Typography>
  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={onFileSelected} style={{display:"none"}} />
  <Box sx={{display:"flex",gap:2,mt:2,flexWrap:"wrap"}}>
   <Button variant="contained" disabled={busy} onClick={saveSettings}>حفظ المطابقة</Button>
   <Button variant="outlined" disabled={busy} onClick={chooseNewFile}>اختيار جدول Excel جديد</Button>
   <Button variant="outlined" disabled={busy||!timetable?.records?.length} onClick={importTimetable}>استيراد الجدول الجديد إلى Google Sheets</Button>
  </Box>
  {selectedFile&&<Typography sx={{mt:2}}><b>الملف المختار حاليًا:</b> {selectedFile}</Typography>}
  {timetable&&<Typography sx={{mt:1}}><b>الحصص التي سيتم استيرادها:</b> {timetable.records.length}</Typography>}
  {timetable?.unmatched?.length>0&&<details style={{marginTop:24}}><summary>خلايا غير مرتبطة بفصل — لن تصدر تنبيهات ({timetable.unmatched.length})</summary><div style={{maxHeight:260,overflow:"auto"}}>{timetable.unmatched.map((r,i)=><p key={i}>اليوم {r.daySlot} / الحصة {r.period} / {r.teacher}: {r.raw}</p>)}</div></details>}
 </Paper></Container>;
}
