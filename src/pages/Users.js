import React,{ useEffect, useState } from "react";

import {
  Container, Typography, Paper, Grid, TextField,
  Button, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl,
  Select, MenuItem
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import { callAPI } from "../api";

function Users(){

  const [users,setUsers] = useState([]);
  const [open,setOpen] = useState(false);
  const [editMode,setEditMode] = useState(false);

  const [form,setForm] = useState({
    oldUsername:"",
    username:"",
    password:"",
    role:"Teacher"
  });

  const [msg,setMsg] = useState("");
  const [msgType,setMsgType] = useState("success");

  useEffect(()=>{
    loadUsers();
  },[]);

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "success");
  }

  async function loadUsers(){

    const data = await callAPI("getUsers");

    const arr = Array.isArray(data)
      ? data.map((u,index)=>({
          id:index,
          username:u.username,
          password:u.password,
          role:u.role
        }))
      : [];

    setUsers(arr);
  }

  function openAdd(){
    setEditMode(false);
    setForm({
      oldUsername:"",
      username:"",
      password:"",
      role:"Teacher"
    });
    setOpen(true);
  }

  function openEdit(row){
    setEditMode(true);
    setForm({
      oldUsername:row.username,
      username:row.username,
      password:row.password,
      role:row.role
    });
    setOpen(true);
  }

  async function saveUser(){

    const action = editMode ? "updateUser" : "addUser";
    const res = await callAPI(action,form);

    if(res && res.success){
      showMessage(res.message,"success");
      setOpen(false);
      loadUsers();
    }else{
      showMessage(res.error || "فشل الحفظ","error");
    }
  }

  async function removeUser(row){

    if(!window.confirm("هل تريد حذف المستخدم: " + row.username + " ؟")){
      return;
    }

    const res = await callAPI("deleteUser",{
      username:row.username
    });

    if(res && res.success){
      showMessage(res.message,"success");
      loadUsers();
    }else{
      showMessage(res.error || "فشل الحذف","error");
    }
  }

  const columns = [
    { field:"username", headerName:"اسم المستخدم", flex:1, minWidth:180 },
    { field:"password", headerName:"كلمة المرور", width:150 },
    { field:"role", headerName:"الصلاحية", width:150 },
    {
      field:"actions",
      headerName:"إجراءات",
      width:190,
      sortable:false,
      renderCell:(params)=>(
        <>
          <Button
            size="small"
            variant="contained"
            onClick={()=>openEdit(params.row)}
            style={{marginLeft:"6px"}}
          >
            تعديل
          </Button>

          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={()=>removeUser(params.row)}
          >
            حذف
          </Button>
        </>
      )
    }
  ];

  return(

    <Container maxWidth="xl" style={{marginTop:"20px"}}>

      <Typography
        variant="h4"
        gutterBottom
        style={{fontWeight:"bold"}}
      >
        إدارة المستخدمين
      </Typography>

      <Paper
        elevation={4}
        style={{
          padding:"20px",
          borderRadius:"18px",
          marginBottom:"20px"
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              style={{
                height:"56px",
                borderRadius:"12px",
                fontWeight:"bold"
              }}
              onClick={openAdd}
            >
              إضافة مستخدم
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        elevation={4}
        style={{
          height:"620px",
          borderRadius:"18px"
        }}
      >
        <DataGrid
          rows={users}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10,20,50]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? "تعديل مستخدم" : "إضافة مستخدم"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="اسم المستخدم"
            value={form.username}
            onChange={(e)=>setForm({...form,username:e.target.value})}
            style={{marginTop:"15px"}}
          />

          <TextField
            fullWidth
            label="كلمة المرور"
            value={form.password}
            onChange={(e)=>setForm({...form,password:e.target.value})}
            style={{marginTop:"15px"}}
          />

          <FormControl fullWidth style={{marginTop:"15px"}}>
            <Select
              value={form.role}
              onChange={(e)=>setForm({...form,role:e.target.value})}
            >
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Teacher">Teacher</MenuItem>
              <MenuItem value="Supervisor">Supervisor</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={()=>setOpen(false)}>
            إلغاء
          </Button>

          <Button variant="contained" onClick={saveUser}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(msg)}
        autoHideDuration={3000}
        onClose={()=>setMsg("")}
        anchorOrigin={{vertical:"top",horizontal:"center"}}
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

export default Users;