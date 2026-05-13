import React,{ useEffect, useState } from "react";

import {
  Container,
  Typography,
  Grid,
  Button,
  Paper,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import { callAPI } from "../api";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function LabelBox({ title, children }){

  return(
    <Box>
      <Typography
        variant="subtitle1"
        style={{
          fontWeight:"bold",
          marginBottom:"6px",
          color:"#1e293b"
        }}
      >
        {title}
      </Typography>

      {children}
    </Box>
  );

}

function Attendance({ user }){

  const [classes,setClasses] = useState([]);
  const [teachers,setTeachers] = useState([]);
  const [students,setStudents] = useState([]);
  const [sessions,setSessions] = useState([]);
  const [parentPhones,setParentPhones] = useState({});

  const [selectedClass,setSelectedClass] = useState("");
  const [teacher,setTeacher] = useState("");

  const [lang,setLang] = useState("all");
  const [section,setSection] = useState("all");

  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(false);

  const [msg,setMsg] = useState("");
  const [msgType,setMsgType] = useState("success");

  const [activeSession,setActiveSession] = useState(null);
  const [manualSession,setManualSession] = useState("");

  const [todaySummary,setTodaySummary] = useState([]);
  const [nowText,setNowText] = useState("");

  const [whatsappOpen,setWhatsappOpen] = useState(false);
  const [whatsappList,setWhatsappList] = useState([]);

  useEffect(()=>{
    loadData();
  },[]);

  useEffect(()=>{
    if(user && user.role === "Teacher"){
      setTeacher(user.username);
    }
  },[user]);

  useEffect(()=>{
    updateClock();
    const timer = setInterval(updateClock,1000);
    return ()=>clearInterval(timer);
  },[]);

  useEffect(()=>{
    loadTodaySummary();
    const timer = setInterval(loadTodaySummary,5000);
    return ()=>clearInterval(timer);
  },[]);

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "success");
  }

  function updateClock(){

    const now = new Date();

    const date =
      now.toLocaleDateString("ar-EG",{
        weekday:"long",
        year:"numeric",
        month:"long",
        day:"numeric"
      });

    const time =
      now.toLocaleTimeString("en-US",{
        hour:"2-digit",
        minute:"2-digit",
        second:"2-digit",
        hour12:true
      });

    setNowText(date + " - " + time);

  }

  async function loadTodaySummary(){

    try{

      const data =
        await callAPI("getTodayAbsenceSummary");

      if(Array.isArray(data)){
        setTodaySummary(data);
      }else if(data && Array.isArray(data.result)){
        setTodaySummary(data.result);
      }else{
        setTodaySummary([]);
      }

    }catch(error){
      console.log(error);
      setTodaySummary([]);
    }

  }

  async function loadData(){

    try{

      setLoading(true);

      const [cls,t,s,active,phonesData] =
        await Promise.all([
          callAPI("getClasses"),
          callAPI("getTeachers"),
          callAPI("getSchedule"),
          callAPI("getActiveSession"),
          callAPI("getParentPhones")
        ]);

      setClasses(Array.isArray(cls) ? cls : []);
      setTeachers(Array.isArray(t) ? t : []);
      setSessions(Array.isArray(s) ? s : []);

      if(phonesData && phonesData.success){
        setParentPhones(phonesData.phones || {});
      }else{
        setParentPhones({});
      }

      if(active && active.success){
        setActiveSession(active.session);
      }else{
        setActiveSession(null);
      }

      setLoading(false);

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("فشل تحميل البيانات","error");

    }

  }

  async function loadStudents(){

    try{

      if(!selectedClass){
        showMessage("اختر الفصل أولًا","warning");
        return;
      }

      setLoading(true);

      const data =
        await callAPI("getStudents",{
          className:selectedClass,
          lang:lang,
          section:section
        });

      const statusData =
        await callAPI("getTodayStudentStatus",{
          className:selectedClass
        });

      const arr =
        Array.isArray(data)
          ? data.map((s,index)=>{

              const found =
                Array.isArray(statusData)
                  ? statusData.find(
                      x =>
                        String(x.seat).trim() ===
                        String(s.seat).trim()
                    )
                  : null;

              return {
                id:index,
                seat:String(s.seat).trim(),
                name:s.name,
                absent:false,
                todayStatus:found ? found.todayStatus : "لم يسجل"
              };

            })
          : [];

      setStudents(arr);
      setLoading(false);
      showMessage("تم تحميل الطلاب","success");

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("فشل تحميل الطلاب","error");

    }

  }

  function toggle(id){

    const arr = [...students];
    const index = arr.findIndex(s => s.id === id);

    if(index !== -1){
      arr[index].absent = !arr[index].absent;
      setStudents(arr);
    }

  }

  function markAllAbsent(){
    setStudents(students.map(s=>({...s,absent:true})));
  }

  function markAllPresent(){
    setStudents(students.map(s=>({...s,absent:false})));
  }

  async function save(){

    try{

      if(!selectedClass){
        showMessage("اختر الفصل","warning");
        return;
      }

      if(!teacher){
        showMessage("اختر المعلم","warning");
        return;
      }

      const selectedSession =
        manualSession
          ? sessions.find(x => String(x.id) === String(manualSession))
          : activeSession;

      if(!selectedSession){
        showMessage("لا توجد Session للحفظ","warning");
        return;
      }

      if(students.length === 0){
        showMessage("قم بتحميل الطلاب أولًا","warning");
        return;
      }

      const records =
        students.map((s)=>({
          seat:String(s.seat).trim(),
          className:selectedClass,
          status:s.absent ? "غ" : "ح",
          teacher:teacher,
          sessionId:Number(selectedSession.id),
          sessionName:selectedSession.name
        }));

      const res =
        await callAPI("saveAbsence",{
          records:records
        });

      if(res && res.success){

        showMessage(
          res.message || "تم الحفظ بنجاح",
          "success"
        );

        await loadStudents();
        loadTodaySummary();

      }else{

        showMessage("فشل الحفظ","error");

      }

    }catch(error){

      console.log(error);
      showMessage("خطأ في الحفظ","error");

    }

  }

  function formatPhoneForWhatsApp(phone){

    let p =
      String(phone || "")
      .replace(/\s/g,"")
      .replace(/-/g,"")
      .replace(/\+/g,"")
      .trim();

    if(!p){
      return "";
    }

    if(p.startsWith("00")){
      p = p.substring(2);
    }

    if(p.startsWith("0")){
      p = "2" + p;
    }

    if(!p.startsWith("2")){
      p = "2" + p;
    }

    return p;

  }

  function sendWhatsAppToAbsent(){

    const absentStudents =
      students.filter(s =>
        s.absent ||
        s.todayStatus === "غائب"
      );

    if(absentStudents.length === 0){
      showMessage("لا توجد طالبات غائبات لإرسال رسائل","warning");
      return;
    }

    const selectedSession =
      manualSession
        ? sessions.find(x => String(x.id) === String(manualSession))
        : activeSession;

    const list =
      absentStudents.map((s)=>{

        const seat =
          String(s.seat || "").trim();

        const rawPhone =
          parentPhones[seat];

        const phone =
          formatPhoneForWhatsApp(rawPhone);

        const message =
          "ولي الأمر المحترم، نحيط علم سيادتكم بغياب الطالبة: " +
          s.name +
          "، فصل: " +
          selectedClass +
          "، في " +
          (selectedSession ? selectedSession.name : "Session") +
          " اليوم. برجاء المتابعة. إدارة المدرسة";

        return {
          ...s,
          phone:phone,
          canSend:Boolean(phone),
          message:message
        };

      });

    setWhatsappList(list);
    setWhatsappOpen(true);

  }

  function sendOneWhatsapp(student){

    if(!student.phone){
      showMessage("لا يوجد رقم ولي أمر لهذه الطالبة","warning");
      return;
    }

    const url =
      "https://wa.me/" +
      student.phone +
      "?text=" +
      encodeURIComponent(student.message);

    window.open(url,"_blank");

    setWhatsappList(
      whatsappList.filter(
        s => String(s.seat) !== String(student.seat)
      )
    );

    showMessage("تم فتح رسالة WhatsApp للطالبة","success");

  }

  async function printClassPDF(){

    if(!selectedClass){
      showMessage("اختر الفصل أولًا","warning");
      return;
    }

    if(students.length === 0){
      showMessage("قم بتحميل الطلاب أولًا","warning");
      return;
    }

    try{

      const selectedSession =
        manualSession
          ? sessions.find(x => String(x.id) === String(manualSession))
          : activeSession;

      const now = new Date();

      const dateText =
        now.toLocaleDateString("ar-EG",{
          weekday:"long",
          year:"numeric",
          month:"long",
          day:"numeric"
        });

      const container =
        document.createElement("div");

      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "1100px";
      container.style.padding = "25px";
      container.style.background = "#ffffff";
      container.style.direction = "rtl";
      container.style.fontFamily = "Arial, Tahoma, sans-serif";
      container.style.color = "#111827";

      container.innerHTML = `
        <div style="width:100%;direction:rtl;text-align:right;">

          <h2 style="
            text-align:center;
            margin:0 0 18px 0;
            font-size:26px;
            color:#0f172a;
          ">
            كشف تسجيل الغياب
          </h2>

          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            font-weight:bold;
            margin-bottom:16px;
            font-size:15px;
          ">
            <div>الفصل: ${selectedClass}</div>
            <div>المعلم: ${teacher || "-"}</div>
            <div>Session: ${selectedSession ? selectedSession.name : "-"}</div>
            <div>التاريخ: ${dateText}</div>
          </div>

          <table style="
            width:100%;
            border-collapse:collapse;
            font-size:14px;
            direction:rtl;
          ">
            <thead>
              <tr>
                <th style="border:1px solid #333;padding:8px;background:#e5e7eb;text-align:center;">م</th>
                <th style="border:1px solid #333;padding:8px;background:#e5e7eb;text-align:center;">رقم الجلوس</th>
                <th style="border:1px solid #333;padding:8px;background:#e5e7eb;text-align:center;">اسم الطالبة</th>
                <th style="border:1px solid #333;padding:8px;background:#e5e7eb;text-align:center;">الحالة</th>
              </tr>
            </thead>

            <tbody>
              ${students.map((s,index)=>{

                const isAbsent =
                  s.todayStatus === "غائب" ||
                  s.absent;

                return `
                  <tr>
                    <td style="border:1px solid #333;padding:8px;text-align:center;">
                      ${index + 1}
                    </td>

                    <td style="border:1px solid #333;padding:8px;text-align:center;">
                      ${s.seat || ""}
                    </td>

                    <td style="border:1px solid #333;padding:8px;text-align:center;">
                      ${s.name || ""}
                    </td>

                    <td style="
                      border:1px solid #333;
                      padding:8px;
                      text-align:center;
                      font-weight:bold;
                      color:${isAbsent ? "#dc2626" : "#16a34a"};
                    ">
                      ${isAbsent ? "غائب" : "حاضر"}
                    </td>
                  </tr>
                `;

              }).join("")}
            </tbody>
          </table>

        </div>
      `;

      document.body.appendChild(container);

      const canvas =
        await html2canvas(container,{
          scale:2,
          useCORS:true,
          backgroundColor:"#ffffff"
        });

      document.body.removeChild(container);

      const imgData =
        canvas.toDataURL("image/png");

      const pdf =
        new jsPDF({
          orientation:"portrait",
          unit:"mm",
          format:"a4"
        });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight =
        canvas.height * imgWidth / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= pageHeight - margin * 2;

      while(heightLeft > 0){

        pdf.addPage();

        position =
          heightLeft - imgHeight + margin;

        pdf.addImage(
          imgData,
          "PNG",
          margin,
          position,
          imgWidth,
          imgHeight
        );

        heightLeft -= pageHeight - margin * 2;

      }

      pdf.save("class-attendance.pdf");

      showMessage("تم تصدير كشف الفصل PDF بنجاح","success");

    }catch(error){

      console.log(error);
      showMessage("فشل تصدير كشف الفصل","error");

    }

  }

  const absentCount =
    students.filter(
      s => s.todayStatus === "غائب"
    ).length;

  const presentCount =
    students.filter(
      s => s.todayStatus === "حاضر"
    ).length;

  const filteredStudents =
    students.filter(s=>{
      return (
        String(s.name || "")
          .toLowerCase()
          .includes(search.toLowerCase())
        ||
        String(s.seat || "")
          .includes(search)
      );
    });

  const columns = [

    {
      field:"absence",
      headerName:"غياب",
      width:80,
      sortable:false,
      filterable:false,
      renderCell:(params)=>(
        <input
          type="checkbox"
          checked={params.row.absent}
          onChange={()=>toggle(params.row.id)}
        />
      )
    },

    {
      field:"seat",
      headerName:"رقم الجلوس",
      width:110
    },

    {
      field:"name",
      headerName:"اسم الطالبة",
      flex:1,
      minWidth:260
    },

    {
      field:"todayStatus",
      headerName:"حالة اليوم",
      width:130,
      renderCell:(params)=>{

        let color = "#777";

        if(params.row.todayStatus === "غائب"){
          color = "#d32f2f";
        }

        if(params.row.todayStatus === "حاضر"){
          color = "#2e7d32";
        }

        return(
          <strong style={{color:color}}>
            {params.row.todayStatus}
          </strong>
        );

      }
    }

  ];

  return(

    <Container maxWidth="xl" style={{marginTop:"20px"}}>

      <Typography
        variant="h4"
        gutterBottom
        style={{
          fontWeight:"bold",
          color:"#0f172a"
        }}
      >
        تسجيل الغياب
      </Typography>

      <Paper
  elevation={6}
  style={{
    padding:"0",
    marginBottom:"20px",
    borderRadius:"22px",
    overflow:"hidden",
    background:"linear-gradient(90deg,#020617,#0f172a,#1e293b)",
    color:"#fff",
    boxShadow:"0 10px 25px rgba(0,0,0,0.25)"
  }}
>
  <Grid container>

    <Grid
      item
      xs={12}
      md={4}
      style={{
        padding:"16px 22px",
        background:"linear-gradient(135deg,#1e293b,#334155)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        zIndex:20
      }}
    >
      <Typography
        variant="h6"
        style={{
          fontWeight:"bold",
          letterSpacing:"0.5px"
        }}
      >
        🕒 {nowText}
      </Typography>
    </Grid>

    <Grid
      item
      xs={12}
      md={8}
      style={{
        display:"flex",
        alignItems:"center",
        background:"#020617",
        position:"relative",
        overflow:"hidden"
      }}
    >

      <div
        style={{
          background:"linear-gradient(135deg,#dc2626,#991b1b)",
          padding:"17px 22px",
          fontWeight:"bold",
          whiteSpace:"nowrap",
          zIndex:20,
          boxShadow:"12px 0 25px rgba(0,0,0,0.55)",
          fontSize:"17px"
        }}
      >
        🚨 أخبار الغياب
      </div>

      <div
        style={{
          flex:1,
          overflow:"hidden",
          height:"62px",
          display:"flex",
          alignItems:"center",
          position:"relative"
        }}
      >

        <div
          style={{
            display:"inline-flex",
            gap:"55px",
            alignItems:"center",
            whiteSpace:"nowrap",
            paddingLeft:"30px",
            animation:"absenceScroll 14s linear infinite"
          }}
        >

          {todaySummary.length === 0 ? (

            <span
              style={{
                background:"linear-gradient(135deg,#16a34a,#15803d)",
                padding:"9px 35px",
                borderRadius:"999px",
                fontWeight:"bold",
                fontSize:"17px",
                boxShadow:"0 4px 12px rgba(22,163,74,0.4)"
              }}
            >
              ✅ لا يوجد غياب مسجل لليوم
            </span>

          ) : (
            <>
              {[...todaySummary, ...todaySummary, ...todaySummary, ...todaySummary].map((item,index)=>(
                <span
                  key={index}
                  style={{
                    background:[
                      "linear-gradient(135deg,#dc2626,#991b1b)",
                      "linear-gradient(135deg,#ea580c,#c2410c)",
                      "linear-gradient(135deg,#7c3aed,#5b21b6)",
                      "linear-gradient(135deg,#2563eb,#1d4ed8)",
                      "linear-gradient(135deg,#0891b2,#0e7490)",
                      "linear-gradient(135deg,#be123c,#9f1239)"
                    ][index % 6],
                    padding:"9px 34px",
                    borderRadius:"999px",
                    fontWeight:"bold",
                    fontSize:"17px",
                    boxShadow:"0 5px 15px rgba(0,0,0,0.35)"
                  }}
                >
                  🏫 {item.className} — {item.count} غياب
                </span>
              ))}
            </>
          )}

        </div>

      </div>

    </Grid>

  </Grid>

  <style>
    {`
      @keyframes absenceScroll {
        0% {
          transform: translateX(0);
        }

        100% {
          transform: translateX(-50%);
        }
      }
    `}
  </style>
</Paper>

      <Grid container spacing={2} style={{marginBottom:"20px"}}>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#e3f2fd"}}>
            <CardContent>
              <Typography fontWeight="bold">عدد الطلاب</Typography>
              <Typography variant="h4">{students.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#e8f5e9"}}>
            <CardContent>
              <Typography fontWeight="bold">الحاضرون اليوم</Typography>
              <Typography variant="h4">{presentCount}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#ffebee"}}>
            <CardContent>
              <Typography fontWeight="bold">الغائبون اليوم</Typography>
              <Typography variant="h4">{absentCount}</Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Paper
        elevation={4}
        style={{
          padding:"22px",
          marginBottom:"20px",
          borderRadius:"18px"
        }}
      >

        <Grid container spacing={2}>

          <Grid item xs={12} md={2}>
            <LabelBox title="الفصل">
              <FormControl fullWidth>
                <Select
                  value={selectedClass}
                  onChange={(e)=>setSelectedClass(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">اختر الفصل</MenuItem>

                  {classes.map((c,index)=>(
                    <MenuItem key={index} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={2}>
            <LabelBox title="اللغة الثانية">
              <FormControl fullWidth>
                <Select
                  value={lang}
                  onChange={(e)=>setLang(e.target.value)}
                >
                  <MenuItem value="all">الكل</MenuItem>
                  <MenuItem value="French">French</MenuItem>
                  <MenuItem value="German">German</MenuItem>
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={2}>
            <LabelBox title="التخصص">
              <FormControl fullWidth>
                <Select
                  value={section}
                  onChange={(e)=>setSection(e.target.value)}
                >
                  <MenuItem value="all">الكل</MenuItem>
                  <MenuItem value="Math">Math</MenuItem>
                  <MenuItem value="Sciences">Sciences</MenuItem>
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={2}>
            <LabelBox title="المعلم">
              <FormControl fullWidth>
                <Select
                  value={teacher}
                  onChange={(e)=>setTeacher(e.target.value)}
                  displayEmpty
                  disabled={user && user.role === "Teacher"}
                >
                  <MenuItem value="">اختر المعلم</MenuItem>

                  {user && user.role === "Teacher" && (
                    <MenuItem value={user.username}>
                      {user.username}
                    </MenuItem>
                  )}

                  {teachers.map((t,index)=>(
                    <MenuItem key={index} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={2}>
            <LabelBox title="Session">
              <FormControl fullWidth>
                <Select
                  value={
                    manualSession ||
                    (
                      activeSession
                        ? String(activeSession.id)
                        : ""
                    )
                  }
                  onChange={(e)=>setManualSession(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Session النشطة</MenuItem>

                  {sessions.map((s,index)=>(
                    <MenuItem key={index} value={String(s.id)}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography
              variant="subtitle1"
              style={{
                fontWeight:"bold",
                marginBottom:"6px",
                color:"#1e293b"
              }}
            >
              تحميل
            </Typography>

            <Button
              fullWidth
              variant="contained"
              style={{
                height:"56px",
                borderRadius:"12px",
                fontWeight:"bold"
              }}
              onClick={loadStudents}
              disabled={loading}
            >
              {loading ? "جاري التحميل..." : "تحميل الطلاب"}
            </Button>
          </Grid>

        </Grid>

      </Paper>

      <Paper
        elevation={3}
        style={{
          padding:"15px",
          marginBottom:"20px",
          borderRadius:"16px"
        }}
      >

        <Grid container spacing={2}>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="بحث بالاسم أو رقم الجلوس"
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              color="error"
              style={{
                height:"56px",
                fontWeight:"bold"
              }}
              onClick={markAllAbsent}
            >
              الكل غائب
            </Button>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              color="warning"
              style={{
                height:"56px",
                fontWeight:"bold"
              }}
              onClick={markAllPresent}
            >
              الكل حاضر
            </Button>
          </Grid>

        </Grid>

      </Paper>

      <Paper
        elevation={4}
        style={{
          width:"100%",
          overflowX:"hidden",
          borderRadius:"18px"
        }}
      >

        <div style={{height:"600px",width:"100%"}}>
          <DataGrid
            rows={filteredStudents}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10,20,50]}
            disableSelectionOnClick
          />
        </div>

      </Paper>

      <br/>

      <Button
        variant="contained"
        color="success"
        size="large"
        style={{
          borderRadius:"12px",
          fontWeight:"bold",
          padding:"12px 40px"
        }}
        onClick={save}
      >
        حفظ الغياب
      </Button>

      <Button
        variant="contained"
        color="info"
        size="large"
        style={{
          borderRadius:"12px",
          fontWeight:"bold",
          padding:"12px 40px",
          marginRight:"12px"
        }}
        onClick={printClassPDF}
      >
        طباعة كشف الفصل PDF
      </Button>

      <Button
        variant="contained"
        color="secondary"
        size="large"
        style={{
          borderRadius:"12px",
          fontWeight:"bold",
          padding:"12px 40px",
          marginRight:"12px"
        }}
        onClick={sendWhatsAppToAbsent}
      >
        إرسال WhatsApp للغائبين
      </Button>

      <Dialog
        open={whatsappOpen}
        onClose={()=>setWhatsappOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          إرسال رسائل WhatsApp للغائبات
        </DialogTitle>

        <DialogContent>

          {whatsappList.length === 0 ? (

            <Alert severity="success">
              تم إرسال / فتح جميع الرسائل
            </Alert>

          ) : (

            whatsappList.map((s,index)=>(

              <Paper
                key={index}
                elevation={2}
                style={{
                  padding:"12px",
                  marginBottom:"10px",
                  borderRadius:"12px",
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center",
                  gap:"10px"
                }}
              >
                <Box>
                  <Typography fontWeight="bold">
                    {s.name}
                  </Typography>

                  <Typography variant="body2">
                    رقم الجلوس: {s.seat}
                  </Typography>

                  <Typography variant="body2">
                    الهاتف: {s.phone || "لا يوجد رقم"}
                  </Typography>
                </Box>

                <Box>
                  {s.canSend ? (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={()=>sendOneWhatsapp(s)}
                    >
                      إرسال WhatsApp
                    </Button>
                  ) : (
                    <Chip
                      label="لا يوجد رقم"
                      color="error"
                    />
                  )}
                </Box>
              </Paper>

            ))

          )}

        </DialogContent>

        <DialogActions>
          <Button onClick={()=>setWhatsappOpen(false)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(msg)}
        autoHideDuration={3500}
        onClose={()=>setMsg("")}
        anchorOrigin={{
          vertical:"top",
          horizontal:"center"
        }}
      >

        <Alert
          severity={msgType}
          onClose={()=>setMsg("")}
          variant="filled"
          style={{
            fontSize:"18px",
            minWidth:"350px",
            justifyContent:"center"
          }}
        >
          {msg}
        </Alert>

      </Snackbar>

    </Container>

  );

}

export default Attendance;