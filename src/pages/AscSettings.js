import React,{useEffect,useState} from "react";
import {Container,Paper,Typography,Button,TextField,MenuItem,Alert,Box} from "@mui/material";
import {callAPI} from "../api";
import timetable from "../data/ascTimetable.json";
const weekdays=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
export default function AscSettings(){
 const [config,setConfig]=useState({days:{},periods:{},delay:10});const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 useEffect(()=>{callAPI("getAscSettings").then(r=>{if(r.success)setConfig(r.config);else setMessage(r.error||"تعذر تحميل الإعدادات");}).catch(e=>setMessage(String(e)));},[]);
 const update=(field,i,v)=>setConfig(old=>({...old,[field]:{...old[field],[i]:v}}));
 async function submit(action){setBusy(true);try{const r=await callAPI(action,action==="saveAscSettings"?{config}:{records:timetable.records});setMessage(r.success?action==="saveAscSettings"?"تم حفظ المطابقة":"تم استيراد "+r.count+" سجلًا":r.error||"فشلت العملية");}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 return <Container maxWidth="md" sx={{mt:3,mb:5}} dir="rtl"><Paper sx={{p:3}}><Typography variant="h5" gutterBottom>إعداد جدول aSc Timetables</Typography><Typography sx={{mb:2}}>المطابقة اليدوية مطلوبة قبل تفعيل التنبيهات. الملف المرفق: {timetable.records.length} سجلًا واضحًا، و{timetable.unmatched.length} خلايا غير مطابقة تحتاج مراجعة؛ لا تصدر عنها تنبيهات.</Typography>{message&&<Alert severity="info" sx={{mb:2}}>{message}</Alert>}
 <Typography variant="h6">ترتيب أيام ملف aSc</Typography>{[1,2,3,4,5].map(i=><TextField key={i} select fullWidth margin="dense" label={"اليوم رقم "+i+" في ملف الجدول"} value={config.days?.[i]??""} onChange={e=>update("days",i,e.target.value)}><MenuItem value="">غير محدد</MenuItem>{weekdays.map((d,n)=><MenuItem key={n} value={String(n)}>{d}</MenuItem>)}</TextField>)}
 <Typography variant="h6" sx={{mt:3}}>مطابقة الحصص مع Sessions</Typography>{[1,2,3,4,5].map(i=><TextField key={i} select fullWidth margin="dense" label={"حصة aSc رقم "+i} value={config.periods?.[i]??""} onChange={e=>update("periods",i,e.target.value)}><MenuItem value="">غير مطابقة (لا تنبيه)</MenuItem>{[1,2,3,4,5].map(n=><MenuItem key={n} value={String(n)}>{"Session "+n}</MenuItem>)}</TextField>)}
 <Typography sx={{mt:2}}>المهلة: 10 دقائق. التنبيهات تظهر للإدارة فقط، مع جميع المعلمين المشتركين.</Typography><Box sx={{display:"flex",gap:2,mt:2,flexWrap:"wrap"}}><Button variant="contained" disabled={busy} onClick={()=>submit("saveAscSettings")}>حفظ المطابقة</Button><Button variant="outlined" disabled={busy} onClick={()=>submit("importAscTimetable")}>استيراد الجدول المرفق إلى Google Sheets</Button></Box>
 {timetable.unmatched.length>0&&<details style={{marginTop:24}}><summary>خلايا لم يتم تفسيرها — لا تصدر تنبيهات ({timetable.unmatched.length})</summary><div style={{maxHeight:260,overflow:"auto"}}>{timetable.unmatched.map((r,i)=><p key={i}>اليوم {r.daySlot} / الحصة {r.period} / {r.teacher}: {r.raw}</p>)}</div></details>}
 </Paper></Container>;
}
