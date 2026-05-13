import React,{ useState } from "react";

import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Snackbar,
  Alert,
  Card,
  CardContent
} from "@mui/material";

import * as XLSX from "xlsx";

import { callAPI } from "../api";

function Backup(){

  const [loading,setLoading] = useState(false);
  const [msg,setMsg] = useState("");
  const [msgType,setMsgType] = useState("success");

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "success");
  }

  function sheetFromArray(data){

    return XLSX.utils.aoa_to_sheet(data || []);

  }

  async function exportBackup(){

    try{

      setLoading(true);

      const data =
        await callAPI("getBackupData");

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        sheetFromArray(data.students),
        "بيانات"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        sheetFromArray(data.absence),
        "حصر الغياب"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        sheetFromArray(data.users),
        "Users"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        sheetFromArray(data.sheet1),
        "Sheet1"
      );

      XLSX.writeFile(
        workbook,
        "school-system-backup.xlsx"
      );

      setLoading(false);

      showMessage(
        "تم تصدير النسخة الاحتياطية بنجاح",
        "success"
      );

    }catch(error){

      console.log(error);

      setLoading(false);

      showMessage(
        "فشل تصدير النسخة الاحتياطية",
        "error"
      );

    }

  }

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
        النسخ الاحتياطي
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
                البيانات
              </Typography>
              <Typography variant="h5">
                الطلاب والمعلمين
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#e8f5e9"}}>
            <CardContent>
              <Typography fontWeight="bold">
                الغياب
              </Typography>
              <Typography variant="h5">
                Sheet1 + حصر الغياب
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#fff3e0"}}>
            <CardContent>
              <Typography fontWeight="bold">
                المستخدمين
              </Typography>
              <Typography variant="h5">
                Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Paper
        elevation={4}
        style={{
          padding:"30px",
          borderRadius:"18px"
        }}
      >

        <Typography
          variant="h6"
          gutterBottom
          style={{
            fontWeight:"bold"
          }}
        >
          تصدير نسخة احتياطية كاملة من النظام
        </Typography>

        <Typography
          style={{
            marginBottom:"25px",
            color:"#475569"
          }}
        >
          سيتم تصدير ملف Excel يحتوي على صفحات: بيانات، حصر الغياب، Users، Sheet1.
        </Typography>

        <Button
          variant="contained"
          color="success"
          size="large"
          style={{
            height:"56px",
            borderRadius:"12px",
            fontWeight:"bold",
            minWidth:"260px"
          }}
          onClick={exportBackup}
          disabled={loading}
        >
          {loading ? "جاري التصدير..." : "تصدير نسخة احتياطية"}
        </Button>

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

export default Backup;