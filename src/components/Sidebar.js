import React from "react";

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  Button
} from "@mui/material";

import {
  Link
} from "react-router-dom";

const drawerWidth = 240;

function Sidebar(props){

  return(

    <Drawer
      variant="permanent"
      sx={{

        width:drawerWidth,

        flexShrink:0,

        "& .MuiDrawer-paper":{

          width:drawerWidth,

          boxSizing:"border-box",

          background:"#1976d2",

          color:"#fff"

        }

      }}
    >

      <Toolbar>

        <Typography
          variant="h6"
        >
          نظام المدرسة
        </Typography>

      </Toolbar>

      <List>

        <ListItem disablePadding>

          <ListItemButton
            component={Link}
            to="/"
          >

            <ListItemText
              primary="Dashboard"
            />

          </ListItemButton>

        </ListItem>

        <ListItem disablePadding>

          <ListItemButton
            component={Link}
            to="/attendance"
          >

            <ListItemText
              primary="الغياب"
            />

          </ListItemButton>

        </ListItem>

        <ListItem disablePadding>

          <ListItemButton
            component={Link}
            to="/students"
          >

            <ListItemText
              primary="الطلاب"
            />

          </ListItemButton>

        </ListItem>

        <ListItem disablePadding>

          <ListItemButton
            component={Link}
            to="/teachers"
          >

            <ListItemText
              primary="المعلمين"
            />

          </ListItemButton>

        </ListItem>

        <ListItem disablePadding>

          <ListItemButton
            component={Link}
            to="/reports"
          >

            <ListItemText
              primary="التقارير"
            />

          </ListItemButton>

        </ListItem>

      </List>

      <div
        style={{
          padding:"20px"
        }}
      >

        <Button
          fullWidth
          variant="contained"
          color="error"
          onClick={
            props.logout
          }
        >
          تسجيل خروج
        </Button>

      </div>

    </Drawer>

  );

}

export default Sidebar;