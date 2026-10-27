import React,{ useEffect, useState } from "react";

import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Snackbar,
  Alert,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Box,
  Card,
  CardContent
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { callAPI } from "../api";

// ضع هنا رابط صورة شعار المدرسة المباشر (PNG أو JPG) ليظهر في ترويسة PDF.
const SCHOOL_LOGO_URL = "https://i.postimg.cc/VsMM74cg/Picture1.png";

function Reports(){

  const [reportType,setReportType] = useState("daily");
  const [date,setDate] = useState("");
  const [month,setMonth] = useState("");
  const [rows,setRows] = useState([]);
  const [loading,setLoading] = useState(false);

  const [classes,setClasses] = useState([]);
  const [selectedClass,setSelectedClass] = useState("all");

  const [msg,setMsg] = useState("");
  const [msgType,setMsgType] = useState("success");

  useEffect(()=>{
    loadClasses();
  },[]);

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "success");
  }

  async function loadClasses(){

    try{

      const data =
        await callAPI("getAbsenceClasses");

      setClasses(
        Array.isArray(data)
          ? data
          : []
      );

    }catch(error){

      console.log(error);

    }

  }

  const months = [
    { value:"09", label:"سبتمبر" },
    { value:"10", label:"أكتوبر" },
    { value:"11", label:"نوفمبر" },
    { value:"12", label:"ديسمبر" },
    { value:"01", label:"يناير" },
    { value:"02", label:"فبراير" },
    { value:"03", label:"مارس" },
    { value:"04", label:"أبريل" },
    { value:"05", label:"مايو" }
  ];

  const LabelBox = ({title,children}) => (
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

  function convertDateToSheetFormat(value){

    if(!value){
      return "";
    }

    const parts = value.split("-");

    if(parts.length !== 3){
      return value;
    }

    return parts[2] + "/" + parts[1] + "/" + parts[0];

  }

  async function loadReport(){

    try{

      setLoading(true);

      let data = [];

      if(reportType === "daily"){

        if(!date){
          showMessage("اختر التاريخ","warning");
          setLoading(false);
          return;
        }

        data =
          await callAPI("getDailyReport",{
            date:convertDateToSheetFormat(date),
            className:selectedClass
          });

        const arr = Array.isArray(data)
          ? data.map((r,index)=>({
              id:index,
              seat:r.seat,
              name:r.name,
              className:r.className,
              status:r.status,
              date:r.date
            }))
          : [];

        setRows(arr);

      }else{

        if(!month){
          showMessage("اختر الشهر","warning");
          setLoading(false);
          return;
        }

        data =
          await callAPI("getMonthlyReport",{
            month:month,
            className:selectedClass
          });

        const arr = Array.isArray(data)
          ? data.map((r,index)=>({
              id:index,
              seat:r.seat,
              name:r.name,
              className:r.className,
              totalAbsence:r.totalAbsence,
              totalSick:r.totalSick || 0,
              dates:Array.isArray(r.dates)
                ? r.dates.join(" - ")
                : "",
              statusDetails:r.statusDetails || ""
            }))
          : [];

        setRows(arr);

      }

      setLoading(false);
      showMessage("تم تحميل التقرير","success");

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("فشل تحميل التقرير","error");

    }

  }

  function exportExcel(){

    if(rows.length === 0){
      showMessage("لا توجد بيانات للتصدير","warning");
      return;
    }

    let exportData = [];

    if(reportType === "daily"){

      exportData =
        rows.map((r)=>({
          "رقم الجلوس":r.seat,
          "اسم الطالبة":r.name,
          "الفصل":r.className,
          "الحالة":r.status,
          "التاريخ":r.date
        }));

    }else{

      exportData =
        rows.map((r)=>({
          "رقم الجلوس":r.seat,
          "اسم الطالبة":r.name,
          "الفصل":r.className,
          "عدد الغياب (غ)":r.totalAbsence,
          "عدد مرضي":r.totalSick,
          "تواريخ وحالات الغياب":r.statusDetails || r.dates
        }));

    }

    const worksheet =
      XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] =
      reportType === "daily"
        ? [
            { wch:12 },
            { wch:35 },
            { wch:12 },
            { wch:12 },
            { wch:15 }
          ]
        : [
            { wch:12 },
            { wch:35 },
            { wch:12 },
            { wch:14 },
            { wch:14 },
            { wch:70 }
          ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      reportType === "daily"
        ? "تقرير يومي"
        : "تقرير شهري"
    );

    XLSX.writeFile(
      workbook,
      reportType === "daily"
        ? "daily-report.xlsx"
        : "monthly-report.xlsx"
    );

    showMessage("تم تصدير ملف Excel بنجاح","success");

  }

  async function exportPDF(){
    if(rows.length === 0 && reportType !== "daily"){
      showMessage("لا توجد بيانات للتصدير","warning");
      return;
    }
    let container;
    try{
      container = document.createElement("div");
      Object.assign(container.style, {
        position:"fixed", left:"-20000px", top:"0", width:"1400px", padding:"28px",
        background:"#fff", direction:"rtl", fontFamily:"Cairo, sans-serif", fontSize:"18px", color:"#111827",
        boxSizing:"border-box"
      });
      const title = reportType === "daily" ? "تقرير الغياب اليومي" : "تقرير الغياب الشهري";
      const classText = selectedClass === "all" ? "كل الفصول" : selectedClass;
      const periodText = reportType === "daily" ? `التاريخ: ${date}` : `الشهر: ${(months.find(m=>m.value===month)||{}).label || month}`;
      let tableHtml = "";
      if(reportType === "daily"){
        const summaryRows = await callAPI("getDailyReport",{
          date:convertDateToSheetFormat(date), className:selectedClass, summary:true
        });
        const ordered = (Array.isArray(summaryRows) ? summaryRows : []).map(r=>({
          className:r.className, registered:Number(r.classRegistered||0),
          present:Number(r.classPresent||0), absent:Number(r.classAbsent||0), names:r.absentNames||""
        })).sort((a,b)=>String(a.className).localeCompare(String(b.className),"en",{numeric:true}));
        if(!ordered.length) throw new Error("لا توجد بيانات جلسات لهذا التاريخ");
        tableHtml = `<table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:18px;font-family:Cairo,sans-serif;direction:rtl">
          <thead><tr>${["م","الفصل","مقيد","حاضر","غائب","أسماء الغائبين"].map((h,i)=>`<th style="border:1px solid #222;padding:10px;background:#e9edf2;text-align:center;width:${[5,12,10,10,10,53][i]}%">${h}</th>`).join("")}</tr></thead>
          <tbody>${ordered.map((r,i)=>`<tr>${[i+1,r.className,r.registered,r.present,r.absent,r.names||"لا يوجد"].map((v,j)=>`<td style="border:1px solid #222;padding:10px;text-align:${j===5?'right':'center'};vertical-align:middle;overflow-wrap:anywhere">${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      }else{
        const headers = ["رقم الجلوس","اسم الطالبة","الفصل","عدد أيام الغياب (غ)","عدد أيام مرضي","تواريخ وحالات الغياب"];
        tableHtml = `<table style="width:100%;border-collapse:collapse;font-size:18px;font-family:Cairo,sans-serif;direction:rtl"><thead><tr>${headers.map(h=>`<th style="border:1px solid #333;padding:8px;background:#e5e7eb;text-align:center">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${[r.seat||"",r.name||"",r.className||"",r.totalAbsence||0,r.totalSick||0,r.statusDetails||r.dates||""].map(v=>`<td style="border:1px solid #333;padding:8px;text-align:center;vertical-align:middle">${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      }
      const logoMarkup = SCHOOL_LOGO_URL && SCHOOL_LOGO_URL !== "PASTE_DIRECT_SCHOOL_LOGO_IMAGE_URL_HERE"
        ? `<img src="${SCHOOL_LOGO_URL}" alt="شعار المدرسة" crossorigin="anonymous" style="display:block;width:125px;height:125px;object-fit:contain;margin:auto" />`
        : `<div style="width:125px;height:125px;margin:auto;display:flex;align-items:center;justify-content:center;text-align:center;border:2px dashed #94a3b8;color:#64748b;font-size:13px">ضع رابط<br/>شعار المدرسة</div>`;
      const officialHeader = reportType === "daily" ? `
        <div style="display:grid;direction:ltr;grid-template-columns:minmax(0,1fr) 150px minmax(0,1fr);gap:18px;align-items:center;border-bottom:3px solid #555;padding-bottom:18px;margin-bottom:18px;width:100%;box-sizing:border-box">
          <div dir="ltr" style="text-align:left;font-size:18px;font-family:Cairo,sans-serif;line-height:1.8;font-weight:bold;unicode-bidi:embed">
            <div>Ministry of Education</div><div>Central Unit of STEM Schools</div><div>Menofia STEM School</div>
          </div>
          <div style="text-align:center">${logoMarkup}</div>
          <div dir="rtl" style="text-align:right;font-size:18px;font-family:Cairo,sans-serif;line-height:1.8;font-weight:bold;unicode-bidi:embed">
            <div>وزارة التربية والتعليم</div><div>الوحدة المركزية لمدارس المتفوقين والموهوبين</div><div>مدرسة المتفوقين في العلوم والتكنولوجيا بالمنوفية</div>
          </div>
        </div>` : "";
      container.innerHTML = `${officialHeader}<div style="direction:rtl;text-align:center"><h2 style="margin:8px 0 14px;font-size:24px;font-family:Cairo,sans-serif">${title}</h2><div style="display:flex;justify-content:space-between;font-size:18px;font-family:Cairo,sans-serif;font-weight:bold;margin-bottom:18px"><span>الفصل: ${classText}</span><span>${periodText}</span></div></div>${tableHtml}<div style="margin-top:48px;text-align:left;direction:rtl;font-size:18px;font-family:Cairo,sans-serif;font-weight:bold">مدير المدرسة<div style="height:90px"></div></div>`;
      // Load Cairo before rendering the report to PDF.
      let cairoLink = document.getElementById("school-report-cairo-font");
      if(!cairoLink){
        cairoLink = document.createElement("link");
        cairoLink.id = "school-report-cairo-font";
        cairoLink.rel = "stylesheet";
        cairoLink.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap";
        document.head.appendChild(cairoLink);
      }
      document.body.appendChild(container);
      if(document.fonts && document.fonts.ready){ await document.fonts.ready; }
      const canvas = await html2canvas(container,{scale:2,backgroundColor:"#ffffff",useCORS:true});
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const pageWidth=pdf.internal.pageSize.getWidth(), pageHeight=pdf.internal.pageSize.getHeight(), margin=8;
      const imgWidth=pageWidth-margin*2, imgHeight=canvas.height*imgWidth/canvas.width;
      // Keep the complete daily summary table and header together on the first page where possible.
      let remaining=imgHeight, y=margin;
      pdf.addImage(imgData,"PNG",margin,y,imgWidth,imgHeight);
      remaining -= pageHeight-margin*2;
      while(remaining>0){
        pdf.addPage();
        y=margin- (imgHeight-remaining);
        pdf.addImage(imgData,"PNG",margin,y,imgWidth,imgHeight);
        remaining -= pageHeight-margin*2;
      }
      pdf.save(reportType === "daily" ? "daily-report.pdf" : "monthly-report.pdf");
      showMessage("تم تصدير PDF بنجاح","success");
    }catch(error){
      console.log(error);
      showMessage("فشل تصدير PDF","error");
    }finally{
      if(container && container.parentNode) container.parentNode.removeChild(container);
    }
  }

  const totalAbsence =
    reportType === "daily"
      ? rows.length
      : rows.reduce(
          (sum,r)=>sum + Number(r.totalAbsence || 0),
          0
        );

  const dailyColumns = [
    { field:"seat", headerName:"رقم", width:90 },
    { field:"name", headerName:"اسم الطالبة", flex:1, minWidth:220 },
    { field:"className", headerName:"الفصل", width:100 },
    { field:"status", headerName:"الحالة", width:110 },
    { field:"date", headerName:"التاريخ", width:130 }
  ];

  const monthlyColumns = [
    { field:"seat", headerName:"رقم", width:90 },
    { field:"name", headerName:"اسم الطالبة", flex:1, minWidth:220 },
    { field:"className", headerName:"الفصل", width:100 },
    { field:"totalAbsence", headerName:"عدد الغياب (غ)", width:135 },
    { field:"totalSick", headerName:"عدد مرضي", width:115 },
    { field:"statusDetails", headerName:"تواريخ وحالات الغياب", flex:1, minWidth:350 }
  ];

  return(

    <Container
      maxWidth="xl"
      style={{
        marginTop:"20px"
      }}
    >

      <Typography
        variant="h4"
        gutterBottom
        style={{
          fontWeight:"bold",
          color:"#0f172a"
        }}
      >
        التقارير
      </Typography>

      <Grid
        container
        spacing={2}
        style={{
          marginBottom:"20px"
        }}
      >

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#e3f2fd"}}>
            <CardContent>
              <Typography fontWeight="bold">
                عدد النتائج
              </Typography>
              <Typography variant="h4">
                {rows.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#ffebee"}}>
            <CardContent>
              <Typography fontWeight="bold">
                إجمالي الغياب
              </Typography>
              <Typography variant="h4">
                {totalAbsence}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#e8f5e9"}}>
            <CardContent>
              <Typography fontWeight="bold">
                حالة التقرير
              </Typography>
              <Typography variant="h5">
                {loading ? "جاري التحميل..." : "جاهز"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Paper
        elevation={4}
        style={{
          padding:"22px",
          borderRadius:"18px",
          marginBottom:"20px"
        }}
      >

        <Grid container spacing={2}>

          <Grid item xs={12} md={3}>
            <LabelBox title="نوع التقرير">
              <FormControl fullWidth>
                <Select
                  value={reportType}
                  onChange={(e)=>{
                    setReportType(e.target.value);
                    setRows([]);
                  }}
                >
                  <MenuItem value="daily">
                    تقرير يومي
                  </MenuItem>

                  <MenuItem value="monthly">
                    تقرير شهري
                  </MenuItem>
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={3}>
            <LabelBox title="الفصل">
              <FormControl fullWidth>
                <Select
                  value={selectedClass}
                  onChange={(e)=>{
                    setSelectedClass(e.target.value);
                    setRows([]);
                  }}
                >
                  <MenuItem value="all">
                    كل الفصول
                  </MenuItem>

                  {classes.map((c,index)=>(
                    <MenuItem
                      key={index}
                      value={c}
                    >
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          {reportType === "daily" && (

            <Grid item xs={12} md={3}>
              <LabelBox title="التاريخ">
                <TextField
                  fullWidth
                  type="date"
                  value={date}
                  onChange={(e)=>setDate(e.target.value)}
                />
              </LabelBox>
            </Grid>

          )}

          {reportType === "monthly" && (

            <Grid item xs={12} md={3}>
              <LabelBox title="الشهر">
                <FormControl fullWidth>
                  <Select
                    value={month}
                    onChange={(e)=>setMonth(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      اختر الشهر
                    </MenuItem>

                    {months.map((m)=>(
                      <MenuItem
                        key={m.value}
                        value={m.value}
                      >
                        {m.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </LabelBox>
            </Grid>

          )}

          <Grid item xs={12} md={1}>
            <Typography
              variant="subtitle1"
              style={{
                fontWeight:"bold",
                marginBottom:"6px",
                color:"#1e293b"
              }}
            >
              عرض
            </Typography>

            <Button
              fullWidth
              variant="contained"
              style={{
                height:"56px",
                borderRadius:"12px",
                fontWeight:"bold"
              }}
              onClick={loadReport}
              disabled={loading}
            >
              عرض
            </Button>
          </Grid>

          <Grid item xs={12} md={1}>
            <Typography
              variant="subtitle1"
              style={{
                fontWeight:"bold",
                marginBottom:"6px",
                color:"#1e293b"
              }}
            >
              Excel
            </Typography>

            <Button
              fullWidth
              variant="contained"
              color="success"
              style={{
                height:"56px",
                borderRadius:"12px",
                fontWeight:"bold"
              }}
              onClick={exportExcel}
            >
              Excel
            </Button>
          </Grid>

          <Grid item xs={12} md={1}>
            <Typography
              variant="subtitle1"
              style={{
                fontWeight:"bold",
                marginBottom:"6px",
                color:"#1e293b"
              }}
            >
              PDF
            </Typography>

            <Button
              fullWidth
              variant="contained"
              color="error"
              style={{
                height:"56px",
                borderRadius:"12px",
                fontWeight:"bold"
              }}
              onClick={exportPDF}
            >
              PDF
            </Button>
          </Grid>

        </Grid>

      </Paper>

      <Paper
        elevation={4}
        style={{
          width:"100%",
          borderRadius:"18px",
          overflowX:"hidden"
        }}
      >
        <div
          style={{
            height:"620px",
            width:"100%"
          }}
        >
          <DataGrid
            rows={rows}
            columns={
              reportType === "daily"
                ? dailyColumns
                : monthlyColumns
            }
            pageSize={10}
            rowsPerPageOptions={[10,20,50]}
            disableSelectionOnClick
          />
        </div>
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
          style={{
            fontSize:"17px",
            minWidth:"330px",
            justifyContent:"center"
          }}
        >
          {msg}
        </Alert>
      </Snackbar>

    </Container>

  );

}

export default Reports;