import React,{ useEffect, useState } from "react";

import {
  Container, Typography, Paper, Grid, TextField,
  FormControl, Select, MenuItem, Button, Box,
  Snackbar, Alert, Card, CardContent, Dialog,
  DialogTitle, DialogContent, DialogActions
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import { callAPI } from "../api";

function Students(){

  const [classes,setClasses] = useState([]);
  const [students,setStudents] = useState([]);

  const [selectedClass,setSelectedClass] = useState("");
  const [lang,setLang] = useState("all");
  const [section,setSection] = useState("all");
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(false);

  const [msg,setMsg] = useState("");
  const [msgType,setMsgType] = useState("success");

  const [open,setOpen] = useState(false);
  const [editMode,setEditMode] = useState(false);

  const [attendanceOpen,setAttendanceOpen] = useState(false);
  const [attendanceStudent,setAttendanceStudent] = useState(null);
  const [attendanceMonth,setAttendanceMonth] = useState("");
  const [attendanceYear,setAttendanceYear] = useState(new Date().getFullYear());
  const [attendanceRecords,setAttendanceRecords] = useState([]);

  const [form,setForm] = useState({
    oldSeat:"",
    seat:"",
    name:"",
    className:"",
    code:"",
    lang:"French",
    section:""
  });

  useEffect(()=>{
    loadClasses();
  },[]);

  function showMessage(text,type){
    setMsg(text);
    setMsgType(type || "success");
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

  async function loadClasses(){

    try{

      setLoading(true);

      const cls = await callAPI("getClasses");
      const list = Array.isArray(cls) ? cls : [];

      setClasses(list);

      if(list.length > 0){
        setSelectedClass(list[0]);
        await loadStudents(list[0],"all","all");
      }

      setLoading(false);

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("فشل تحميل الفصول","error");

    }

  }

  async function loadStudents(className, langValue, sectionValue){

    try{

      setLoading(true);

      const data =
        await callAPI("getStudents",{
          className:className || selectedClass,
          lang:langValue || lang,
          section:sectionValue || section
        });

      const cleanData =
        Array.isArray(data)
          ? data.filter((s)=>{

              const seat =
                String(s.seat || "").trim();

              const name =
                String(s.name || "").trim();

              return (
                seat !== "" &&
                name !== "" &&
                seat !== "رقم الجلوس" &&
                seat !== "Seat" &&
                name !== "اسم الطالبة" &&
                name !== "اسم الطالب" &&
                name !== "Name"
              );

            })
          : [];

      const arr =
        cleanData.map((s,index)=>({
          id:index,
          seat:String(s.seat || "").trim(),
          name:s.name || "",
          className:s.class || s.className || "",
          code:s.code || "",
          lang:s.lang || "",
          section:s.section || ""
        }));

      setStudents(arr);
      setLoading(false);
      showMessage("تم تحميل الطلاب","success");

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("فشل تحميل الطلاب","error");

    }

  }

  function applyFilter(){
    loadStudents(selectedClass,lang,section);
  }

  function openAdd(){

    setEditMode(false);

    setForm({
      oldSeat:"",
      seat:"",
      name:"",
      className:selectedClass || "",
      code:"",
      lang:"French",
      section:""
    });

    setOpen(true);

  }

  function openEdit(row){

    setEditMode(true);

    setForm({
      oldSeat:row.seat,
      seat:row.seat,
      name:row.name,
      className:row.className,
      code:row.code,
      lang:row.lang || "French",
      section:row.section || ""
    });

    setOpen(true);

  }

  async function saveStudent(){

    try{

      const action =
        editMode
          ? "updateStudent"
          : "addStudent";

      const res =
        await callAPI(action,form);

      if(res && res.success){

        showMessage(
          res.message || "تم الحفظ",
          "success"
        );

        setOpen(false);

        if(form.className && !classes.includes(form.className)){
          setClasses([
            ...classes,
            form.className
          ]);
        }

        loadStudents(
          selectedClass,
          lang,
          section
        );

      }else{

        showMessage(
          res.error || "فشل الحفظ",
          "error"
        );

      }

    }catch(error){

      console.log(error);
      showMessage("خطأ أثناء الحفظ","error");

    }

  }

  async function removeStudent(row){

    const ok =
      window.confirm(
        "هل تريد حذف الطالبة: " + row.name + " ؟"
      );

    if(!ok){
      return;
    }

    try{

      const res =
        await callAPI("deleteStudent",{
          seat:row.seat
        });

      if(res && res.success){

        showMessage(
          res.message || "تم الحذف",
          "success"
        );

        applyFilter();

      }else{

        showMessage(
          res.error || "فشل الحذف",
          "error"
        );

      }

    }catch(error){

      console.log(error);
      showMessage("خطأ أثناء الحذف","error");

    }

  }

  function openAttendance(row){

    setAttendanceStudent(row);
    setAttendanceMonth("");
    setAttendanceYear(new Date().getFullYear());
    setAttendanceRecords([]);
    setAttendanceOpen(true);

  }

  async function loadStudentMonthAttendance(){

  try{

    if(!attendanceStudent){

      showMessage(
        "اختر طالبة أولًا",
        "warning"
      );

      return;

    }

    if(!attendanceMonth){

      showMessage(
        "اختر الشهر",
        "warning"
      );

      return;

    }

    setLoading(true);

    const res =
      await callAPI(
        "getStudentMonthAttendanceEdit",
        {
          seat:String(
            attendanceStudent.seat || ""
          ).trim(),

          month:String(
            attendanceMonth || ""
          ).padStart(2,"0"),

          year:String(
            attendanceYear ||
            new Date().getFullYear()
          )
        }
      );

    console.log(
      "MONTH ATTENDANCE RESPONSE:",
      res
    );

    if(res && res.success){

      setAttendanceRecords(
        Array.isArray(res.records)
          ? res.records
          : []
      );

      showMessage(
        "تم تحميل غياب الطالبة",
        "success"
      );

    }else{

      setAttendanceRecords([]);

      showMessage(
        res && res.error
          ? res.error
          : "فشل تحميل غياب الطالبة",
        "error"
      );

    }

    setLoading(false);

  }catch(error){

    console.log(
      "LOAD MONTH ATTENDANCE ERROR:",
      error
    );

    setLoading(false);

    showMessage(
      error && error.message
        ? error.message
        : "خطأ في تحميل غياب الطالبة",
      "error"
    );

  }

}

  function changeAttendanceStatus(index,value){

    const arr = [...attendanceRecords];

    arr[index] = {
      ...arr[index],
      status:value
    };

    setAttendanceRecords(arr);

  }

  async function saveAttendanceRecords(){

    try{

      if(attendanceRecords.length === 0){
        showMessage("لا توجد بيانات للحفظ","warning");
        return;
      }

      setLoading(true);

      const res =
        await callAPI("updateStudentMonthAttendance",{
          records:attendanceRecords
        });

      if(res && res.success){

        showMessage("تم حفظ تعديلات الغياب","success");
        await loadStudentMonthAttendance();

      }else{

        showMessage(
          res && res.error
            ? res.error
            : "فشل حفظ التعديلات",
          "error"
        );

      }

      setLoading(false);

    }catch(error){

      console.log(error);
      setLoading(false);
      showMessage("خطأ أثناء حفظ التعديلات","error");

    }

  }

  const filteredStudents =
    students.filter((s)=>{
      return (
        String(s.name || "").toLowerCase().includes(search.toLowerCase()) ||
        String(s.seat || "").includes(search) ||
        String(s.code || "").includes(search)
      );
    });

  const columns = [

    {
      field:"seat",
      headerName:"رقم",
      width:80
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
      width:90
    },

    {
      field:"code",
      headerName:"الكود",
      width:100
    },

    {
      field:"lang",
      headerName:"اللغة",
      width:100
    },

    {
      field:"section",
      headerName:"التخصص",
      width:110
    },

    {
      field:"actions",
      headerName:"إجراءات",
      width:300,
      sortable:false,
      filterable:false,
      renderCell:(params)=>(
        <Box>
          <Button
            size="small"
            variant="contained"
            style={{
              marginLeft:"6px"
            }}
            onClick={()=>openEdit(params.row)}
          >
            تعديل
          </Button>

          <Button
            size="small"
            variant="contained"
            color="info"
            style={{
              marginLeft:"6px"
            }}
            onClick={()=>openAttendance(params.row)}
          >
            غياب الشهر
          </Button>

          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={()=>removeStudent(params.row)}
          >
            حذف
          </Button>
        </Box>
      )
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

    <Container maxWidth="xl" style={{marginTop:"20px"}}>

      <Typography
        variant="h4"
        gutterBottom
        style={{
          fontWeight:"bold",
          color:"#0f172a"
        }}
      >
        إدارة الطلاب
      </Typography>

      <Grid container spacing={2} style={{marginBottom:"20px"}}>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#e3f2fd"}}>
            <CardContent>
              <Typography fontWeight="bold">
                عدد الطلاب المعروضين
              </Typography>
              <Typography variant="h4">
                {filteredStudents.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#e8f5e9"}}>
            <CardContent>
              <Typography fontWeight="bold">
                الفصل الحالي
              </Typography>
              <Typography variant="h5">
                {selectedClass || "-"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card style={{borderRadius:"16px",background:"#fff3e0"}}>
            <CardContent>
              <Typography fontWeight="bold">
                حالة التحميل
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
            <LabelBox title="بحث">
              <TextField
                fullWidth
                placeholder="الاسم / رقم الجلوس / الكود"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
              />
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={2}>
            <LabelBox title="الفصل">
              <FormControl fullWidth>
                <Select
                  value={selectedClass}
                  onChange={(e)=>setSelectedClass(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">
                    اختر الفصل
                  </MenuItem>

                  {classes.map((c,index)=>(
                    <MenuItem key={index} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={2}>
            <LabelBox title="اللغة الثانية">
              <FormControl fullWidth>
                <Select
                  value={lang}
                  onChange={(e)=>setLang(e.target.value)}
                >
                  <MenuItem value="all">الكل</MenuItem>
                  <MenuItem value="French">French</MenuItem>
                  <MenuItem value="German">German</MenuItem>
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={2}>
            <LabelBox title="التخصص">
              <FormControl fullWidth>
                <Select
                  value={section}
                  onChange={(e)=>setSection(e.target.value)}
                >
                  <MenuItem value="all">الكل</MenuItem>
                  <MenuItem value="Math">Math</MenuItem>
                  <MenuItem value="Sciences">Sciences</MenuItem>
                </Select>
              </FormControl>
            </LabelBox>
          </Grid>

          <Grid item xs={12} md={1.5}>
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
              onClick={applyFilter}
              disabled={loading}
            >
              عرض
            </Button>
          </Grid>

          <Grid item xs={12} md={1.5}>
            <Typography
              variant="subtitle1"
              style={{
                fontWeight:"bold",
                marginBottom:"6px",
                color:"#1e293b"
              }}
            >
              إضافة
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
              onClick={openAdd}
            >
              إضافة
            </Button>
          </Grid>

        </Grid>

      </Paper>

      <Paper
        elevation={4}
        style={{
          width:"100%",
          overflowX:"hidden",
          borderRadius:"18px"
        }}
      >

        <div style={{height:"620px",width:"100%"}}>
          <DataGrid
            rows={filteredStudents}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10,20,50]}
            disableSelectionOnClick
          />
        </div>

      </Paper>

      <Dialog
        open={attendanceOpen}
        onClose={()=>setAttendanceOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          تعديل غياب الطالبة شهريًا
        </DialogTitle>

        <DialogContent>

          {attendanceStudent && (
            <Paper
              elevation={2}
              style={{
                padding:"14px",
                marginBottom:"16px",
                borderRadius:"14px",
                background:"#f8fafc"
              }}
            >
              <Typography fontWeight="bold">
                الطالبة: {attendanceStudent.name}
              </Typography>

              <Typography>
                رقم الجلوس: {attendanceStudent.seat} - الفصل: {attendanceStudent.className}
              </Typography>
            </Paper>
          )}

          <Grid container spacing={2} style={{marginBottom:"16px"}}>

            <Grid item xs={12} md={4}>
              <LabelBox title="الشهر">
                <FormControl fullWidth>
                  <Select
                    value={attendanceMonth}
                    onChange={(e)=>setAttendanceMonth(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      اختر الشهر
                    </MenuItem>

                    {months.map((m)=>(
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </LabelBox>
            </Grid>

            <Grid item xs={12} md={4}>
              <LabelBox title="السنة">
                <TextField
                  fullWidth
                  type="number"
                  value={attendanceYear}
                  onChange={(e)=>setAttendanceYear(e.target.value)}
                />
              </LabelBox>
            </Grid>

            <Grid item xs={12} md={4}>
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
                onClick={loadStudentMonthAttendance}
                disabled={loading}
              >
                عرض غياب الشهر
              </Button>
            </Grid>

          </Grid>

          {attendanceRecords.length === 0 ? (

            <Alert severity="info">
              اختر الشهر ثم اضغط عرض غياب الشهر
            </Alert>

          ) : (

            <Grid container spacing={2}>

              {attendanceRecords.map((rec,index)=>(

                <Grid item xs={12} md={4} key={index}>

                  <Paper
                    elevation={3}
                    style={{
                      padding:"14px",
                      borderRadius:"16px",
                      background:
                        rec.status === "غ"
                          ? "#ffebee"
                          : rec.status === "ح"
                            ? "#e8f5e9"
                            : rec.status === "م"
                              ? "#fff3e0"
                              : "#f8fafc"
                    }}
                  >

                    <Typography
                      fontWeight="bold"
                      style={{
                        marginBottom:"8px"
                      }}
                    >
                      {rec.date}
                    </Typography>

                    <Typography
                      variant="body2"
                      style={{
                        marginBottom:"10px"
                      }}
                    >
                      {rec.sessionName || "-"}
                    </Typography>

                    <FormControl fullWidth>
                      <Select
                        value={rec.status || ""}
                        onChange={(e)=>changeAttendanceStatus(index,e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">
                          فارغ
                        </MenuItem>

                        <MenuItem value="ح">
                          حاضر
                        </MenuItem>

                        <MenuItem value="غ">
                          غائب
                        </MenuItem>

                        <MenuItem value="م">
                          مرضي
                        </MenuItem>
                      </Select>
                    </FormControl>

                  </Paper>

                </Grid>

              ))}

            </Grid>

          )}

        </DialogContent>

        <DialogActions>
          <Button onClick={()=>setAttendanceOpen(false)}>
            إغلاق
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={saveAttendanceRecords}
            disabled={attendanceRecords.length === 0 || loading}
          >
            حفظ التعديلات
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={open}
        onClose={()=>setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMode
            ? "تعديل بيانات الطالبة / نقل فصل"
            : "إضافة طالبة جديدة"}
        </DialogTitle>

        <DialogContent>

          <Grid container spacing={2} style={{marginTop:"5px"}}>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="رقم الجلوس"
                value={form.seat}
                onChange={(e)=>setForm({
                  ...form,
                  seat:e.target.value
                })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="اسم الطالبة"
                value={form.name}
                onChange={(e)=>setForm({
                  ...form,
                  name:e.target.value
                })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Select
                  value={form.className}
                  onChange={(e)=>setForm({
                    ...form,
                    className:e.target.value
                  })}
                  displayEmpty
                >
                  <MenuItem value="">
                    اختر الفصل
                  </MenuItem>

                  {classes.map((c,index)=>(
                    <MenuItem key={index} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الكود"
                value={form.code}
                onChange={(e)=>setForm({
                  ...form,
                  code:e.target.value
                })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Select
                  value={form.lang}
                  onChange={(e)=>setForm({
                    ...form,
                    lang:e.target.value
                  })}
                >
                  <MenuItem value="French">French</MenuItem>
                  <MenuItem value="German">German</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Select
                  value={form.section}
                  onChange={(e)=>setForm({
                    ...form,
                    section:e.target.value
                  })}
                  displayEmpty
                >
                  <MenuItem value="">
                    بدون
                  </MenuItem>
                  <MenuItem value="Math">Math</MenuItem>
                  <MenuItem value="Sciences">Sciences</MenuItem>
                </Select>
              </FormControl>
            </Grid>

          </Grid>

        </DialogContent>

        <DialogActions>
          <Button onClick={()=>setOpen(false)}>
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={saveStudent}
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
          onClose={()=>setMsg("")}
          variant="filled"
          style={{
            fontSize:"18px",
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

export default Students;