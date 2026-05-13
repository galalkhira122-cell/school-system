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
              dates:Array.isArray(r.dates)
                ? r.dates.join(" - ")
                : ""
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
          "عدد الغياب":r.totalAbsence,
          "تواريخ الغياب":r.dates
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
            { wch:60 }
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

    if(rows.length === 0){
      showMessage("لا توجد بيانات للتصدير","warning");
      return;
    }

    try{

      const container = document.createElement("div");

      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "1200px";
      container.style.padding = "25px";
      container.style.background = "#ffffff";
      container.style.direction = "rtl";
      container.style.fontFamily = "Arial, Tahoma, sans-serif";
      container.style.color = "#111827";

      const title =
        reportType === "daily"
          ? "تقرير الغياب اليومي"
          : "تقرير الغياب الشهري";

      const classText =
        selectedClass === "all"
          ? "كل الفصول"
          : selectedClass;

      const periodText =
        reportType === "daily"
          ? "التاريخ: " + date
          : "الشهر: " + (
              months.find(m=>m.value === month)
                ? months.find(m=>m.value === month).label
                : month
            );

      const tableHeaders =
        reportType === "daily"
          ? ["رقم الجلوس","اسم الطالبة","الفصل","الحالة","التاريخ"]
          : ["رقم الجلوس","اسم الطالبة","الفصل","عدد الغياب","تواريخ الغياب"];

      const tableRows =
        rows.map(r=>{
          if(reportType === "daily"){
            return [
              r.seat || "",
              r.name || "",
              r.className || "",
              r.status || "",
              r.date || ""
            ];
          }

          return [
            r.seat || "",
            r.name || "",
            r.className || "",
            r.totalAbsence || 0,
            r.dates || ""
          ];
        });

      container.innerHTML = `
        <div style="width:100%;direction:rtl;text-align:right;">
          <h2 style="
            text-align:center;
            margin:0 0 14px 0;
            font-size:26px;
            color:#0f172a;
          ">
            ${title}
          </h2>

          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            margin-bottom:16px;
            font-size:16px;
            font-weight:bold;
          ">
            <div>الفصل: ${classText}</div>
            <div>${periodText}</div>
            <div>عدد النتائج: ${rows.length}</div>
          </div>

          <table style="
            width:100%;
            border-collapse:collapse;
            font-size:14px;
            direction:rtl;
          ">
            <thead>
              <tr>
                ${tableHeaders.map(h=>`
                  <th style="
                    border:1px solid #333;
                    padding:8px;
                    background:#e5e7eb;
                    text-align:center;
                    font-weight:bold;
                  ">
                    ${h}
                  </th>
                `).join("")}
              </tr>
            </thead>

            <tbody>
              ${tableRows.map(row=>`
                <tr>
                  ${row.map(cell=>`
                    <td style="
                      border:1px solid #333;
                      padding:8px;
                      text-align:center;
                      vertical-align:middle;
                    ">
                      ${cell}
                    </td>
                  `).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      document.body.appendChild(container);

      const canvas = await html2canvas(container,{
        scale:2,
        useCORS:true,
        backgroundColor:"#ffffff"
      });

      document.body.removeChild(container);

      const imgData =
        canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation:"landscape",
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

      pdf.save(
        reportType === "daily"
          ? "daily-report.pdf"
          : "monthly-report.pdf"
      );

      showMessage("تم تصدير PDF بنجاح","success");

    }catch(error){

      console.log(error);
      showMessage("فشل تصدير PDF","error");

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
    { field:"totalAbsence", headerName:"عدد الغياب", width:120 },
    { field:"dates", headerName:"تواريخ الغياب", flex:1, minWidth:350 }
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