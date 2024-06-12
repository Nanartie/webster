import React, { useState, useEffect } from "react";
import Events from "./Events";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
} from "@mui/material";

function AllEvents() {
  const config = "http://localhost:3000/api/images";
  const [date, setDate] = useState("");
  const [tempDate, setTempDate] = useState("");
  
  const handleDateChange = (event) => {
    setTempDate(event.target.value);
  };
  
  const applyFilters = () => {
    setDate(tempDate);
  };

  return (
    <Container style={{ marginTop: "2rem", paddingBottom: "130px" }}>
      <Grid
        sx={{ width: "1525px" }}
        container
        spacing={2}
      >
        <Grid item xs={8}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Box>
              <Typography variant="h5" gutterBottom sx={{ marginBottom: 2 }}>
                Saved Images:
              </Typography>
              <Events
                config={config}
                date={date}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper
            elevation={3}
            sx={{ width: "400px", textAlign: "center", padding: "20px" }}
          >
            <Box style={{ marginBottom: "20px" }}>
              <TextField
                label="Date"
                type="date"
                variant="outlined"
                fullWidth
                margin="normal"
                value={tempDate}
                onChange={handleDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Button
                sx={{ marginTop: "10px", marginBottom: "-20px" }}
                variant="contained"
                color="primary"
                onClick={applyFilters}
              >
                Search
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AllEvents;