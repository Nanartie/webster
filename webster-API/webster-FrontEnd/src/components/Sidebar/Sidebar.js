import React from "react";
import { StyledNavLink } from "./Sidebar.styles";
import { jwtDecode } from "jwt-decode";
import {
  Paper,
  ListItem,
  List
} from "@mui/material";

function Sidebar() {
  const jwtToken = localStorage.getItem("jwtToken");

  return (
    <Paper
      elevation={3}
      style={{ width: "14%", padding: 20, height: "100%", position: "fixed" }}
    >
      <List>
        <ListItem>
        <StyledNavLink to="/saved">Saved works</StyledNavLink>
        </ListItem>
        <ListItem>
          <StyledNavLink to="/image">Image</StyledNavLink>
        </ListItem>
      </List>
    </Paper>
  );
}

export default Sidebar;
