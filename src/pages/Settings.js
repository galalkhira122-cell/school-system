import React,{ useEffect, useRef, useState } from "react";

import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Snackbar,
  Alert,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  Box
} from "@mui/material";

import { callAPI } from "../api";

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

function Settings(){

  const schoolNameRef = useRef(null);
  const schoolYearRef = useRef(null);
  const startDateRef = useRef(null);

  const [term,setTerm] =
    useState("الفصل الدراسي الأول");

  const [preview,setPreview] =
    useState({
      schoolName:"",
      schoolYear:"",
      term:"الفصل الدراسي الأول",
      startDate:""
    });

  const [loading,setLoading] =
    useState(false);

  const [msg,setMsg] =
    useState("");

  const [msgType,setMsgType] =
    useState("success");

  useEffect(()=>{
    loadSettings();
  },[]);

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "success");
  }

  async function loadSettings(){

    try{

      setLoading(true);

      const data =
        await callAPI("getSettings");

      const loaded = {
        schoolName:data.schoolName || "",
        schoolYear:data.schoolYear || "",
        term:data.term || "الفصل الدراسي الأول",
        startDate:data.startDate || ""
      };

      setPreview(loaded);
      setTerm(loaded.term);

      setTimeout(()=>{

        if(schoolNameRef.current){
          schoolNameRef.current.value = loaded.schoolName;
        }

        if(schoolYearRef.current){
          schoolYearRef.current.value = loaded.schoolYear;
        }

        if(startDateRef.current){
          startDateRef.current.value = loaded.startDate;
        }

      },0);

      setLoading(false);

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("فشل تحميل الإعدادات","error");

    }

  }

  async function save(){

    try{

      const schoolName =
        schoolNameRef.current
        ? schoolNameRef.current.value.trim()
        : "";

      const schoolYear =
        schoolYearRef.current
        ? schoolYearRef.current.value.trim()
        : "";

      const startDate =
        startDateRef.current
        ? startDateRef.current.value
        : "";

      if(!schoolName){
        showMessage("اكتب اسم المدرسة","warning");
        return;
      }

      const dataToSave = {
        schoolName:schoolName,
        schoolYear:schoolYear,
        term:term,
        startDate:startDate
      };

      setLoading(true);

      const res =
        await callAPI(
          "saveSettings",
          dataToSave
        );

      setLoading(false);

      if(res && res.success){

        setPreview(dataToSave);

        showMessage(
          res.message || "تم الحفظ",
          "success"
        );

      }else{

        showMessage(
          res.error || "فشل الحفظ",
          "error"
        );

      }

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("خطأ أثناء الحفظ","error");

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
        إعدادات النظام
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
                اسم المدرسة
              </Typography>
              <Typography variant="h5">
                {preview.schoolName || "-"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#e8f5e9"}}>
            <CardContent>
              <Typography fontWeight="bold">
                العام الدراسي
              </Typography>
              <Typography variant="h5">
                {preview.schoolYear || "-"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#fff3e0"}}>
            <CardContent>
              <Typography fontWeight="bold">
                الفصل الدراسي
              </Typography>
              <Typography variant="h5">
                {preview.term || "-"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Paper
        elevation={4}
        style={{
          padding:"25px",
          borderRadius:"18px"
        }}
      >

        <Grid container spacing={2}>

          <Grid item xs={12} md={6}>
            <LabelBox title="اسم المدرسة">
              <TextField
                fullWidth
                inputRef={schoolNameRef}
                placeholder="اكتب اسم المدرسة"
              />
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={6}>
            <LabelBox title="العام الدراسي">
              <TextField
                fullWidth
                inputRef={schoolYearRef}
                placeholder="مثال: 2025 / 2026"
              />
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={6}>
            <LabelBox title="الفصل الدراسي">
              <FormControl fullWidth>
                <Select
                  value={term}
                  onChange={(e)=>setTerm(e.target.value)}
                >
                  <MenuItem value="الفصل الدراسي الأول">
                    الفصل الدراسي الأول
                  </MenuItem>

                  <MenuItem value="الفصل الدراسي الثاني">
                    الفصل الدراسي الثاني
                  </MenuItem>
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={6}>
            <LabelBox title="تاريخ بداية الدراسة">
              <TextField
                fullWidth
                type="date"
                inputRef={startDateRef}
              />
            </LabelBox>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="success"
              size="large"
              style={{
                height:"56px",
                borderRadius:"12px",
                fontWeight:"bold",
                minWidth:"220px"
              }}
              onClick={save}
              disabled={loading}
            >
              {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </Grid>

        </Grid>

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

export default Settings;