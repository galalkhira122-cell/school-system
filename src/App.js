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
      key:"settings",
      title:"الإعدادات",
      path:"/settings",
      icon:<SettingsIcon />
    }