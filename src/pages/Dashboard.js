import React,{ useEffect, useState } from "react";

import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Box
} from "@mui/material";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import { callAPI } from "../api";

function Dashboard(){

  const [data,setData] = useState({
    totalAbsence:0,
    topClass:"-",
    topCount:0,
    minClass:"-",
    minCount:0,
    allClasses:[],
    registeredClasses:[],
    notRegistered:[],
    summary:[],
    chartData:[],
    activeSession:null
  });

  const [nowText,setNowText] = useState("");

  useEffect(()=>{

    load();
    updateClock();

    const timer =
      setInterval(()=>{
        load();
        updateClock();
      },10000);

    return ()=>clearInterval(timer);

  },[]);

  function updateClock(){

    const now = new Date();

    const date =
      now.toLocaleDateString("ar-EG",{
        weekday:"long",
        year:"numeric",
        month:"long",
        day:"numeric"
      });

    const time =
      now.toLocaleTimeString("en-US",{
        hour:"2-digit",
        minute:"2-digit",
        second:"2-digit",
        hour12:true
      });

    setNowText(date + " - " + time);

  }

  async function load(){

    try{

      const res =
        await callAPI("getDashboardLiveData");

      if(res && res.success){

        const summary =
          Array.isArray(res.summary)
            ? res.summary
            : [];

        const chartData =
          Array.isArray(res.chartData)
            ? res.chartData
            : [];

        const allClasses =
          Array.isArray(res.allClasses)
            ? res.allClasses
            : [];

        const registeredClasses =
          Array.isArray(res.registeredClasses) &&
          res.registeredClasses.length > 0
            ? res.registeredClasses
            : summary.map(item=>item.className);

        const notRegistered =
          Array.isArray(res.notRegistered)
            ? res.notRegistered
            : allClasses.filter(
                cls=>!registeredClasses.includes(cls)
              );

        setData({
          totalAbsence:res.totalAbsence || 0,
          topClass:res.topClass || "-",
          topCount:res.topCount || 0,
          minClass:res.minClass || "-",
          minCount:res.minCount || 0,
          allClasses:allClasses,
          registeredClasses:registeredClasses,
          notRegistered:notRegistered,
          summary:summary,
          chartData:chartData,
          activeSession:res.activeSession || null
        });

      }

    }catch(error){
      console.log(error);
    }

  }

  const pieData = [
    {
      name:"فصول سجلت",
      value:data.registeredClasses.length
    },
    {
      name:"فصول لم تسجل",
      value:data.notRegistered.length
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
        لوحة التحكم
      </Typography>

      <Paper
        elevation={4}
        style={{
          padding:"0",
          marginBottom:"20px",
          borderRadius:"18px",
          overflow:"hidden",
          background:"#0f172a",
          color:"#fff"
        }}
      >

        <Grid container>

          <Grid
            item
            xs={12}
            md={2}
            style={{
              background:"#dc2626",
              padding:"15px 20px",
              fontWeight:"bold",
              display:"flex",
              alignItems:"center"
            }}
          >
            أخبار الغياب
          </Grid>

          <Grid
            item
            xs={12}
            md={10}
            style={{
              overflow:"hidden",
              height:"58px",
              display:"flex",
              alignItems:"center",
              background:"#111827",
              direction:"rtl"
            }}
          >
            <div
              style={{
                display:"inline-flex",
                gap:"12px",
                alignItems:"center",
                whiteSpace:"nowrap",
                animation:"dashboardAbsenceScroll 22s linear infinite"
              }}
            >

              {data.summary.length === 0 ? (

                <span
                  style={{
                    background:"#16a34a",
                    padding:"8px 18px",
                    borderRadius:"20px",
                    fontWeight:"bold"
                  }}
                >
                  لا يوجد غياب مسجل اليوم
                </span>

              ) : (

                data.summary.map((item,index)=>(

                  <span
                    key={index}
                    style={{
                      background:[
                        "#dc2626",
                        "#ea580c",
                        "#7c3aed",
                        "#2563eb",
                        "#0891b2",
                        "#be123c"
                      ][index % 6],
                      padding:"8px 18px",
                      borderRadius:"20px",
                      fontWeight:"bold"
                    }}
                  >
                    {item.className} ({item.count})
                  </span>

                ))

              )}

            </div>
          </Grid>

        </Grid>

        <style>
          {`
            @keyframes dashboardAbsenceScroll {
              0% {
                transform: translateX(100%);
              }

              100% {
                transform: translateX(-180%);
              }
            }
          `}
        </style>

      </Paper>

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
          {nowText}
        </Typography>
      </Paper>

      <Grid container spacing={2} style={{marginBottom:"20px"}}>

        <Grid item xs={12} md={3}>
          <Card style={{borderRadius:"18px",background:"#ffebee"}}>
            <CardContent>
              <Typography fontWeight="bold">
                إجمالي غياب اليوم
              </Typography>
              <Typography variant="h4">
                {data.totalAbsence}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card style={{borderRadius:"18px",background:"#fff3e0"}}>
            <CardContent>
              <Typography fontWeight="bold">
                أكثر فصل غيابًا
              </Typography>
              <Typography variant="h5">
                {data.topClass} ({data.topCount})
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card style={{borderRadius:"18px",background:"#e8f5e9"}}>
            <CardContent>
              <Typography fontWeight="bold">
                أقل فصل غيابًا
              </Typography>
              <Typography variant="h5">
                {data.minClass} ({data.minCount})
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card style={{borderRadius:"18px",background:"#e3f2fd"}}>
            <CardContent>
              <Typography fontWeight="bold">
                Session النشطة
              </Typography>
              <Typography variant="h5">
                {data.activeSession
                  ? data.activeSession.name
                  : "-"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Grid container spacing={2} style={{marginBottom:"20px"}}>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={4}
            style={{
              padding:"20px",
              borderRadius:"18px"
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              style={{fontWeight:"bold"}}
            >
              الفصول التي سجلت الغياب اليوم
            </Typography>

            <Box style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
              {data.registeredClasses.length === 0 ? (
                <span
                  style={{
                    background:"#dc2626",
                    color:"#fff",
                    padding:"8px 16px",
                    borderRadius:"20px",
                    fontWeight:"bold"
                  }}
                >
                  لا يوجد فصول سجلت
                </span>
              ) : (
                data.registeredClasses.map((cls,index)=>(
                  <span
                    key={index}
                    style={{
                      background:"#16a34a",
                      color:"#fff",
                      padding:"8px 16px",
                      borderRadius:"20px",
                      fontWeight:"bold"
                    }}
                  >
                    {cls}
                  </span>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={4}
            style={{
              padding:"20px",
              borderRadius:"18px"
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              style={{fontWeight:"bold"}}
            >
              الفصول التي لم تسجل الغياب اليوم
            </Typography>

            <Box style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
              {data.notRegistered.length === 0 ? (
                <span
                  style={{
                    background:"#16a34a",
                    color:"#fff",
                    padding:"8px 16px",
                    borderRadius:"20px",
                    fontWeight:"bold"
                  }}
                >
                  كل الفصول سجلت
                </span>
              ) : (
                data.notRegistered.map((cls,index)=>(
                  <span
                    key={index}
                    style={{
                      background:"#64748b",
                      color:"#fff",
                      padding:"8px 16px",
                      borderRadius:"20px",
                      fontWeight:"bold"
                    }}
                  >
                    {cls}
                  </span>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

      </Grid>

      <Grid container spacing={2} style={{marginBottom:"20px"}}>

        <Grid item xs={12} md={8}>
          <Paper
            elevation={4}
            style={{
              padding:"20px",
              borderRadius:"18px",
              height:"360px"
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              style={{fontWeight:"bold"}}
            >
              غياب اليوم حسب الفصول
            </Typography>

            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={data.chartData}>
                <XAxis dataKey="className" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="absence" name="عدد الغياب" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={4}
            style={{
              padding:"20px",
              borderRadius:"18px",
              height:"360px"
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              style={{fontWeight:"bold"}}
            >
              حالة تسجيل الغياب
            </Typography>

            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  <Cell />
                  <Cell />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        <Grid container spacing={2}>

  {registeredClasses.map((c,index)=>(

    <Grid item xs={12} md={3} key={index}>

      <Paper
        elevation={4}
        style={{
          padding:"14px",
          borderRadius:"16px",
          background:"linear-gradient(135deg,#16a34a,#15803d)",
          color:"#fff",
          textAlign:"center"
        }}
      >

        <Typography
          variant="h6"
          style={{
            fontWeight:"bold"
          }}
        >
          {c}
        </Typography>

        <Typography>
          تم تسجيل الغياب
        </Typography>

      </Paper>

    </Grid>

  ))}

  {notRegisteredClasses.map((c,index)=>(

    <Grid item xs={12} md={3} key={index}>

      <Paper
        elevation={4}
        style={{
          padding:"14px",
          borderRadius:"16px",
          background:"linear-gradient(135deg,#dc2626,#991b1b)",
          color:"#fff",
          textAlign:"center"
        }}
      >

        <Typography
          variant="h6"
          style={{
            fontWeight:"bold"
          }}
        >
          {c}
        </Typography>

        <Typography>
          لم يسجل الغياب
        </Typography>

      </Paper>

    </Grid>

  ))}

</Grid>

    </Container>

  );

}

export default Dashboard;