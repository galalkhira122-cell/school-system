import React,{ useEffect, useState } from "react";

import {
  Container,
  Typography,
  Paper,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import { callAPI } from "../api";

function AuditLog(){

  const [rows,setRows] = useState([]);
  const [loading,setLoading] = useState(false);

  const [msg,setMsg] = useState("");
  const [msgType,setMsgType] = useState("success");

  const [openClear,setOpenClear] = useState(false);
  const [password,setPassword] = useState("");

  useEffect(()=>{
    load();
  },[]);

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "success");
  }

  async function load(){

    try{

      setLoading(true);

      const res =
        await callAPI("getAuditLog");

      if(res && res.success){
        setRows(Array.isArray(res.records) ? res.records : []);
      }else{
        showMessage(res.error || "فشل تحميل سجل التعديلات","error");
      }

      setLoading(false);

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("خطأ في تحميل سجل التعديلات","error");

    }

  }

  async function clearLog(){

    try{

      if(password !== "111"){
        showMessage("الرقم السري غير صحيح","error");
        return;
      }

      setLoading(true);

      const res =
        await callAPI("clearAuditLog",{
          password:password
        });

      setLoading(false);

      if(res && res.success){

        setRows([]);
        setOpenClear(false);
        setPassword("");

        showMessage(
          res.message || "تم تفريغ سجل التعديلات",
          "success"
        );

      }else{

        showMessage(
          res.error || "فشل تفريغ السجل",
          "error"
        );

      }

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("خطأ أثناء تفريغ السجل","error");

    }

  }

  const columns = [
    { field:"time", headerName:"وقت التعديل", width:170 },
    { field:"user", headerName:"المستخدم", width:140 },
    { field:"seat", headerName:"رقم الجلوس", width:110 },
    { field:"studentName", headerName:"اسم الطالبة", flex:1, minWidth:220 },
    { field:"date", headerName:"التاريخ", width:120 },
    { field:"session", headerName:"Session", width:130 },
    { field:"oldStatus", headerName:"قبل", width:90 },
    { field:"newStatus", headerName:"بعد", width:90 },
    { field:"notes", headerName:"ملاحظات", flex:1, minWidth:220 }
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
        سجل تعديلات الغياب
      </Typography>

      <Button
        variant="contained"
        onClick={load}
        disabled={loading}
        style={{
          marginBottom:"15px",
          fontWeight:"bold"
        }}
      >
        تحديث السجل
      </Button>

      <Button
        variant="contained"
        color="error"
        onClick={()=>setOpenClear(true)}
        disabled={loading}
        style={{
          marginBottom:"15px",
          marginRight:"10px",
          fontWeight:"bold"
        }}
      >
        تفريغ السجل
      </Button>

      <Paper
        elevation={4}
        style={{
          height:"650px",
          borderRadius:"18px",
          overflow:"hidden"
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10,20,50]}
          loading={loading}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog
        open={openClear}
        onClose={()=>setOpenClear(false)}
        maxWidth="xs"
        fullWidth
      >

        <DialogTitle>
          تفريغ سجل التعديلات
        </DialogTitle>

        <DialogContent>

          <Alert
            severity="warning"
            style={{
              marginBottom:"15px"
            }}
          >
            سيتم حذف كل بيانات سجل التعديلات مع بقاء العناوين فقط.
          </Alert>

          <TextField
            fullWidth
            type="password"
            label="الرقم السري"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

        </DialogContent>

        <DialogActions>

          <Button onClick={()=>setOpenClear(false)}>
            إلغاء
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={clearLog}
          >
            تفريغ
          </Button>

        </DialogActions>

      </Dialog>

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

export default AuditLog;