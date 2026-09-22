import React,{ useEffect, useState, useRef } from "react";

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

  const saveInFlight = useRef(false);
  const [saving,setSaving] = useState(false);
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
  const [saveSuccessOpen,setSaveSuccessOpen] = useState(false);

  const [activeSession,setActiveSession] = useState(null);
  const [manualSession,setManualSession] = useState("");

  const [todaySummary,setTodaySummary] = useState([]);
  const [nowText,setNowText] = useState("");

  const [whatsappOpen,setWhatsappOpen] = useState(false);
  const [whatsappList,setWhatsappList] = useState([]);
  const [allAbsentOpen,setAllAbsentOpen] = useState(false);
  const [allAbsentRows,setAllAbsentRows] = useState([]);
  const [allAbsentLoading,setAllAbsentLoading] = useState(false);
  const [allAbsentSearch,setAllAbsentSearch] = useState("");
  const [allAbsentClass,setAllAbsentClass] = useState("all");
  const [allAbsentSession,setAllAbsentSession] = useState("all");
  const [openedWhatsApp,setOpenedWhatsApp] = useState([]);

  const [dateEditOpen,setDateEditOpen] = useState(false);
  const [dateEditDate,setDateEditDate] = useState("");
  const [dateEditSeat,setDateEditSeat] = useState("");
  const [dateEditQuery,setDateEditQuery] = useState("");
  const [dateEditCandidates,setDateEditCandidates] = useState([]);
  const [dateEditCandidatesBusy,setDateEditCandidatesBusy] = useState(false);
  const [dateEditStudent,setDateEditStudent] = useState(null);
  const [dateEditSessions,setDateEditSessions] = useState([]);
  const [dateEditBusy,setDateEditBusy] = useState(false);
  const [editOpen,setEditOpen] = useState(false);
  const [editStudents,setEditStudents] = useState([]);
  const [editLoading,setEditLoading] = useState(false);

  useEffect(()=>{
    loadData();
  },[]);

  useEffect(()=>{
    updateClock();
    const timer = setInterval(updateClock,1000);
    return ()=>clearInterval(timer);
  },[]);

  useEffect(()=>{
  loadTodaySummary();

  const timer =
    setInterval(loadTodaySummary,120000);

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
      // Preserve last valid summary during transient failures.
    }

  }

  async function loadData(){

    try{

      setLoading(true);

      const res =
        await callAPI("getAttendanceInitData");

      if(res && res.success){

        setClasses(
          Array.isArray(res.classes)
            ? res.classes
            : []
        );

        setTeachers(
          Array.isArray(res.teachers)
            ? res.teachers
            : []
        );

        setSessions(
          Array.isArray(res.schedule)
            ? res.schedule
            : []
        );

        if(res.parentPhones && res.parentPhones.success){
          setParentPhones(res.parentPhones.phones || {});
        }else{
          setParentPhones({});
        }

        if(res.activeSession && res.activeSession.success){
          setActiveSession(res.activeSession.session);
        }else{
          setActiveSession(null);
        }

      }else{

        showMessage(
          res && res.error
            ? res.error
            : "فشل تحميل البيانات",
          "error"
        );

      }

      setLoading(false);

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("فشل تحميل البيانات: "+(error?.message||String(error)),"error");

    }

  }

  async function loadStudents(){
    if(!selectedClass){showMessage("اختر الفصل أولًا","warning");return;}
    setLoading(true);
    const filters={className:selectedClass,lang,section};
    try{
      let arr;
      try{
        const response=await callAPI("getAttendanceStudentsFast",filters);
        if(!response?.success||!Array.isArray(response.students))
          throw new Error(response?.error||"استجابة تحميل الطلاب غير صالحة");
        arr=response.students.map((s,index)=>({
          id:index,seat:String(s.seat??"").trim(),name:s.name,
          absent:false,todayStatus:s.todayStatus||"لم يسجل"
        }));
      }catch(fastError){
        // Read-only fallback; NEVER retry any save operation.
        console.warn("Fast student loading unavailable; using compatible read-only fallback",fastError);
        const roster=await callAPI("getStudents",filters);
        if(!Array.isArray(roster))throw new Error(roster?.error||"تعذر تحميل قائمة الطلاب بالمسار الاحتياطي");
        let statuses=[];
        let statusUnavailable=false;
        try{
          const result=await callAPI("getTodayStudentStatus",{className:selectedClass});
          if(Array.isArray(result))statuses=result;
          else if(Array.isArray(result?.result))statuses=result.result;
          else if(Array.isArray(result?.students))statuses=result.students;
          else statusUnavailable=true;
        }catch(statusError){statusUnavailable=true;console.warn("Today status unavailable",statusError);}
        const bySeat=new Map(statuses.map(item=>[String(item.seat??"").trim(),item.todayStatus||"لم يسجل"]));
        arr=roster.map((s,index)=>({
          id:index,seat:String(s.seat??"").trim(),name:s.name,
          absent:false,todayStatus:statusUnavailable?"غير متاح":(bySeat.get(String(s.seat??"").trim())||"لم يسجل")
        }));
        showMessage(statusUnavailable?"تم تحميل الأسماء، لكن تعذر جلب حالة اليوم؛ لا تعتمد على الحالة المعروضة قبل مراجعتها.":"تم تحميل الطلاب بالمسار الاحتياطي؛ تحقق من نشر الدالة السريعة.","warning");
      }
      setStudents(arr);
      if(arr.length===0)showMessage("لا يوجد طلاب مطابقون للفصل والفلاتر المحددة","warning");
      else if(!arr.some(s=>s.todayStatus==="غير متاح"))console.info("Students loaded",arr.length);
    }catch(error){
      console.error("Student loading failed",error);
      showMessage("فشل تحميل الطلاب: "+(error?.message||String(error)),"error");
    }finally{setLoading(false);}
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
    if(saveInFlight.current)return;
    if(!selectedClass){showMessage("اختر الفصل","warning");return;}
    if(!teacher){showMessage("اختر المعلم","warning");return;}
    const selectedSession=manualSession?sessions.find(x=>String(x.id)===String(manualSession)):activeSession;
    if(!selectedSession){showMessage("لا توجد Session للحفظ","warning");return;}
    if(!students.length){showMessage("قم بتحميل الطلاب أولًا","warning");return;}
    const records=students.map(s=>({seat:String(s.seat).trim(),className:selectedClass,status:s.absent?"غ":"ح",teacher:teacher,sessionId:Number(selectedSession.id),sessionName:selectedSession.name}));
    saveInFlight.current=true;
    setSaving(true);
    try{
      let result;
      try{result=await callAPI("saveAbsence",{records});}
      catch(networkError){
        showMessage("تعذر استلام تأكيد الحفظ؛ جارٍ التحقق من الشيت دون إعادة الحفظ...","warning");
        try{
          const verification=await callAPI("verifyAbsenceSave",{records});
          if(verification?.success&&verification.confirmed){result={success:true,verified:true};}
          else{showMessage("حالة الحفظ غير مؤكدة. راجع الشيت قبل إعادة المحاولة. "+(networkError?.message||""),"warning");return;}
        }catch(verificationError){showMessage("حالة الحفظ غير مؤكدة: تعذر التحقق من الشيت. لا تضغط حفظ مرة أخرى قبل مراجعة البيانات.","warning");return;}
      }
      if(result?.success){
        setStudents(prev=>prev.map(s=>({...s,todayStatus:s.absent?"غائب":"حاضر"})));
        setSaveSuccessOpen(true);
        // Refresh independently; never delay the save confirmation.
        loadTodaySummary();
      }else showMessage(result?.error||"فشل الحفظ","error");
    }finally{saveInFlight.current=false;setSaving(false);}
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

  async function openAllAbsent(){
    setAllAbsentOpen(true);
    setAllAbsentLoading(true);
    setAllAbsentSearch("");
    setAllAbsentClass("all");
    setAllAbsentSession("all");
    try{
      const res=await callAPI("getAllTodayAbsentStudents");
      if(!res || !res.success) throw new Error(res?.error || "تعذر تحميل الغياب");
      setAllAbsentRows(Array.isArray(res.students) ? res.students : []);
    }catch(error){setAllAbsentRows([]);showMessage(error.message || "فشل تحميل الغياب", "error");}
    finally{setAllAbsentLoading(false);}
  }

  function sendOneWhatsapp(student){
    const phone=formatPhoneForWhatsApp(student.phone);
    if(!phone){showMessage("لا يوجد رقم ولي أمر لهذه الطالبة","warning");return;}
    const message="ولي الأمر المحترم، نحيط علم سيادتكم بغياب الطالبة: "+student.name+
      "، فصل: "+student.className+"، اليوم في: "+student.sessions.join("، ")+". برجاء المتابعة. إدارة المدرسة";
    const opened=window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(message),"_blank");
    if(!opened){showMessage("اسمح بفتح النوافذ المنبثقة لإرسال الرسالة", "warning");return;}
    setOpenedWhatsApp(prev=>prev.includes(student.className+"|"+student.seat)?prev:[...prev,student.className+"|"+student.seat]);
    showMessage("تم فتح WhatsApp؛ تأكد من الضغط على إرسال داخل التطبيق", "info");
  }

  const filteredAllAbsent=allAbsentRows.filter(student=>{
    const q=normalizeStudentSearch(allAbsentSearch);
    return (allAbsentClass==="all" || student.className===allAbsentClass) &&
      (allAbsentSession==="all" || student.sessions.includes(allAbsentSession)) &&
      (!q || normalizeStudentSearch(student.name).includes(q) || normalizeStudentSearch(student.seat).includes(q) || normalizeStudentSearch(student.className).includes(q));
  });

  function printAllAbsentPDF(){
    if(!filteredAllAbsent.length){showMessage("لا توجد بيانات للطباعة", "warning");return;}
    const escapeHTML=value=>String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    const date=new Date().toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric",weekday:"long"});
    const rows=filteredAllAbsent.map((student,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(student.seat)}</td><td>${escapeHTML(student.name)}</td><td>${escapeHTML(student.className)}</td><td>${escapeHTML(student.sessions.join("، "))}</td></tr>`).join("");
    const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير غياب اليوم</title><style>@page{size:A4 portrait;margin:13mm}body{font-family:Arial,Tahoma,sans-serif;color:#111827;direction:rtl}h2,p{text-align:center}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #333;padding:7px;text-align:center;word-break:break-word}th{background:#e5e7eb}thead{display:table-header-group}tr{break-inside:avoid}footer{margin-top:20px;text-align:left}@media print{button{display:none}}</style></head><body><h2>تقرير غياب اليوم - جميع الفصول</h2><p>${escapeHTML(date)} | الفصل: ${escapeHTML(allAbsentClass==="all"?"جميع الفصول":allAbsentClass)} | الجلسة: ${escapeHTML(allAbsentSession==="all"?"جميع الجلسات":allAbsentSession)} | عدد الطالبات: ${filteredAllAbsent.length}</p><table><thead><tr><th>م</th><th>رقم الجلوس</th><th>اسم الطالبة</th><th>الفصل</th><th>جلسات الغياب</th></tr></thead><tbody>${rows}</tbody></table><footer>إدارة المدرسة</footer><script>window.onload=function(){window.print();};</script></body></html>`;
    const win=window.open("","_blank");
    if(!win){showMessage("اسمح بالنوافذ المنبثقة لطباعة التقرير", "warning");return;}
    win.document.open();win.document.write(html);win.document.close();
  }

  // Arabic-friendly matching is for suggestions only; saving still uses the exact seat.
  function normalizeStudentSearch(value){
    return String(value || "")
      .normalize("NFKC")
      .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0)-0x660))
      .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0)-0x6f0))
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  async function openDateEdit(){
    if(!selectedClass){showMessage("اختر الفصل أولًا", "warning");return;}
    setDateEditOpen(true);
    setDateEditQuery("");
    setDateEditSeat("");
    setDateEditStudent(null);
    setDateEditSessions([]);
    setDateEditCandidates([]);
    setDateEditCandidatesBusy(true);
    try{
      const res=await callAPI("getStudents",{className:selectedClass,lang:"all",section:"all"});
      if(!Array.isArray(res)) throw new Error(res?.error || "تعذر تحميل أسماء الطالبات");
      setDateEditCandidates(res.map(s=>({seat:String(s.seat ?? "").trim(),name:String(s.name ?? "").trim()})).filter(s=>s.seat));
    }catch(error){showMessage(error.message || "تعذر تحميل أسماء الطالبات", "error");}
    finally{setDateEditCandidatesBusy(false);}
  }

  const matchingDateEditCandidates = dateEditQuery.trim()
    ? dateEditCandidates.filter(s=>{
        const q=normalizeStudentSearch(dateEditQuery);
        return normalizeStudentSearch(s.name).startsWith(q) ||
          normalizeStudentSearch(s.name).split(" ").some(part=>part.startsWith(q)) ||
          normalizeStudentSearch(s.seat).includes(q);
      })
    : [];

  function selectDateEditCandidate(student){
    setDateEditSeat(student.seat);
    setDateEditQuery(student.name + " — " + student.seat);
    setDateEditStudent(null);
    setDateEditSessions([]);
  }

  async function loadDateEdit(){
    if(!selectedClass || !dateEditSeat.trim() || !dateEditDate){
      showMessage("اختر الفصل والتاريخ وأدخل رقم جلوس الطالبة", "warning");return;
    }
    setDateEditBusy(true);
    setDateEditStudent(null);
    setDateEditSessions([]);
    try{
      const res=await callAPI("getStudentAttendanceByDate",{
        className:selectedClass,seat:dateEditSeat.trim(),date:dateEditDate
      });
      if(!res || !res.success) throw new Error(res?.error || "تعذر تحميل الغياب");
      setDateEditStudent(res.student);
      setDateEditSessions(res.sessions || []);
    }catch(error){showMessage(error.message || "فشل التحميل","error");}
    finally{setDateEditBusy(false);}
  }

  async function saveDateEdit(){
    if(!dateEditStudent || !dateEditSessions.length) return;
    setDateEditBusy(true);
    try{
      const res=await callAPI("saveStudentAttendanceByDate",{
        className:dateEditStudent.className,seat:dateEditStudent.seat,date:dateEditDate,
        userName:user?.username || "Admin",
        records:dateEditSessions.map(s=>({colIndex:s.colIndex,status:s.status}))
      });
      if(!res || !res.success) throw new Error(res?.error || "فشل حفظ التعديلات");
      showMessage(res.message || "تم الحفظ بنجاح","success");
      setDateEditOpen(false);
      loadTodaySummary();
      if(selectedClass) await loadStudents();
    }catch(error){showMessage(error.message || "فشل الحفظ","error");}
    finally{setDateEditBusy(false);}
  }

  async function openAdminEdit(){

    try{

      if(!selectedClass){

        showMessage(
          "اختر الفصل أولًا",
          "warning"
        );

        return;

      }

      setEditLoading(true);

      const res =
        await callAPI(
          "getClassTodaySessionAttendanceEdit",
          {
            className:selectedClass
          }
        );

      setEditLoading(false);

      if(res && res.success){

        setEditStudents(
          Array.isArray(res.students)
            ? res.students
            : []
        );

        setEditOpen(true);

      }else{

        showMessage(
          res && res.error
            ? res.error
            : "فشل تحميل بيانات التعديل",
          "error"
        );

      }

    }catch(error){

      console.log(error);

      setEditLoading(false);

      showMessage(
        "خطأ في تحميل بيانات التعديل",
        "error"
      );

    }

  }

  function updateEditStatus(
    studentIndex,
    sessionIndex,
    value
  ){

    const arr =
      editStudents.map((student,index)=>{

        if(index !== studentIndex){
          return student;
        }

        return {
          ...student,
          sessions:student.sessions.map((session,sIndex)=>{

            if(sIndex !== sessionIndex){
              return session;
            }

            return {
              ...session,
              status:value
            };

          })
        };

      });

    setEditStudents(arr);

  }

  async function saveAdminEdit(){

    try{

      if(editStudents.length === 0){

        showMessage(
          "لا توجد بيانات للحفظ",
          "warning"
        );

        return;

      }

      const today =
        new Date().toISOString().slice(0,10);

      const records = [];

      editStudents.forEach((student)=>{

        student.sessions.forEach((s)=>{

          records.push({
            rowIndex:s.rowIndex,
            colIndex:s.colIndex,
            status:s.status,
            seat:student.seat,
            studentName:student.name,
            sessionName:s.sessionName,
            date:today
          });

        });

      });

      setEditLoading(true);

      const res =
        await callAPI(
          "updateClassSessionAttendanceEdit",
          {
            userName:user && user.username
              ? user.username
              : "Admin",
            records:records
          }
        );

      setEditLoading(false);

      if(res && res.success){

        showMessage(
          res.message || "تم حفظ تعديلات الغياب",
          "success"
        );

        setEditOpen(false);

        await loadStudents();
        loadTodaySummary();

      }else{

        showMessage(
          res && res.error
            ? res.error
            : "فشل حفظ التعديلات",
          "error"
        );

      }

    }catch(error){

      console.log(error);

      setEditLoading(false);

      showMessage(
        "خطأ أثناء حفظ التعديلات",
        "error"
      );

    }

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
                    {todaySummary
                                     .filter(item => Number(item.count || 0) > 0)
                                     .map((item,index)=>(
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
                >
                  <MenuItem value="">اختر المعلم</MenuItem>

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

      <Box style={{display:"flex",flexWrap:"wrap",gap:"12px",alignItems:"center",marginBottom:"20px"}}>
      <Button
        variant="contained"
        color="success"
        size="large"
        style={{
          borderRadius:"12px",
          fontWeight:"bold",
          padding:"12px 24px"
        }}
        onClick={save}
        disabled={saving || loading}
      >
        {saving ? "جارٍ الحفظ / التحقق..." : "حفظ الغياب"}
      </Button>

      <Button
        variant="contained"
        color="info"
        size="large"
        style={{
          borderRadius:"12px",
          fontWeight:"bold",
          padding:"12px 24px",
          marginRight:"0px"
        }}
        onClick={printClassPDF}
      >
        طباعة كشف الفصل PDF
      </Button>

             <Button variant="contained" color="secondary" size="large"
         style={{borderRadius:"12px",fontWeight:"bold",padding:"12px 24px"}}
         onClick={openAllAbsent}>عرض غائبي اليوم – جميع الفصول</Button>

{String(user?.role || "").trim().toLowerCase() === "admin" && (

  <Button
    variant="contained"
    color="warning"
    size="large"
    style={{
      borderRadius:"12px",
      fontWeight:"bold",
      padding:"12px 24px",
      marginRight:"0px"
    }}
    onClick={openAdminEdit}
    disabled={editLoading}
  >
    تعديل غياب اليوم
  </Button>

)}

       {String(user?.role || "").trim().toLowerCase() === "admin" && (
         <Button variant="contained" color="primary" size="large"
           style={{borderRadius:"12px",fontWeight:"bold",padding:"12px 24px",marginRight:"0px"}}
           onClick={openDateEdit}
         >تعديل غياب بتاريخ محدد</Button>
       )}

      </Box>

       <Dialog open={dateEditOpen} onClose={()=>!dateEditBusy && setDateEditOpen(false)} maxWidth="md" fullWidth>
         <DialogTitle>تعديل غياب طالبة بتاريخ محدد — {selectedClass || "اختر الفصل أولًا"}</DialogTitle>
         <DialogContent>
           <Alert severity="info" style={{marginBottom:16}}>يتم تعديل البيانات في ورقة حصر الغياب فقط، حسب رقم الجلوس والفصل والتاريخ.</Alert>
           <Grid container spacing={2} style={{marginTop:4}}>
             <Grid item xs={12} md={6}>
               <TextField fullWidth label="التاريخ" type="date" value={dateEditDate}
                 onChange={e=>{setDateEditDate(e.target.value);setDateEditStudent(null);setDateEditSessions([]);}}
                 InputLabelProps={{shrink:true}} />
             </Grid>
             <Grid item xs={12} md={6}>
               <TextField fullWidth label="بحث برقم الجلوس أو اسم الطالبة" value={dateEditQuery}
                 onChange={e=>{setDateEditQuery(e.target.value);setDateEditSeat("");setDateEditStudent(null);setDateEditSessions([]);}}
                 helperText={dateEditSeat ? "تم اختيار رقم الجلوس: " + dateEditSeat : "اكتب أول الاسم أو جزءًا منه أو رقم الجلوس، ثم اختر الطالبة من النتائج"} />
             </Grid>
           </Grid>
            {dateEditCandidatesBusy && <Alert severity="info" style={{marginTop:12}}>جارٍ تحميل أسماء الطالبات...</Alert>}
            {!dateEditCandidatesBusy && dateEditQuery.trim() && !dateEditSeat && (
              <Paper variant="outlined" style={{marginTop:12,maxHeight:240,overflowY:"auto"}}>
                {matchingDateEditCandidates.length === 0 ? (
                  <Alert severity="warning">لا توجد نتائج مطابقة. تحقق من الفصل أو جرّب جزءًا آخر من الاسم.</Alert>
                ) : matchingDateEditCandidates.map((candidate,index)=>(
                  <Button key={candidate.seat+"-"+index} fullWidth
                    style={{justifyContent:"flex-start",textAlign:"right",padding:12}}
                    onClick={()=>selectDateEditCandidate(candidate)}>
                    {candidate.name} — رقم الجلوس: {candidate.seat}
                  </Button>
                ))}
              </Paper>
            )}
            {dateEditSeat && <Alert severity="success" style={{marginTop:12}}>الطالبة المختارة: {dateEditQuery}</Alert>}
           <Button variant="contained" style={{marginTop:16,marginBottom:16}} disabled={dateEditBusy || dateEditCandidatesBusy || !dateEditSeat || !dateEditDate} onClick={loadDateEdit}>
             {dateEditBusy ? "جارٍ التنفيذ..." : "عرض الغياب المسجل"}
           </Button>
           {dateEditStudent && <Typography variant="h6" gutterBottom>{dateEditStudent.name} — {dateEditStudent.seat}</Typography>}
           {dateEditSessions.map((s,index)=>(
             <Paper key={s.colIndex} style={{padding:12,marginBottom:10}}>
               <Grid container spacing={2} alignItems="center">
                 <Grid item xs={12} md={6}><Typography>{s.sessionName}</Typography></Grid>
                 <Grid item xs={12} md={6}>
                   <FormControl fullWidth><Select value={s.status} disabled={dateEditBusy}
                     onChange={e=>setDateEditSessions(prev=>prev.map((item,i)=>i===index?{...item,status:e.target.value}:item))}>
                     <MenuItem value="">فارغ</MenuItem>
                     <MenuItem value="ح">حاضر</MenuItem>
                     <MenuItem value="غ">غائب</MenuItem>
                     <MenuItem value="مرضي">مرضي</MenuItem>
                   </Select></FormControl>
                 </Grid>
               </Grid>
             </Paper>
           ))}
         </DialogContent>
         <DialogActions>
           <Button disabled={dateEditBusy} onClick={()=>setDateEditOpen(false)}>إلغاء</Button>
           <Button variant="contained" color="success" disabled={dateEditBusy || !dateEditStudent || !dateEditSessions.length}
             onClick={saveDateEdit}>حفظ التعديلات</Button>
         </DialogActions>
       </Dialog>

             <Dialog open={allAbsentOpen} onClose={()=>setAllAbsentOpen(false)} maxWidth="xl" fullWidth>
         <DialogTitle>غياب اليوم – جميع الفصول</DialogTitle>
         <DialogContent>
           <Alert severity="info" style={{marginBottom:12}}>تظهر كل طالبة مرة واحدة مع جميع جلسات غيابها. زر WhatsApp يفتح الرسالة ولا يرسلها تلقائيًا.</Alert>
           <Grid container spacing={2} style={{marginTop:4,marginBottom:16}}>
             <Grid item xs={12} md={5}><TextField fullWidth label="بحث بالاسم أو رقم الجلوس أو الفصل" value={allAbsentSearch} onChange={e=>setAllAbsentSearch(e.target.value)}/></Grid>
             <Grid item xs={12} md={3}><FormControl fullWidth><Select value={allAbsentClass} onChange={e=>setAllAbsentClass(e.target.value)}><MenuItem value="all">جميع الفصول</MenuItem>{[...new Set(allAbsentRows.map(s=>s.className))].map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl></Grid>
             <Grid item xs={12} md={4}><FormControl fullWidth><Select value={allAbsentSession} onChange={e=>setAllAbsentSession(e.target.value)}><MenuItem value="all">جميع الجلسات</MenuItem>{[...new Set(allAbsentRows.flatMap(s=>s.sessions))].map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl></Grid>
           </Grid>
           <Typography fontWeight="bold" gutterBottom>عدد الغائبات: {filteredAllAbsent.length}</Typography>
           {allAbsentLoading ? <Alert severity="info">جارٍ تحميل الغياب من جميع الفصول...</Alert> : filteredAllAbsent.length===0 ? <Alert severity="warning">لا توجد حالات غياب مطابقة.</Alert> : (
             <Box style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",direction:"rtl"}}><thead><tr>{["م","رقم الجلوس","اسم الطالبة","الفصل","جلسات الغياب","الهاتف","WhatsApp"].map(h=><th key={h} style={{padding:10,borderBottom:"2px solid #ddd",textAlign:"right"}}>{h}</th>)}</tr></thead><tbody>
               {filteredAllAbsent.map((student,index)=><tr key={student.className+"|"+student.seat}>
                 <td style={{padding:8,borderBottom:"1px solid #eee"}}>{index+1}</td><td>{student.seat}</td><td>{student.name}</td><td>{student.className}</td><td>{student.sessions.join("، ")}</td><td>{student.phone || "غير مسجل"}</td><td><Button size="small" variant="contained" color="success" disabled={!student.phone} onClick={()=>sendOneWhatsapp(student)}>{openedWhatsApp.includes(student.className+"|"+student.seat)?"فتح مرة أخرى":"فتح WhatsApp"}</Button></td>
               </tr>)}
             </tbody></table></Box>
           )}
         </DialogContent>
         <DialogActions>
           <Button disabled={allAbsentLoading} onClick={openAllAbsent}>تحديث البيانات</Button>
           <Button disabled={allAbsentLoading || !filteredAllAbsent.length} variant="contained" color="info" onClick={printAllAbsentPDF}>طباعة / حفظ PDF</Button>
           <Button onClick={()=>setAllAbsentOpen(false)}>إغلاق</Button>
         </DialogActions>
       </Dialog>

<Dialog
        open={editOpen}
        onClose={()=>setEditOpen(false)}
        maxWidth="xl"
        fullWidth
      >

        <DialogTitle>
          تعديل غياب اليوم - {selectedClass}
        </DialogTitle>

        <DialogContent>

          {editLoading && (
            <Alert
              severity="info"
              style={{
                marginBottom:"15px"
              }}
            >
              جاري تحميل / حفظ البيانات...
            </Alert>
          )}

          {editStudents.length === 0 ? (

            <Alert severity="warning">
              لا توجد بيانات غياب لهذا الفصل اليوم أو لم يتم إنشاء أعمدة Sessions في Sheet1.
            </Alert>

          ) : (

            editStudents.map((student,studentIndex)=>(

              <Paper
                key={studentIndex}
                elevation={3}
                style={{
                  padding:"15px",
                  marginBottom:"14px",
                  borderRadius:"16px"
                }}
              >

                <Typography
                  variant="h6"
                  style={{
                    fontWeight:"bold",
                    marginBottom:"12px"
                  }}
                >
                  {student.name}
                  {" - "}
                  {student.seat}
                </Typography>

                <Grid container spacing={2}>

                  {student.sessions && student.sessions.length > 0 ? (

                    student.sessions.map((s,sessionIndex)=>(

                      <Grid
                        item
                        xs={12}
                        md={3}
                        key={sessionIndex}
                      >

                        <Paper
                          style={{
                            padding:"12px",
                            borderRadius:"12px",
                            background:
                              s.status === "غ"
                                ? "#ffebee"
                                : s.status === "ح"
                                  ? "#e8f5e9"
                                  : s.status === "مرضي"
                                    ? "#fff3e0"
                                    : "#f8fafc"
                          }}
                        >

                          <Typography
                            style={{
                              fontWeight:"bold",
                              marginBottom:"10px"
                            }}
                          >
                            {s.sessionName || "Session"}
                          </Typography>

                          <FormControl fullWidth>

                            <Select
                              value={s.status || ""}
                              onChange={(e)=>
                                updateEditStatus(
                                  studentIndex,
                                  sessionIndex,
                                  e.target.value
                                )
                              }
                              displayEmpty
                            >

                              <MenuItem value="">
                                فارغ
                              </MenuItem>

                              <MenuItem value="ح">
                                حاضر
                              </MenuItem>

                              <MenuItem value="غ">
                                غائب
                              </MenuItem>

                              <MenuItem value="مرضي">
                                مرضي
                              </MenuItem>

                            </Select>

                          </FormControl>

                        </Paper>

                      </Grid>

                    ))

                  ) : (

                    <Grid item xs={12}>
                      <Alert severity="info">
                        لا توجد Sessions مسجلة لهذه الطالبة اليوم.
                      </Alert>
                    </Grid>

                  )}

                </Grid>

              </Paper>

            ))

          )}

        </DialogContent>

        <DialogActions>

          <Button
            onClick={()=>setEditOpen(false)}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={saveAdminEdit}
            disabled={editLoading || editStudents.length === 0}
          >
            حفظ التعديلات
          </Button>

        </DialogActions>

      </Dialog>

      {/* Confirmation is shown only after saveAbsence returns success. */}
      <Snackbar
        open={saveSuccessOpen}
        autoHideDuration={4000}
        onClose={(_, reason)=>{if(reason !== "clickaway") setSaveSuccessOpen(false);}}
        anchorOrigin={{vertical:"top",horizontal:"center"}}
        sx={{
          "&.MuiSnackbar-root":{
            top:"50% !important",
            left:"50% !important",
            right:"auto !important",
            transform:"translate(-50%, -50%) !important",
            width:"min(92vw, 470px)",
            zIndex:1600
          }
        }}
      >
        <Alert
          icon={false}
          onClose={()=>setSaveSuccessOpen(false)}
          severity="info"
          variant="filled"
          sx={{
            width:"100%",
            boxSizing:"border-box",
            direction:"rtl",
            textAlign:"center",
            justifyContent:"center",
            alignItems:"center",
            borderRadius:"18px",
            background:"linear-gradient(135deg, #1e3a8a, #4338ca)",
            color:"#ffffff",
            boxShadow:"0 20px 55px rgba(15,23,42,0.45)",
            padding:"22px 18px",
            "& .MuiAlert-message":{width:"100%",fontSize:"23px",fontWeight:800,lineHeight:1.7},
            "& .MuiAlert-action":{color:"#ffffff",paddingTop:0,alignItems:"flex-start"},
            "& .MuiIconButton-root":{color:"#ffffff"}
          }}
        >
          ✔ تم حفظ الغياب بنجاح
        </Alert>
      </Snackbar>

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
