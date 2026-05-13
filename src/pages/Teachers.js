import React,{ useEffect, useState } from "react";

import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import { callAPI } from "../api";

function Teachers(){

  const [teachers,setTeachers] = useState([]);
  const [search,setSearch] = useState("");
  const [newTeacher,setNewTeacher] = useState("");
  const [open,setOpen] = useState(false);

  const [msg,setMsg] = useState("");
  const [msgType,setMsgType] = useState("success");

  useEffect(()=>{
    load();
  },[]);

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "success");
  }

  async function load(){

    try{

      const data =
        await callAPI("getTeachersStats");

      const arr =
        Array.isArray(data)
          ? data.map((t,index)=>({
              id:index,
              name:t.name,
              totalSessions:t.totalSessions || 0,
              sessions:Array.isArray(t.sessions)
                ? t.sessions.join(" - ")
                : ""
            }))
          : [];

      setTeachers(arr);

    }catch(error){

      console.log(error);
      showMessage("فشل تحميل بيانات المعلمين","error");

    }

  }

  async function addTeacher(){

    try{

      if(!newTeacher.trim()){
        showMessage("اكتب اسم المعلم","warning");
        return;
      }

      const res =
        await callAPI("addTeacher",{
          name:newTeacher.trim()
        });

      if(res && res.success){
        showMessage(res.message || "تمت الإضافة","success");
        setNewTeacher("");
        setOpen(false);
        load();
      }else{
        showMessage(res.error || "فشل إضافة المعلم","error");
      }

    }catch(error){

      console.log(error);
      showMessage("خطأ أثناء إضافة المعلم","error");

    }

  }

  async function removeTeacher(row){

    const ok =
      window.confirm(
        "هل تريد حذف المعلم: " + row.name + " ؟"
      );

    if(!ok){
      return;
    }

    try{

      const res =
        await callAPI("deleteTeacher",{
          name:row.name
        });

      if(res && res.success){
        showMessage(res.message || "تم الحذف","success");
        load();
      }else{
        showMessage(res.error || "فشل حذف المعلم","error");
      }

    }catch(error){

      console.log(error);
      showMessage("خطأ أثناء حذف المعلم","error");

    }

  }

  const filtered =
    teachers.filter(t=>
      String(t.name || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const totalSessions =
    filtered.reduce(
      (sum,t)=>sum + Number(t.totalSessions || 0),
      0
    );

  const columns = [
    {
      field:"name",
      headerName:"اسم المعلم",
      flex:1,
      minWidth:220
    },
    {
      field:"totalSessions",
      headerName:"عدد الجلسات المسجلة",
      width:170
    },
    {
      field:"sessions",
      headerName:"الجلسات",
      flex:1,
      minWidth:300
    },
    {
      field:"actions",
      headerName:"إجراءات",
      width:120,
      sortable:false,
      filterable:false,
      renderCell:(params)=>(
        <Button
          size="small"
          variant="contained"
          color="error"
          onClick={()=>removeTeacher(params.row)}
        >
          حذف
        </Button>
      )
    }
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
        إدارة المعلمين
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
                عدد المعلمين
              </Typography>
              <Typography variant="h4">
                {filtered.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#e8f5e9"}}>
            <CardContent>
              <Typography fontWeight="bold">
                إجمالي الجلسات المسجلة
              </Typography>
              <Typography variant="h4">
                {totalSessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#fff3e0"}}>
            <CardContent>
              <Typography fontWeight="bold">
                حالة الصفحة
              </Typography>
              <Typography variant="h5">
                جاهز
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

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="بحث باسم المعلم"
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              style={{
                height:"56px",
                borderRadius:"12px",
                fontWeight:"bold"
              }}
              onClick={()=>setOpen(true)}
            >
              إضافة معلم
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
        <div style={{height:"620px",width:"100%"}}>
          <DataGrid
            rows={filtered}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10,20,50]}
            disableSelectionOnClick
          />
        </div>
      </Paper>

      <Dialog
        open={open}
        onClose={()=>setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          إضافة معلم جديد
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="اسم المعلم"
            value={newTeacher}
            onChange={(e)=>setNewTeacher(e.target.value)}
            style={{marginTop:"10px"}}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={()=>setOpen(false)}>
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={addTeacher}
          >
            حفظ
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

export default Teachers;