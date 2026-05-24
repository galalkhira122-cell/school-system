import React,{ useEffect, useState } from "react";

import {
  HashRouter,
  Routes,
  Route,
  Link,
  useLocation
} from "react-router-dom";

import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  Button,
  Divider,
  Paper
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SearchIcon from "@mui/icons-material/Search";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import LogoutIcon from "@mui/icons-material/Logout";
import BackupIcon from "@mui/icons-material/Backup";
import SettingsIcon from "@mui/icons-material/Settings";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import HistoryIcon from "@mui/icons-material/History";

import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Reports from "./pages/Reports";
import AbsenceSearch from "./pages/AbsenceSearch";
import Users from "./pages/Users";
import Backup from "./pages/Backup";
import Settings from "./pages/Settings";
import Monitor from "./pages/Monitor";
import Login from "./pages/Login";
import AuditLog from "./pages/AuditLog";

import { callAPI } from "./api";

const drawerWidth = 250;

function Layout({ user, logout, settings }){

  const location = useLocation();

  function canAccess(page){

    if(!user){
      return false;
    }

    if(user.role === "Admin"){
      return true;
    }

    if(user.role === "Teacher"){
      return page === "attendance";
    }

    if(user.role === "Supervisor"){
      return [
        "dashboard",
        "reports",
        "absence-search",
        "monitor"
      ].includes(page);
    }

    return false;

  }

  const schoolName =
    settings && settings.schoolName
      ? settings.schoolName
      : "نظام إدارة المدرسة";

  const menuItems = [
    {
      key:"dashboard",
      title:"لوحة التحكم",
      path:"/",
      icon:<DashboardIcon />
    },
    {
      key:"attendance",
      title:"تسجيل الغياب",
      path:"/attendance",
      icon:<FactCheckIcon />
    },
    {
      key:"students",
      title:"الطلاب",
      path:"/students",
      icon:<SchoolIcon />
    },
    {
      key:"teachers",
      title:"المعلمين",
      path:"/teachers",
      icon:<PeopleIcon />
    },
    {
      key:"absence-search",
      title:"حصر الغياب",
      path:"/absence-search",
      icon:<SearchIcon />
    },
    {
      key:"reports",
      title:"التقارير",
      path:"/reports",
      icon:<AssessmentIcon />
    },
    {
      key:"monitor",
      title:"متابعة التسجيل",
      path:"/monitor",
      icon:<MonitorHeartIcon />
    },
    {
      key:"users",
      title:"المستخدمين",
      path:"/users",
      icon:<ManageAccountsIcon />
    },
    {
      key:"backup",
      title:"النسخ الاحتياطي",
      path:"/backup",
      icon:<BackupIcon />
    },
    {
      key:"audit-log",
      title:"سجل التعديلات",
      path:"/audit-log",
      icon:<HistoryIcon />
    },
    {
      key:"settings",
      title:"الإعدادات",
      path:"/settings",
      icon:<SettingsIcon />
    }
  ];

  function isActive(path){

    if(path === "/"){
      return location.pathname === "/";
    }

    return location.pathname === path;

  }

  return(

    <Box sx={{display:"flex",direction:"rtl"}}>

      <AppBar
        position="fixed"
        sx={{
          zIndex:1201,
          background:"linear-gradient(90deg,#0f172a,#1e293b)"
        }}
      >
        <Toolbar>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight:"bold",
              flexGrow:1
            }}
          >
            {schoolName}
          </Typography>

          <Typography
            sx={{
              marginLeft:"20px",
              fontWeight:"bold"
            }}
          >
            {user.username} - {user.role}
          </Typography>

          <Button
            color="inherit"
            onClick={logout}
            startIcon={<LogoutIcon />}
          >
            خروج
          </Button>

        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width:drawerWidth,
          flexShrink:0,
          [`& .MuiDrawer-paper`]:{
            width:drawerWidth,
            boxSizing:"border-box",
            background:"#0f172a",
            color:"#fff",
            borderLeft:"none"
          }
        }}
      >
        <Toolbar />

        <Box sx={{padding:"16px",textAlign:"center"}}>

          <Box
            sx={{
              background:"#1e293b",
              borderRadius:"16px",
              padding:"18px",
              boxShadow:"0 8px 20px rgba(0,0,0,0.25)"
            }}
          >
            <Typography variant="h6" sx={{fontWeight:"bold"}}>
              مرحبًا
            </Typography>

            <Typography sx={{color:"#cbd5e1"}}>
              {user.username}
            </Typography>

            <Typography
              sx={{
                marginTop:"6px",
                background:"#2563eb",
                display:"inline-block",
                padding:"4px 12px",
                borderRadius:"20px",
                fontSize:"13px"
              }}
            >
              {user.role}
            </Typography>
          </Box>

        </Box>

        <Divider sx={{borderColor:"#334155"}} />

        <Box sx={{overflow:"auto",paddingTop:"10px"}}>
          <List>
            {menuItems
              .filter(item=>canAccess(item.key))
              .map((item)=>(

                <ListItem
                  disablePadding
                  key={item.key}
                  sx={{
                    paddingX:"10px",
                    marginBottom:"6px"
                  }}
                >
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    sx={{
                      color:"#fff",
                      borderRadius:"12px",
                      background:isActive(item.path)
                        ? "#2563eb"
                        : "transparent",
                      "&:hover":{
                        background:isActive(item.path)
                          ? "#2563eb"
                          : "#1e293b"
                      }
                    }}
                  >
                    <Box
                      sx={{
                        marginLeft:"10px",
                        display:"flex",
                        alignItems:"center"
                      }}
                    >
                      {item.icon}
                    </Box>

                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontWeight:isActive(item.path)
                          ? "bold"
                          : "normal"
                      }}
                    />
                  </ListItemButton>
                </ListItem>

              ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow:1,
          p:3,
          width:`calc(100% - ${drawerWidth}px)`,
          background:"#f1f5f9",
          minHeight:"100vh",
          overflowX:"hidden"
        }}
      >
        <Toolbar />

        <Routes>

          <Route
            path="/"
            element={
              String(user?.role || "").trim().toLowerCase() === "teacher"
                ? <Attendance user={user} />
                : <Dashboard />
            }
          />

          <Route
            path="/attendance"
            element={
              canAccess("attendance")
                ? <Attendance user={user} />
                : <Dashboard />
            }
          />

          <Route
            path="/students"
            element={
              canAccess("students")
                ? <Students />
                : <Dashboard />
            }
          />

          <Route
            path="/teachers"
            element={
              canAccess("teachers")
                ? <Teachers />
                : <Dashboard />
            }
          />

          <Route
            path="/absence-search"
            element={
              canAccess("absence-search")
                ? <AbsenceSearch />
                : <Dashboard />
            }
          />

          <Route
            path="/reports"
            element={
              canAccess("reports")
                ? <Reports />
                : <Dashboard />
            }
          />

          <Route
            path="/monitor"
            element={
              canAccess("monitor")
                ? <Monitor />
                : <Dashboard />
            }
          />

          <Route
            path="/users"
            element={
              canAccess("users")
                ? <Users />
                : <Dashboard />
            }
          />

          <Route
            path="/backup"
            element={
              canAccess("backup")
                ? <Backup />
                : <Dashboard />
            }
          />

          <Route
            path="/settings"
            element={
              canAccess("settings")
                ? <Settings />
                : <Dashboard />
            }
          />

          <Route
            path="/audit-log"
            element={
              canAccess("audit-log")
                ? <AuditLog />
                : <Dashboard />
            }
          />

        </Routes>
      </Box>

    </Box>

  );

}

