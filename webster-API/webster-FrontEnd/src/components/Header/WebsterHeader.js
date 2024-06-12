import axios from "axios";
import { React, useState, useEffect, useRef } from "react";
import { ListItem, Avatar, Tooltip, Box } from "@mui/material";
import {
  Header,
  Logo,
  HeaderList,
  HeaderContainer,
  StyledNavLink,
} from "./WebsterHeader.styles";
import { jwtDecode } from "jwt-decode";

function WebsterHeader() {
  const jwtToken = localStorage.getItem("jwtToken");
  const [userData, setUserData] = useState([]);
  const currentUserId = jwtToken != null ? jwtDecode(jwtToken).userId : 0;

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/users/${currentUserId}`
        );
        const data = response.data;
        console.log(data);
        setUserData(data);
      } catch (error) {
        console.error("Ошибка при получении данных пользователя:", error);
      }
    }
    if (currentUserId !== 0) {
      fetchUserData();
    }
  }, [currentUserId]);

  return (
    <Header>
      <HeaderContainer>
        <Logo to={`/profile/${currentUserId}`}>
          <img src={process.env.PUBLIC_URL + "/webster.png"} alt="logo" />
          <h1>AnyPic</h1>
        </Logo>
        <HeaderList>
          <ListItem>
            {currentUserId !== 0 ? (
              <Tooltip title="Show profile" placement="bottom">
                <StyledNavLink
                  sx={{ display: "flex", paddingRight: "20px", width: "190px" }}
                  to={`/profile/${currentUserId}`}
                >
                  <Avatar
                    src={`http://localhost:3000/${userData.avatar}`}
                    sx={{ width: 65, height: 65, marginRight: "5px", marginBottom: "15px" }}
                  />
                  <Box sx={{ mt: 2 }}>{userData.login}</Box>
                </StyledNavLink>
              </Tooltip>
            ) : (
              <StyledNavLink to="/">Authorization</StyledNavLink>
            )}
          </ListItem>
        </HeaderList>
      </HeaderContainer>
    </Header>
  );  
}

export default WebsterHeader;