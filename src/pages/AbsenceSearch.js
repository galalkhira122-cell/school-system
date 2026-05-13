import React,{ useRef, useState } from "react";

import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Snackbar,
  Alert,
  FormControl,
  Select,
  MenuItem,
  Box,
  Card,
  CardContent
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { callAPI } from "../api";

function AbsenceSearch(){

  const keywordRef = useRef(null);

  const [searchType,setSearchType] = useState("seat");
  const [month,setMonth] = useState("");
  const [rows,setRows] = useState([]);
  const [loading,setLoading] = useState(false);

  const [msg,setMsg] = useState("");
  const [msgType,setMsgType] = useState("warning");

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "warning");
  }

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

  async function search(){

    try{

      const keyword =
        keywordRef.current
          ? keywordRef.current.value.trim()
          : "";

      if(!keyword){
        showMessage("اكتب رقم الجلوس أو اسم الطالبة","warning");
        return;
      }

      if(!month){
        showMessage("اختر الشهر","warning");
        return;
      }

      setLoading(true);

      const data =
        await callAPI(
          "getStudentMonthlyAbsence",
          {
            keyword:keyword,
            searchType:searchType,
            month:month
          }
        );

      const arr =
        Array.isArray(data)
          ? data
              .filter((s)=>{

                if(searchType === "seat"){

                  return (
                    String(s.seat || "")
                      .trim()
                      ===
                    keyword.trim()
                  );

                }

                return String(s.name || "")
                  .toLowerCase()
                  .includes(
                    keyword
                      .trim()
                      .toLowerCase()
                  );

              })
              .map((s,index)=>({

                id:index,

                seat:s.seat,

                name:s.name,

                className:s.className,

                totalAbsence:
                  Number(
                    s.totalAbsence || 0
                  ),

                details:
                  Array.isArray(s.details)
                    ? s.details.join(" - ")
                    : ""

              }))
          : [];

      setRows(arr);

      setLoading(false);

      if(arr.length === 0){

        showMessage(
          "لم يتم العثور على نتائج",
          "info"
        );

      }else{

        showMessage(
          "تم تحميل النتائج",
          "success"
        );

      }

    }catch(error){

      console.log(error);

      setLoading(false);

      showMessage(
        "فشل البحث",
        "error"
      );

    }

  }

  function clearSearch(){

    if(keywordRef.current){
      keywordRef.current.value = "";
    }

    setRows([]);
    setMonth("");
    setSearchType("seat");

    showMessage(
      "تم مسح البحث",
      "info"
    );

  }

  function exportCSV(){

    if(rows.length === 0){

      showMessage(
        "لا توجد بيانات للتصدير",
        "warning"
      );

      return;

    }

    const headers = [
      "رقم الجلوس",
      "اسم الطالبة",
      "الفصل",
      "عدد الغياب",
      "تواريخ الغياب"
    ];

    const csvRows = [
      headers.join(",")
    ];

    rows.forEach((r)=>{

      csvRows.push([
        r.seat,
        '"' + r.name + '"',
        r.className,
        r.totalAbsence,
        '"' + r.details + '"'
      ].join(","));

    });

    const csvContent =
      "\uFEFF" + csvRows.join("\n");

    const blob =
      new Blob(
        [csvContent],
        {
          type:"text/csv;charset=utf-8;"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = "absence-search.csv";
    link.click();

    URL.revokeObjectURL(url);

    showMessage(
      "تم تصدير CSV بنجاح",
      "success"
    );

  }

  async function exportPDF(){

    if(rows.length === 0){

      showMessage(
        "لا توجد بيانات للتصدير",
        "warning"
      );

      return;

    }

    try{

      const container =
        document.createElement("div");

      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "1200px";
      container.style.padding = "25px";
      container.style.background = "#ffffff";
      container.style.direction = "rtl";
      container.style.fontFamily = "Arial, Tahoma, sans-serif";
      container.style.color = "#111827";

      const tableRows =
        rows.map(r=>[
          r.seat || "",
          r.name || "",
          r.className || "",
          r.totalAbsence || 0,
          r.details || ""
        ]);

      container.innerHTML = `
        <div style="width:100%;direction:rtl;text-align:right;">

          <h2 style="
            text-align:center;
            margin:0 0 14px 0;
            font-size:26px;
            color:#0f172a;
          ">
            تقرير حصر الغياب
          </h2>

          <div style="
            display:flex;
            justify-content:space-between;
            margin-bottom:16px;
            font-size:16px;
            font-weight:bold;
          ">
            <div>عدد النتائج: ${rows.length}</div>
            <div>إجمالي الغياب: ${totalAbsence}</div>
            <div>الشهر: ${month}</div>
          </div>

          <table style="
            width:100%;
            border-collapse:collapse;
            font-size:14px;
            direction:rtl;
          ">

            <thead>

              <tr>

                ${[
                  "رقم الجلوس",
                  "اسم الطالبة",
                  "الفصل",
                  "عدد الغياب",
                  "تواريخ الغياب"
                ].map(h=>`

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

      const canvas =
        await html2canvas(
          container,
          {
            scale:2,
            useCORS:true,
            backgroundColor:"#ffffff"
          }
        );

      document.body.removeChild(container);

      const imgData =
        canvas.toDataURL("image/png");

      const pdf =
        new jsPDF({
          orientation:"landscape",
          unit:"mm",
          format:"a4"
        });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 10;

      const imgWidth =
        pageWidth - margin * 2;

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
        "absence-search-report.pdf"
      );

      showMessage(
        "تم تصدير PDF بنجاح",
        "success"
      );

    }catch(error){

      console.log(error);

      showMessage(
        "فشل تصدير PDF",
        "error"
      );

    }

  }

  const totalAbsence =
    rows.reduce(
      (sum,row)=>
        sum + Number(row.totalAbsence || 0),
      0
    );

  const columns = [

    {
      field:"seat",
      headerName:"رقم",
      width:90
    },

    {
      field:"name",
      headerName:"اسم الطالبة",
      flex:1,
      minWidth:220
    },

    {
      field:"className",
      headerName:"الفصل",
      width:100
    },

    {
      field:"totalAbsence",
      headerName:"عدد الغياب",
      width:120
    },

    {
      field:"details",
      headerName:"تواريخ الغياب",
      flex:1,
      minWidth:350
    }

  ];

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
        حصر الغياب
      </Typography>

      <Grid
        container
        spacing={2}
        style={{
          marginBottom:"20px"
        }}
      >

        <Grid item xs={12} md={4}>
          <Card
            style={{
              borderRadius:"16px",
              background:"#e3f2fd"
            }}
          >
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
          <Card
            style={{
              borderRadius:"16px",
              background:"#ffebee"
            }}
          >
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
          <Card
            style={{
              borderRadius:"16px",
              background:"#e8f5e9"
            }}
          >
            <CardContent>
              <Typography fontWeight="bold">
                حالة البحث
              </Typography>

              <Typography variant="h5">
                {loading
                  ? "جاري البحث..."
                  : "جاهز"}
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

            <LabelBox title="نوع البحث">

              <FormControl fullWidth>

                <Select
                  value={searchType}
                  onChange={(e)=>
                    setSearchType(
                      e.target.value
                    )
                  }
                >

                  <MenuItem value="seat">
                    رقم الجلوس
                  </MenuItem>

                  <MenuItem value="name">
                    اسم الطالبة
                  </MenuItem>

                </Select>

              </FormControl>

            </LabelBox>

          </Grid>

          <Grid item xs={12} md={4}>

            <LabelBox title="بيانات البحث">

              <TextField
                fullWidth
                inputRef={keywordRef}
                placeholder={
                  searchType === "seat"
                    ? "اكتب رقم الجلوس"
                    : "اكتب اسم الطالبة"
                }
              />

            </LabelBox>

          </Grid>

          <Grid item xs={12} md={3}>

            <LabelBox title="الشهر">

              <FormControl fullWidth>

                <Select
                  value={month}
                  onChange={(e)=>
                    setMonth(
                      e.target.value
                    )
                  }
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

          <Grid item xs={12} md={2}>

            <Typography
              variant="subtitle1"
              style={{
                fontWeight:"bold",
                marginBottom:"6px",
                color:"#1e293b"
              }}
            >
              بحث
            </Typography>

            <Button
              fullWidth
              variant="contained"
              style={{
                height:"56px",
                borderRadius:"12px",
                fontWeight:"bold"
              }}
              onClick={search}
              disabled={loading}
            >
              بحث
            </Button>

          </Grid>

        </Grid>

      </Paper>

      <Paper
        elevation={3}
        style={{
          padding:"15px",
          borderRadius:"16px",
          marginBottom:"20px"
        }}
      >

        <Grid container spacing={2}>

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              style={{
                height:"50px",
                fontWeight:"bold"
              }}
              onClick={exportCSV}
            >
              تصدير Excel / CSV
            </Button>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="error"
              style={{
                height:"50px",
                fontWeight:"bold"
              }}
              onClick={exportPDF}
            >
              تصدير PDF
            </Button>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="warning"
              style={{
                height:"50px",
                fontWeight:"bold"
              }}
              onClick={clearSearch}
            >
              مسح البحث
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
            height:"600px",
            width:"100%"
          }}
        >

          <DataGrid
            rows={rows}
            columns={columns}
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

export default AbsenceSearch;