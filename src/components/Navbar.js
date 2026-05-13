import React from "react";

import {
  AppBar,
  Toolbar,
  Typography,
  Button
} from "@mui/material";

import {
  Link
} from "react-router-dom";

function Navbar(){

  return(

    <AppBar position="static">

      <Toolbar>

        <Typography
          variant="h6"
          style={{
            flexGrow:1
          }}
        >
          نظام إدارة الغياب
        </Typography>

        <Button
          color="inherit"
          component={Link}
          to="/"
        >
          Dashboard
        </Button>

        <Button
          color="inherit"
          component={Link}
          to="/attendance"
        >
          الغياب
        </Button>

        <Button
          color="inherit"
          component={Link}
          to="/reports"
        >
          التقارير
        </Button>

        <Button
          color="inherit"
          component={Link}
          to="/students"
        >
          الطلاب
        </Button>

      </Toolbar>

    </AppBar>

  );

}

export default Navbar;