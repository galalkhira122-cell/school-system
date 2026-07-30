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
  const closedMessageRef = useRef(null);

  const [term,setTerm] =
    useState("الفصل الدراسي الأول");

  const [siteClosed,setSiteClosed] =
    useState(false);

  const [weekends,setWeekends] =
    useState([]);

  const [preview,setPreview] =
    useState({
      schoolName:"",
      schoolYear:"",
      term:"الفصل الدراسي الأول",
      startDate:"",
      siteClosed:false,
      closedMessage:"الموقع مغلق الآن للصيانة"
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

    setMsgType(
      type || "success"
    );

  }

  async function loadSettings(){

    try{

      setLoading(true);

      const [
        data,
        siteData,
        weekendData
      ] =
        await Promise.all([

          callAPI(
            "getSettings"
          ),

          callAPI(
            "getSiteStatus"
          ),

          callAPI(
            "getWeekendSettings"
          )

        ]);

      const loaded = {

        schoolName:
          data.schoolName || "",

        schoolYear:
          data.schoolYear || "",

        term:
          data.term ||
          "الفصل الدراسي الأول",

        startDate:
          data.startDate || "",

        siteClosed:
          siteData &&
          siteData.success
            ? siteData.isClosed
            : false,

        closedMessage:
          siteData &&
          siteData.success
            ? siteData.message
            : "الموقع مغلق الآن للصيانة"

      };

      setPreview(loaded);

      setTerm(
        loaded.term
      );

      setSiteClosed(
        loaded.siteClosed
      );

      if(
        weekendData &&
        weekendData.success
      ){

        setWeekends(
          weekendData.weekends || []
        );

      }

      setTimeout(()=>{

        if(
          schoolNameRef.current
        ){

          schoolNameRef.current.value =
            loaded.schoolName;

        }

        if(
          schoolYearRef.current
        ){

          schoolYearRef.current.value =
            loaded.schoolYear;

        }

        if(
          startDateRef.current
        ){

          startDateRef.current.value =
            loaded.startDate;

        }

        if(
          closedMessageRef.current
        ){

          closedMessageRef.current.value =
            loaded.closedMessage;

        }

      },0);

      setLoading(false);

    }catch(error){

      console.log(error);

      setLoading(false);

      showMessage(
        "فشل تحميل الإعدادات",
        "error"
      );

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

      const closedMessage =
        closedMessageRef.current
          ? closedMessageRef.current.value.trim()
          : "الموقع مغلق الآن للصيانة";

      if(!schoolName){

        showMessage(
          "اكتب اسم المدرسة",
          "warning"
        );

        return;

      }

      const dataToSave = {

        schoolName:
          schoolName,

        schoolYear:
          schoolYear,

        term:
          term,

        startDate:
          startDate

      };

      setLoading(true);

      const [
        res,
        siteRes,
        weekendRes
      ] =
        await Promise.all([

          callAPI(
            "saveSettings",
            dataToSave
          ),

          callAPI(
            "saveSiteStatus",
            {
              isClosed:
                siteClosed,

              message:
                closedMessage
            }
          ),

          callAPI(
            "saveWeekendSettings",
            {
              weekends:
                weekends
            }
          )

        ]);

      setLoading(false);

      if(

        res?.success === true &&

        siteRes?.success === true &&

        weekendRes?.success === true

      ){

        setPreview({

          ...dataToSave,

          siteClosed:
            siteClosed,

          closedMessage:
            closedMessage

        });

        showMessage(

          res.message ||

          "تم حفظ الإعدادات وحالة الموقع",

          "success"

        );

      }else{

        const errorMessage =

          res?.error ||

          siteRes?.error ||

          weekendRes?.error ||

          "فشل حفظ الإعدادات";

        console.error(

          "نتيجة حفظ الإعدادات:",

          {

            saveSettings:
              res,

            saveSiteStatus:
              siteRes,

            saveWeekendSettings:
              weekendRes

          }

        );

        showMessage(

          errorMessage,

          "error"

        );

      }

    }catch(error){

      console.error(

        "خطأ حفظ الإعدادات:",

        error

      );

      setLoading(false);

      showMessage(

        error?.message ||

        "حدث خطأ أثناء الحفظ",

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

        إعدادات النظام

      </Typography>

      <Grid

        container

        spacing={2}

        style={{
          marginBottom:"20px"
        }}

      >

        <Grid
          item
          xs={12}
          md={3}
        >

          <Card
            style={{

              borderRadius:"16px",

              background:"#e3f2fd"

            }}
          >

            <CardContent>

              <Typography
                fontWeight="bold"
              >

                اسم المدرسة

              </Typography>

              <Typography
                variant="h5"
              >

                {preview.schoolName || "-"}

              </Typography>

            </CardContent>

          </Card>

        </Grid>

        <Grid
          item
          xs={12}
          md={3}
        >

          <Card
            style={{

              borderRadius:"16px",

              background:"#e8f5e9"

            }}
          >

            <CardContent>

              <Typography
                fontWeight="bold"
              >

                العام الدراسي

              </Typography>

              <Typography
                variant="h5"
              >

                {preview.schoolYear || "-"}

              </Typography>

            </CardContent>

          </Card>

        </Grid>

        <Grid
          item
          xs={12}
          md={3}
        >

          <Card
            style={{

              borderRadius:"16px",

              background:"#fff3e0"

            }}
          >

            <CardContent>

              <Typography
                fontWeight="bold"
              >

                الفصل الدراسي

              </Typography>

              <Typography
                variant="h5"
              >

                {preview.term || "-"}

              </Typography>

            </CardContent>

          </Card>

        </Grid>

        <Grid
          item
          xs={12}
          md={3}
        >

          <Card

            style={{

              borderRadius:"16px",

              background:
                preview.siteClosed
                  ? "#ffebee"
                  : "#e8f5e9"

            }}

          >

            <CardContent>

              <Typography
                fontWeight="bold"
              >

                حالة الموقع

              </Typography>

              <Typography
                variant="h5"
              >

                {
                  preview.siteClosed
                    ? "مغلق"
                    : "مفتوح"
                }

              </Typography>

            </CardContent>

          </Card>

        </Grid>

      </Grid>

      <Paper

        elevation={4}

        style={{

          padding:"25px",

          borderRadius:"18px",

          marginBottom:"20px"

        }}

      >

        <Typography

          variant="h6"

          gutterBottom

          style={{

            fontWeight:"bold",

            color:"#0f172a"

          }}

        >

          الإعدادات الأساسية

        </Typography>

        <Grid
          container
          spacing={2}
        >

          <Grid
            item
            xs={12}
            md={6}
          >

            <LabelBox
              title="اسم المدرسة"
            >

              <TextField

                fullWidth

                inputRef={
                  schoolNameRef
                }

                placeholder={
                  "اكتب اسم المدرسة"
                }

              />

            </LabelBox>

          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >

            <LabelBox
              title="العام الدراسي"
            >

              <TextField

                fullWidth

                inputRef={
                  schoolYearRef
                }

                placeholder={
                  "مثال: 2025 / 2026"
                }

              />

            </LabelBox>

          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >

            <LabelBox
              title="الفصل الدراسي"
            >

              <FormControl
                fullWidth
              >

                <Select

                  value={
                    term
                  }

                  onChange={
                    (e)=>
                      setTerm(
                        e.target.value
                      )
                  }

                >

                  <MenuItem
                    value="الفصل الدراسي الأول"
                  >

                    الفصل الدراسي الأول

                  </MenuItem>

                  <MenuItem
                    value="الفصل الدراسي الثاني"
                  >

                    الفصل الدراسي الثاني

                  </MenuItem>

                </Select>

              </FormControl>

            </LabelBox>

          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >

            <LabelBox
              title="تاريخ بداية الدراسة"
            >

              <TextField

                fullWidth

                type="date"

                inputRef={
                  startDateRef
                }

              />

            </LabelBox>

          </Grid>

        </Grid>

      </Paper>

      <Paper

        elevation={4}

        style={{

          padding:"25px",

          borderRadius:"18px",

          marginBottom:"20px",

          border:

            siteClosed

              ? "2px solid #dc2626"

              : "2px solid #16a34a"

        }}

      >

        <Typography

          variant="h6"

          gutterBottom

          style={{

            fontWeight:"bold",

            color:

              siteClosed

                ? "#dc2626"

                : "#15803d"

          }}

        >

          التحكم في فتح وغلق الموقع

        </Typography>

        <Grid
          container
          spacing={2}
        >

          <Grid
            item
            xs={12}
            md={4}
          >

            <LabelBox
              title="حالة الموقع"
            >

              <FormControl
                fullWidth
              >

                <Select

                  value={
                    siteClosed
                      ? "closed"
                      : "open"
                  }

                  onChange={
                    (e)=>

                      setSiteClosed(

                        e.target.value ===
                        "closed"

                      )
                  }

                >

                  <MenuItem
                    value="open"
                  >

                    الموقع مفتوح

                  </MenuItem>

                  <MenuItem
                    value="closed"
                  >

                    الموقع مغلق للصيانة

                  </MenuItem>

                </Select>

              </FormControl>

            </LabelBox>

          </Grid>

          <Grid
            item
            xs={12}
            md={8}
          >

            <LabelBox

              title={
                "رسالة تظهر للمستخدمين عند غلق الموقع"
              }

            >

              <TextField

                fullWidth

                inputRef={
                  closedMessageRef
                }

                placeholder={
                  "الموقع مغلق الآن للصيانة"
                }

              />

            </LabelBox>

          </Grid>

          <Grid
            item
            xs={12}
          >

            <Alert

              severity={
                siteClosed
                  ? "warning"
                  : "success"
              }

            >

              {

                siteClosed

                  ? "عند الحفظ سيتم غلق الموقع أمام جميع المستخدمين ما عدا Admin."

                  : "الموقع متاح لجميع المستخدمين بعد الحفظ."

              }

            </Alert>

          </Grid>

        </Grid>

      </Paper>

      <Paper

        elevation={4}

        style={{

          padding:"25px",

          borderRadius:"18px",

          marginBottom:"20px"

        }}

      >

        <Typography

          variant="h6"

          gutterBottom

          style={{

            fontWeight:"bold",

            color:"#0f172a"

          }}

        >

          أيام العطلات الأسبوعية

        </Typography>

        <FormControl
          fullWidth
        >

          <Select

            multiple

            value={
              weekends
            }

            onChange={
              (e)=>

                setWeekends(
                  e.target.value
                )
            }

          >

            <MenuItem
              value="Sunday"
            >

              الأحد

            </MenuItem>

            <MenuItem
              value="Monday"
            >

              الاثنين

            </MenuItem>

            <MenuItem
              value="Tuesday"
            >

              الثلاثاء

            </MenuItem>

            <MenuItem
              value="Wednesday"
            >

              الأربعاء

            </MenuItem>

            <MenuItem
              value="Thursday"
            >

              الخميس

            </MenuItem>

            <MenuItem
              value="Friday"
            >

              الجمعة

            </MenuItem>

            <MenuItem
              value="Saturday"
            >

              السبت

            </MenuItem>

          </Select>

        </FormControl>

        <Alert

          severity="info"

          style={{
            marginTop:"15px"
          }}

        >

          سيتم غلق الموقع تلقائيًا في أيام العطلات المختارة.

        </Alert>

      </Paper>

      <Button

        variant="contained"

        color="success"

        size="large"

        style={{

          height:"56px",

          borderRadius:"12px",

          fontWeight:"bold",

          minWidth:"240px"

        }}

        onClick={
          save
        }

        disabled={
          loading
        }

      >

        {

          loading

            ? "جاري الحفظ..."

            : "حفظ الإعدادات"

        }

      </Button>

      <Snackbar

        open={
          Boolean(msg)
        }

        autoHideDuration={
          3000
        }

        onClose={
          ()=>setMsg("")
        }

        anchorOrigin={{

          vertical:"top",

          horizontal:"center"

        }}

      >

        <Alert

          severity={
            msgType
          }

          variant="filled"

          onClose={
            ()=>setMsg("")
          }

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