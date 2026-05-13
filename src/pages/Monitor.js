import React,{ useEffect, useState } from "react";

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
  MenuItem
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import { callAPI } from "../api";

function Monitor(){

  const [rows,setRows] = useState([]);
  const [registered,setRegistered] = useState([]);
  const [notRegistered,setNotRegistered] = useState([]);
  const [activeSession,setActiveSession] = useState(null);

  const [filter,setFilter] = useState("all");
  const [loading,setLoading] = useState(false);

  const [msg,setMsg] = useState("");
  const [msgType,setMsgType] = useState("success");

  useEffect(()=>{

    load();

    const timer =
      setInterval(load,60000);

    return ()=>clearInterval(timer);

  },[]);

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "success");
  }

  async function load(){

    try{

      setLoading(true);

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

      }else{

        showMessage(
          res && res.error
            ? res.error
            : "فشل تحميل المتابعة",
          "error"
        );

      }

      setLoading(false);

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("خطأ في تحميل المتابعة","error");

    }

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

      <Typography
        variant="h4"
        gutterBottom
        style={{
          fontWeight:"bold",
          color:"#0f172a"
        }}
      >
        متابعة تسجيل الغياب
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
                {loading ? "جاري التحديث..." : "محدث تلقائيًا"}
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