function App(){

  const [user,setUser] = useState(null);
  const [settings,setSettings] = useState({});

  const [siteStatus,setSiteStatus] = useState({
    isClosed:false,
    message:"الموقع مغلق الآن للصيانة",
    isWeekend:false,
    todayName:"",
    weekends:[]
  });

  useEffect(()=>{

    const saved =
      localStorage.getItem("schoolUser");

    if(saved){
      setUser(JSON.parse(saved));
    }

    loadSettings();
    loadSiteStatus();

  },[]);

  async function loadSettings(){

    try{

      const data =
        await callAPI("getSettings");

      setSettings(data || {});

    }catch(error){

      console.log(error);

    }

  }

  async function loadSiteStatus(){

    try{

      const res =
        await callAPI("getSiteStatus");

      if(res && res.success){
        setSiteStatus({
          isClosed:res.isClosed || false,
          message:res.message || "الموقع مغلق الآن للصيانة",
          isWeekend:res.isWeekend || false,
          todayName:res.todayName || "",
          weekends:res.weekends || []
        });
      }

    }catch(error){

      console.log(error);

    }

  }

  function logout(){

    localStorage.removeItem("schoolUser");
    setUser(null);

  }

  if(!user){
    return <Login onLogin={setUser} />;
  }

  if(
    siteStatus.isWeekend &&
    user &&
    user.role !== "Admin"
  ){

    return(

      <Box
        sx={{
          minHeight:"100vh",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          background:"linear-gradient(135deg,#0f172a,#1e293b)",
          color:"#fff",
          textAlign:"center",
          p:3,
          direction:"rtl"
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p:5,
            borderRadius:"24px",
            maxWidth:"650px"
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            color="#dc2626"
          >
            عطلة رسمية
          </Typography>

          <Typography
            variant="h6"
            color="#334155"
            sx={{mb:3}}
          >
            الموقع متوقف اليوم بسبب العطلة الأسبوعية
          </Typography>

          <Typography
            variant="h6"
            sx={{mb:3}}
          >
            اليوم: {siteStatus.todayName}
          </Typography>

          <Button
            variant="contained"
            color="error"
            onClick={logout}
          >
            خروج
          </Button>
        </Paper>
      </Box>

    );

  }

  if(
    siteStatus.isClosed &&
    user &&
    user.role !== "Admin"
  ){
    return(

      <Box
        sx={{
          minHeight:"100vh",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          background:"linear-gradient(135deg,#0f172a,#1e293b)",
          color:"#fff",
          textAlign:"center",
          p:3,
          direction:"rtl"
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p:5,
            borderRadius:"24px",
            maxWidth:"650px"
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            color="#0f172a"
          >
            الموقع مغلق الآن
          </Typography>

          <Typography
            variant="h6"
            color="#334155"
            sx={{mb:3}}
          >
            {siteStatus.message}
          </Typography>

          <Button
            variant="contained"
            color="error"
            onClick={logout}
          >
            خروج
          </Button>
        </Paper>
      </Box>

    );
  }

  return(

    <HashRouter>
      <Layout
        user={user}
        logout={logout}
        settings={settings}
      />
    </HashRouter>

  );

}

export default App;