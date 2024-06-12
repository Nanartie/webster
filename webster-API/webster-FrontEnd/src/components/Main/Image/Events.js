import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Paper, Box, CircularProgress, Avatar } from "@mui/material";
import { useInView } from "react-intersection-observer";
import { jwtDecode } from "jwt-decode";

function Events({ config, date }) {
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const jwtToken = localStorage.getItem("jwtToken");
  const [ref, inView] = useInView({
    triggerOnce: true,
  });
  const userId = jwtDecode(jwtToken).userId;

  useEffect(() => {
    setImages([]); // Сброс изображений при изменении даты
    setCurrentPage(1); // Сброс страницы при изменении даты
  }, [date]);

  useEffect(() => {
    if (inView) {
      loadMoreImages();
    }
    // eslint-disable-next-line
  }, [inView]);

  useEffect(() => {
    loadMoreImages();
    // eslint-disable-next-line
  }, [currentPage, date]);

  async function loadMoreImages() {
    setLoadingMore(true);
    
    let endpoint = `${config}?page=${currentPage}`;
    if (date) {
      endpoint += `&date=${date}`;
    }

    try {
      const response = await axios.get(endpoint);
      console.log('Response data:', response.data); // Логирование данных ответа
      const newImages = response.data.filter(newImage => !images.some(image => image.image_id === newImage.image_id));

      setImages((prevImages) => [...prevImages, ...newImages]);
    } catch (error) {
      console.error("Error loading more Events:", error);
    } finally {
      setLoadingMore(false);
    }    
  }

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    } else {
      let truncatedText = text.substring(0, maxLength);
      while (truncatedText.charAt(truncatedText.length - 1) === " ") {
        truncatedText = truncatedText.slice(0, -1);
      }
      return truncatedText + "...";
    }
  }

  function formatDate(dateString) {
    const options = {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric"
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  return (
    <Box>
      {images.map((image) => (
        <Paper
          elevation={3}
          style={{ padding: "15px", margin: "10px" }}
          key={image.image_id}
        >
          <NavLink
            to={`/image/${image.name}`}
            style={{
              display: "flex",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Box style={{ marginRight: "15px" }}>  
            <b>{formatDate(image.date)}</b>
                <Avatar
                  src={`http://localhost:3000/userImages/${userId}/${image.name}`}
                  alt="Image"
                  sx={{ width: 910, height: 500, borderRadius: 5, marginTop: 2 }}
                />
            </Box>
          </NavLink>
        </Paper>
      ))}
      {loadingMore && (
        <div
          style={{ display: "flex", justifyContent: "center", margin: "20px" }}
        >
          <CircularProgress />
        </div>
      )}
      <div style={{ height: "10px" }} ref={loadingMore ? null : ref} />
    </Box>
  );
}

export default Events;