import React,{ useState } from "react";

import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert
} from "@mui/material";

import { callAPI } from "../api";

function Login({ onLogin }){

  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
  const [msg,setMsg] = useState("");

  async function login(){

    if(!username || !password){
      setMsg("اكتب اسم المستخدم وكلمة المرور");

      return;
    }

    const res =
      await callAPI("login",{
        username:username,
        password:password
      });

    if(res && res.success){

      localStorage.setItem(
        "schoolUser",
        JSON.stringify(res)
      );

      onLogin(res);

    }else{
      setMsg("بيانات الدخول غير صحيحة");
    }

  }
function handleEnter(e){

  if(e.key === "Enter"){
    login();
  }

}
  return(

    <Container
      maxWidth="sm"
      style={{
        marginTop:"120px"
      }}
    >

      <Paper
        elevation={5}
        style={{
          padding:"35px",
          borderRadius:"18px"
        }}
      >

        <Typography
          variant="h4"
          gutterBottom
          style={{
            fontWeight:"bold",
            textAlign:"center"
          }}
        >
          تسجيل الدخول
        </Typography>

        <TextField
          fullWidth
          label="اسم المستخدم"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
                    onKeyDown={handleEnter}
          style={{marginTop:"20px"}}
        />

        <TextField
          fullWidth
          type="password"
          label="كلمة المرور"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
                    onKeyDown={handleEnter}
          style={{marginTop:"20px"}}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          style={{
            marginTop:"25px",
            height:"55px",
            borderRadius:"12px",
            fontWeight:"bold"
          }}
          onClick={login}
        >
          دخول
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
          severity="error"
          variant="filled"
          onClose={()=>setMsg("")}
        >
          {msg}
        </Alert>
      </Snackbar>

    </Container>

  );

}

export default Login;