import React,{ useEffect, useRef, useState } from "react";

import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  Snackbar,
  Alert,
  Chip,
  Box,
  FormControl,
  Select,
  MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import { callAPI } from "../api";

function Monitor(){

  const requestInFlight = useRef(false);
  const [rows,setRows] = useState([]);
  const [asc,setAsc] = useState({rows:[],configured:false});
  const [ascError,setAscError] = useState("");
  const [monitorError,setMonitorError] = useState("");
  const [monitorLastUpdated,setMonitorLastUpdated] = useState(null);
  const [ascLastUpdated,setAscLastUpdated] = useState(null);
  const [ascDebug,setAscDebug] = useState(null);
  const [registered,setRegistered] = useState([]);
  const [notRegistered,setNotRegistered] = useState([]);
  const [activeSession,setActiveSession] = useState(null);
  const [ticker,setTicker] = useState([]);
  const [reportOpen,setReportOpen] = useState(false);
  const [reportType,setReportType] = useState("daily");
  const [reportDate,setReportDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [report,setReport] = useState(null);
  const [reportBusy,setReportBusy] = useState(false);


  const [filter,setFilter] = useState("all");
  const [loading,setLoading] = useState(false);

  const [msg,setMsg] = useState("");
  const [msgType,setMsgType] = useState("success");

  useEffect(()=>{

    load();

    const timer =
      setInterval(load,30000);

    return ()=>clearInterval(timer);

  },[]);

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "success");
  }

  async function load(){
    if(requestInFlight.current)return;
    requestInFlight.current=true;
    setLoading(true);
    try{
      const alerts=await callAPI("getAscAlerts");
      const receivedAt=new Date().toLocaleString("en-GB");
      const alertRows=Array.isArray(alerts?.rows)?alerts.rows:[];
      const debug={
        receivedAt,
        success:alerts?.success,
        activeSession:alerts?.activeSession,
        late:alerts?.late,
        missed:alerts?.missed,
        lateRows:alertRows.filter(r=>r.status==="late").map(r=>({className:r.className,session:r.session})),
        computedLate:alertRows.filter(r=>r.status==="late").length,
        computedMissed:alertRows.filter(r=>r.status==="missed").length
      };
      console.log("ASC FRONTEND DEBUG",debug);
      setAscDebug(debug);
      if(alerts&&alerts.success){
        setAsc(alerts);
        setAscLastUpdated(receivedAt);
        setAscError("");
      }else setAscError(alerts?.error||"تعذر تحميل تنبيهات الجدول");
    }catch(error){
      console.error("ASC FRONTEND ERROR",error);
      setAscError(error?.message||String(error));
    }
    try{

      const res =
        await callAPI("getMonitorData");

      if(res && res.success){

        const arr =
          Array.isArray(res.rows)
            ? res.rows.map((r,index)=>({
                id:index,
                className:r.className,
                registered:r.registered,
                status:r.registered ? "تم التسجيل" : "لم يسجل",
                absentCount:r.absentCount || 0,
                presentCount:r.presentCount || 0,
                lastSession:r.lastSession || "-",
                lastColumn:r.lastColumn || "-",
                alertText:r.alertText || ""
              }))
            : [];

        setRows(arr);
        setRegistered(Array.isArray(res.registered) ? res.registered : []);
        setNotRegistered(Array.isArray(res.notRegistered) ? res.notRegistered : []);
        setActiveSession(res.activeSession || null);
        setMonitorLastUpdated(new Date().toLocaleString("en-GB"));
        setMonitorError("");

      }else{

        setMonitorError(res?.error || "فشل تحميل المتابعة");

      }

    }catch(error){
      console.error("getMonitorData",error);
      setMonitorError(error?.message || String(error));
    }finally{
      setLoading(false);
      requestInFlight.current=false;
    }

  }

  useEffect(()=>{
    const refresh=()=>callAPI("getTodayAbsenceSummary").then(data=>{
      const arr=Array.isArray(data)?data:Array.isArray(data?.result)?data.result:[];
      setTicker(arr.filter(x=>Number(x.count||0)>0));
    }).catch(()=>{});
    const first=setTimeout(refresh,5000);
    const timer=setInterval(refresh,120000);
    return ()=>{clearTimeout(first);clearInterval(timer);};
  },[]);

  async function openReport(type){
    setReportType(type);setReportOpen(true);setReport(null);
    await fetchReport(type,reportDate);
  }
  async function fetchReport(type,date){
    setReportBusy(true);
    try{
      const res=await callAPI("getTeacherRegistrationReport",{type,date});
      if(!res?.success)throw new Error(res?.error||"تعذر إنشاء التقرير");
      setReport(res);
    }catch(e){setReport(null);showMessage(e.message||String(e),"error");}
    finally{setReportBusy(false);}
  }
  function printReport(){
    if(!report)return;
    const escape=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    const rows=report.rows.map((r,i)=>`<tr><td>${i+1}</td><td>${escape(r.date)}</td><td>${escape(r.teacher)}</td><td>${escape(r.className)}</td><td>${escape("Session "+r.session)}</td><td>${escape(r.status)}</td><td>${escape(r.actualTeacher)}</td></tr>`).join("");
    const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير تسجيل المعلمين</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Arial,Tahoma,sans-serif}h2,p{text-align:center}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #333;padding:6px;text-align:center}th{background:#eee}thead{display:table-header-group}</style></head><body><h2>${reportType==="daily"?"التقرير اليومي":"التقرير الأسبوعي"} لتسجيل المعلمين</h2><p>المصدر: ${escape(report.source)} — التاريخ: ${escape(reportDate)} — الجلسات غير المسجلة: ${report.summary.missing}</p><table><thead><tr><th>م</th><th>التاريخ</th><th>المعلم المسؤول</th><th>الفصل</th><th>الجلسة</th><th>الحالة</th><th>المعلم المسجل فعليًا</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`;
    const win=window.open("","_blank");if(!win){showMessage("اسمح بالنوافذ المنبثقة للطباعة","warning");return;}
    win.document.open();win.document.write(html);win.document.close();
  }

  function copyAlert(row){

    const text =
      row.alertText ||
      "تنبيه: برجاء تسجيل غياب فصل " + row.className;

    navigator.clipboard
      .writeText(text)
      .then(()=>{
        showMessage("تم نسخ التنبيه","success");
      })
      .catch(()=>{
        showMessage(text,"info");
      });

  }

  const filteredRows =
    rows.filter(row=>{

      if(filter === "registered"){
        return row.registered;
      }

      if(filter === "notRegistered"){
        return !row.registered;
      }

      return true;

    });

  const columns = [

    {
      field:"className",
      headerName:"الفصل",
      width:120
    },

    {
      field:"status",
      headerName:"حالة التسجيل",
      width:160,
      renderCell:(params)=>(
        <Chip
          label={params.row.status}
          color={params.row.registered ? "success" : "error"}
          variant="filled"
        />
      )
    },

    {
      field:"presentCount",
      headerName:"عدد الحضور",
      width:130
    },

    {
      field:"absentCount",
      headerName:"عدد الغياب",
      width:130
    },

    {
      field:"lastSession",
      headerName:"آخر Session",
      width:160
    },

    {
      field:"lastColumn",
      headerName:"آخر عمود تسجيل",
      flex:1,
      minWidth:220
    },

    {
      field:"alert",
      headerName:"تنبيه",
      width:150,
      sortable:false,
      filterable:false,
      renderCell:(params)=>(
        <Button
          size="small"
          variant="contained"
          color={params.row.registered ? "inherit" : "error"}
          disabled={params.row.registered}
          onClick={()=>copyAlert(params.row)}
        >
          نسخ تنبيه
        </Button>
      )
    }

  ];

  return(

    <Container maxWidth="xl" style={{marginTop:"20px"}}>
      <Paper elevation={4} sx={{mb:2,p:1.5,borderRadius:3,background:"linear-gradient(90deg,#0f172a,#1e293b)",color:"white",overflow:"hidden"}}>
        <Box sx={{display:"flex",alignItems:"center",gap:2}}>
          <Typography sx={{fontWeight:800,whiteSpace:"nowrap",color:"#fca5a5"}}>🚨 أخبار الغياب</Typography>
          <Box sx={{flex:1,overflow:"hidden",whiteSpace:"nowrap"}}>
            <Box sx={{display:"inline-block",animation:"monitorTicker 24s linear infinite"}}>
              {ticker.length?ticker.map((r,i)=><Chip key={i} label={`${r.className} — ${r.count} غياب`} color="error" sx={{mx:1}}/>):"لا يوجد غياب مسجل اليوم"}
            </Box>
          </Box>
        </Box>
        <style>{`@keyframes monitorTicker {from{transform:translateX(100%)}to{transform:translateX(-100%)}}`}</style>
      </Paper>
      <Box sx={{display:"flex",gap:2,mb:2,flexWrap:"wrap"}}>
        <Button variant="contained" color="error" onClick={()=>openReport("daily")}>تقرير المعلمين اليومي</Button>
        <Button variant="contained" color="primary" onClick={()=>openReport("weekly")}>تقرير المعلمين الأسبوعي</Button>
      </Box>
      <Dialog open={reportOpen} onClose={()=>!reportBusy&&setReportOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>{reportType==="daily"?"تقرير تسجيل المعلمين اليومي — Sheet1":"تقرير تسجيل المعلمين الأسبوعي — حفظ الغياب اليومي"}</DialogTitle>
        <DialogContent>
          <Box sx={{display:"flex",gap:2,my:2,alignItems:"center",flexWrap:"wrap"}}>
            <TextField label={reportType==="daily"?"التاريخ":"أي يوم من الأسبوع المطلوب"} type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} InputLabelProps={{shrink:true}}/>
            <Button variant="contained" disabled={reportBusy} onClick={()=>fetchReport(reportType,reportDate)}>عرض التقرير</Button>
          </Box>
          {reportBusy&&<Alert severity="info">جارٍ إعداد التقرير...</Alert>}
          {report&&<>
            <Alert severity="info" sx={{mb:2}}>المصدر: {report.source} — الجلسات المطلوبة: {report.summary.expected} — المسجلة: {report.summary.registered} — غير المسجلة: {report.summary.missing} — سجلها معلم آخر: {report.summary.mismatch} — دون اسم معلم: {report.summary.unknown||0}</Alert>
            <Box sx={{overflowX:"auto",maxHeight:510}}><table style={{width:"100%",borderCollapse:"collapse",direction:"rtl"}}><thead><tr>{["التاريخ","المعلم المسؤول","الفصل","الجلسة","الحالة","المعلم المسجل فعليًا"].map(h=><th key={h} style={{padding:8,border:"1px solid #ddd"}}>{h}</th>)}</tr></thead><tbody>{report.rows.map((r,i)=><tr key={i} style={{background:r.status==="لم يسجل"?"#fee2e2":r.status==="سجل معلم آخر"?"#fef3c7":"transparent"}}>{[r.date,r.teacher,r.className,"Session "+r.session,r.status,r.actualTeacher].map((v,j)=><td key={j} style={{padding:8,border:"1px solid #ddd"}}>{v}</td>)}</tr>)}</tbody></table></Box>
          </>}
        </DialogContent>
        <DialogActions><Button disabled={!report||reportBusy} onClick={printReport}>طباعة / PDF</Button><Button onClick={()=>setReportOpen(false)}>إغلاق</Button></DialogActions>
      </Dialog>

      <Paper sx={{p:3,mb:3,border:"2px solid #1d4ed8",borderRadius:3}}>
        <Typography variant="h5" sx={{mb:2,fontWeight:700}}>تنبيهات جدول aSc — مهلة 10 دقائق</Typography>
        <Paper variant="outlined" sx={{p:1.5,mb:2,backgroundColor:"#eff6ff"}}>
          <Typography variant="body2" sx={{fontWeight:700}}>تشخيص تنبيهات aSc</Typography>
          <Typography variant="body2">آخر تحديث ناجح: {ascLastUpdated||"لم يكتمل بعد"}</Typography>
          <Typography variant="body2">السشن النشطة من الخادم: {ascDebug?.activeSession??"غير متاحة"} | late من الخادم: {ascDebug?.late??"-"} | missed من الخادم: {ascDebug?.missed??"-"}</Typography>
          <Typography variant="body2">المحسوب من الصفوف: late = {ascDebug?.computedLate??"-"} | missed = {ascDebug?.computedMissed??"-"}</Typography>
          <Typography variant="caption">وقت استلام آخر استجابة: {ascDebug?.receivedAt||"-"} — التفاصيل في Console تحت ASC FRONTEND DEBUG.</Typography>
        </Paper>
        {ascError&&<Alert severity="warning" sx={{mb:1}}>تعذر تحديث تنبيهات aSc مؤقتًا؛ تُعرض آخر بيانات ناجحة ({ascLastUpdated || "لا توجد بيانات سابقة"}). التفاصيل: {ascError}</Alert>}
        {!asc.configured&&<Alert severity="warning">استورد جدول aSc من صفحة إعداد جدول aSc وحدد مطابقة الأيام والحصص أولًا.</Alert>}
        {asc.configured&&asc.message&&<Alert severity="info">{asc.message}</Alert>}
        {asc.configured&&<Typography sx={{mb:2}}>تم التسجيل: {(asc.rows||[]).filter(r=>r.status==="saved").length} | متأخر الآن: {(asc.rows||[]).filter(r=>r.status==="late").length} | لم يسجل بعد انتهاء السشن: {(asc.rows||[]).filter(r=>r.status==="missed").length}</Typography>}
        {(asc.rows||[]).filter(r=>r.status==="saved").map((r,i)=><Alert key={"saved-"+i} severity="success" sx={{mb:1}}>
          ✅ تم التسجيل — الفصل {r.className} — Session {r.session} — المعلمون: {(r.teachers||[]).length ? r.teachers.join("، ") : "غير محدد في جدول aSc"}
        </Alert>)}
        {(asc.rows||[]).filter(r=>r.status==="late").map((r,i)=><Alert key={"active-"+i} severity={r.status==="late"?"error":"info"} sx={{mb:1}}>
          الفصل {r.className} — Session {r.session} — المعلمون: {(r.teachers||[]).length ? r.teachers.join("، ") : "غير محدد في جدول aSc"} — تأخر تسجيل الغياب
        </Alert>)}
        {(asc.rows||[]).some(r=>r.status==="missed")&&<Typography variant="h6" sx={{mt:2,mb:1}}>السشن المنتهية دون تسجيل</Typography>}
        {(asc.rows||[]).filter(r=>r.status==="missed").map((r,i)=><Alert key={"missed-"+i} severity="error" sx={{mb:1}}>
          ❌ لم يتم التسجيل — الفصل {r.className} — Session {r.session} — المعلمون: {(r.teachers||[]).length ? r.teachers.join("، ") : "غير محدد في جدول aSc"}
        </Alert>)}
      </Paper>

      {monitorError && <Alert severity="warning" sx={{mb:2}}>تعذر تحديث المتابعة مؤقتًا؛ تُعرض آخر بيانات ناجحة ({monitorLastUpdated || "لا توجد بيانات سابقة"}). التفاصيل: {monitorError}</Alert>}
      <Typography
        variant="h4"
        gutterBottom
        style={{
          fontWeight:"bold",
          color:"#0f172a"
        }}
      >
        متابعة تسجيل الغياب (الإحصاء العام السابق)
      </Typography>

      <Paper
        elevation={4}
        style={{
          padding:"18px 22px",
          borderRadius:"18px",
          marginBottom:"20px",
          background:"linear-gradient(90deg,#0f172a,#1e293b)",
          color:"#fff"
        }}
      >
        <Typography variant="h6" style={{fontWeight:"bold"}}>
          Session النشطة: {activeSession ? activeSession.name : "لا توجد Session نشطة"}
        </Typography>

        {activeSession && (
          <Typography style={{marginTop:"6px",color:"#cbd5e1"}}>
            التوقيت: {activeSession.time || "-"}
          </Typography>
        )}
      </Paper>

      <Grid container spacing={2} style={{marginBottom:"20px"}}>

        <Grid item xs={12} md={3}>
          <Card style={{borderRadius:"18px",background:"#e8f5e9"}}>
            <CardContent>
              <Typography fontWeight="bold">
                الفصول التي سجلت
              </Typography>
              <Typography variant="h4">
                {registered.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card style={{borderRadius:"18px",background:"#ffebee"}}>
            <CardContent>
              <Typography fontWeight="bold">
                الفصول المتأخرة
              </Typography>
              <Typography variant="h4">
                {notRegistered.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card style={{borderRadius:"18px",background:"#e3f2fd"}}>
            <CardContent>
              <Typography fontWeight="bold">
                إجمالي الفصول
              </Typography>
              <Typography variant="h4">
                {rows.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card style={{borderRadius:"18px",background:"#fff3e0"}}>
            <CardContent>
              <Typography fontWeight="bold">
                حالة التحديث
              </Typography>
              <Typography variant="h5">
                {loading ? "جاري التحديث..." : monitorError ? "تعذر التحديث" : monitorLastUpdated ? "آخر تحديث: " + monitorLastUpdated : "لم تُحمّل البيانات بعد"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Paper
        elevation={4}
        style={{
          padding:"18px",
          marginBottom:"20px",
          borderRadius:"18px"
        }}
      >
        <Grid container spacing={2} alignItems="center">

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <Select
                value={filter}
                onChange={(e)=>setFilter(e.target.value)}
              >
                <MenuItem value="all">كل الفصول</MenuItem>
                <MenuItem value="registered">الفصول المسجلة</MenuItem>
                <MenuItem value="notRegistered">الفصول المتأخرة</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={load}
              disabled={loading}
              style={{
                height:"56px",
                borderRadius:"12px",
                fontWeight:"bold"
              }}
            >
              تحديث الآن
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              style={{
                display:"flex",
                gap:"10px",
                flexWrap:"wrap"
              }}
            >
              {notRegistered.length === 0 ? (
                <Chip
                  label="لا توجد فصول متأخرة"
                  color="success"
                  variant="filled"
                />
              ) : (
                notRegistered.map((item,index)=>(
                  <Chip
                    key={index}
                    label={item.className}
                    color="error"
                    variant="filled"
                  />
                ))
              )}
            </Box>
          </Grid>

        </Grid>
      </Paper>

      <Paper
        elevation={4}
        style={{
          width:"100%",
          borderRadius:"18px",
          overflow:"hidden"
        }}
      >
        <div style={{height:"620px",width:"100%"}}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10,20,50]}
            disableSelectionOnClick
            getRowClassName={(params)=>
              params.row.registered
                ? "registered-row"
                : "late-row"
            }
          />
        </div>

        <style>
          {`
            .registered-row {
              background-color: #f0fdf4;
            }

            .late-row {
              background-color: #fef2f2;
            }
          `}
        </style>
      </Paper>

      <Snackbar
        open={Boolean(msg)}
        autoHideDuration={3000}
        onClose={()=>setMsg("")}
        anchorOrigin={{
          vertical:"top",
          horizontal:"center"
        }}
      >
        <Alert
          severity={msgType}
          variant="filled"
          onClose={()=>setMsg("")}
        >
          {msg}
        </Alert>
      </Snackbar>

    </Container>

  );

}

export default Monitor;