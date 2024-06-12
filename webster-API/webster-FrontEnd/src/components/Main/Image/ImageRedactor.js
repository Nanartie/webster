import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Typography,
  Box,
  IconButton,
  Toolbar,
  AppBar,
  Paper,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  TextField,
  Slider,
} from "@mui/material";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { fabric } from "fabric";
import BrushIcon from "@mui/icons-material/Brush";
import MoveIcon from "@mui/icons-material/OpenWith";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import RectangleIcon from "@mui/icons-material/CropSquare";
import CircleIcon from "@mui/icons-material/RadioButtonUnchecked";
import TriangleIcon from "@mui/icons-material/ChangeHistory";
import HexagonIcon from "@mui/icons-material/Hexagon";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterIcon from "@mui/icons-material/Filter";
import CopyIcon from "@mui/icons-material/FileCopy";
import SaveIcon from "@mui/icons-material/Save";
import ImageIcon from "@mui/icons-material/Image";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import axios from "axios";
import GridOnIcon from "@mui/icons-material/GridOn";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { MuiColorInput } from "mui-color-input";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RedoIcon from "@mui/icons-material/Redo";
import UndoIcon from "@mui/icons-material/Undo";
import { v4 as uuidv4 } from "uuid";
import { useParams } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const jwtToken = localStorage.getItem("jwtToken");
const headers = {
  Authorization: `Bearer ${jwtToken}`,
};

const fonts = ["Arial", "Courier New", "Georgia", "Times New Roman", "Verdana"];
const colors = ["black", "red", "green", "blue", "yellow", "purple", "pink"];
const backgrounds = [
  { name: "White", color: "#ffffff" },
  { name: "Gray", color: "#FEF4F4" },
  { name: "Red", color: "#F65151" },
  { name: "Dark gray", color: "#2E2828" },
];
const imagesWithoutBackgrounds = [
  {
    name: "Girl",
    url: "http://localhost:3000/images_without_background/1.png",
  },
  {
    name: "Planet",
    url: "http://localhost:3000/images_without_background/2.png",
  },
  {
    name: "Bart",
    url: "http://localhost:3000/images_without_background/3.png",
  },
  {
    name: "Elephant",
    url: "http://localhost:3000/images_without_background/4.png",
  },
  {
    name: "Heart",
    url: "http://localhost:3000/images_without_background/5.png",
  },
];
const presets = [
  { name: "16:8 1200x640", width: 1200, height: 640 },
  { name: "4:3 1020x760", width: 1020, height: 760 },
  { name: "1:1 800x800", width: 800, height: 800 },
  { name: "Custom", width: null, height: null },
];

const ImageRedactor = () => {
  const [imageName, setImageName] = useState(uuidv4());
  const { imageNameParam } = useParams();
  const [exportFormat, setExportFormat] = useState("png");
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [brushColor, setBrushColor] = useState("black");
  const [shapeColor, setShapeColor] = useState("black");
  const [textColor, setTextColor] = useState("black");
  const [textFont, setTextFont] = useState("Arial");
  const [uploadedFonts, setUploadedFonts] = useState([]);
  const [gridVisible, setGridVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("16:8 1200x640");
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(640);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [reversed, setReversed] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [opacity, setOpacity] = useState(1)

  const [color, setColor] = useState("#000000");
  const [colorChanged, setColorChanged] = useState(false);

  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileFontInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [fontsLoaded, setFontsLoaded] = useState(false);

  const jwtToken = localStorage.getItem("jwtToken");
  const userId = jwtDecode(jwtToken).userId;
  
  useEffect(() => {
    const imageUrl = `http://localhost:3000/userImages/${userId}/${imageNameParam}`;
    setSelectedImage(imageUrl);
  }, [imageNameParam, userId]);

  useEffect(() => {
    if (!fontsLoaded) {
      axios.get('http://localhost:3000/api/fonts', { headers: headers })
        .then(response => {
          console.log(response);
          setUploadedFonts(response.data);
          setFontsLoaded(true);
        })
        .catch(error => {
          console.error('Failed to fetch fonts:', error);
        });
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
    });
    if (selectedImage) {
      fabric.Image.fromURL(selectedImage, (img) => {
        fabricCanvas.add(img);
        fabricCanvas.renderAll();
      }, { crossOrigin: 'anonymous' });
    }
    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, [selectedImage]);
  useEffect(() => {
    if (canvas) {
      canvas.freeDrawingBrush.color = brushColor;
    }
  }, [brushColor, canvas]);

  useEffect(() => {
    if (completedCrop && imageRef.current) {
      const canvas = document.createElement("canvas");
      const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
      const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        imageRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY
      );

      canvas.toBlob((blob) => {
        const fileUrl = URL.createObjectURL(blob);
        setSelectedImage(fileUrl);
      });
    }
  }, [completedCrop]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          const speed = 10;
          switch (event.key.toLowerCase()) {
            case "w":
              activeObject.top -= speed;
              break;
            case "s":
              activeObject.top += speed;
              break;
            case "a":
              activeObject.left -= speed;
              break;
            case "d":
              activeObject.left += speed;
              break;
            case "delete":
              deleteSelected();
              saveState(canvas);
              break;
            default:
              break;
          }
          canvas.renderAll();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvas]);

  useEffect(() => {
    console.log("я обновился!");
    console.log(redoStack);
  }, [redoStack]);

  useEffect(() => {
    setShapeColor(color);
    setBrushColor(color);
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        if (Array.isArray(activeObject._objects)) {
          activeObject._objects.forEach((obj) => {
            obj.set("stroke", color);
          });
        } else {
          activeObject.set("stroke", color);
        }
        canvas.renderAll();
      } else {
        if (canvas.isDrawingMode) {
          canvas.freeDrawingBrush.color = color;
          canvas.freeDrawingBrush.width = brushSize;
        }
      }
      saveState(canvas);
    }
  }, [color, colorChanged, brushSize]);

  const handleColorSelect = (value) => {
    setColor(value);
    setColorChanged(!colorChanged);
  };

  const handleImageUploadServer = () => {
    if (canvas) {
      const formData = new FormData();
      let imgDataUrl = canvas.toDataURL("image/png");

      const byteString = atob(imgDataUrl.split(",")[1]);
      const mimeString = imgDataUrl.split(",")[0].split(":")[1].split(";")[0];
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: mimeString });

      const uniqueFilename = `${imageName}.png`;

      formData.append("imageFile", blob, uniqueFilename);

      axios
        .post("http://localhost:3000/api/uploadImage", formData, {
          headers: {
            Authorization: headers.Authorization,
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          alert("Image successfully uploaded to the server.");
        })
        .catch((error) => {
          console.error("Ошибка при загрузке изображения:", error);
        });
    }
  };

  const saveState = (fabricCanvas) => {
    if (!reversed) {
      setRedoStack([]);
      const state = JSON.stringify(fabricCanvas);
      setHistory((prevHistory) => {
        const newHistory = [...prevHistory, state];
        if (newHistory.length > 20) {
          newHistory.shift();
        }
        return newHistory;
      });
    }
    setReversed(false);
  };

  const undo = () => {
    setHistory((prevHistory) => {
      if (prevHistory.length > 1) {
        const newRedoStack = [
          ...redoStack,
          prevHistory[prevHistory.length - 1],
        ];
        setRedoStack(newRedoStack, () => {
          console.log("я обновился, сучки!");
          console.log(redoStack); // Поместили в функцию обратного вызова
        });
        const newHistory = prevHistory.slice(0, -1);
        const state = newHistory[newHistory.length - 1];
        canvas.loadFromJSON(state, () => {
          canvas.renderAll();
        });
        setReversed(true);
        return newHistory;
      }
      return prevHistory;
    });
  };

  const redo = () => {
    console.log(redoStack);
    console.log(reversed);
    setRedoStack((prevRedoStack) => {
      console.log(prevRedoStack);
      if (prevRedoStack.length > 0) {
        const state = prevRedoStack[prevRedoStack.length - 1];
        const newRedoStack = prevRedoStack.slice(0, -1);
        setHistory((prevHistory) => {
          const newHistory = [...prevHistory, state];
          canvas.loadFromJSON(state, () => {
            canvas.renderAll();
          });
          return newHistory;
        });
        return newRedoStack;
      }
      return prevRedoStack;
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imgElement = new Image();
        imgElement.src = reader.result;
        imgElement.onload = () => {
          const imgInstance = new fabric.Image(imgElement, {
            scaleX:
              imgElement.width > canvas.width
                ? canvas.width / imgElement.width
                : 1,
            scaleY:
              imgElement.height > canvas.height
                ? canvas.height / imgElement.height
                : 1,
          });
          canvas.add(imgInstance);
          canvas.sendToBack(imgInstance);
          canvas.setActiveObject(imgInstance);
          setSelectedImage(reader.result);
          fileInputRef.current.value = null;
          saveState(canvas);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFont = async (file) => {
    const formData = new FormData();
    formData.append("fontFile", file);

    try {
      axios.post("http://localhost:3000/api/uploadFont", formData, {
        headers: headers,
      });
    } catch (error) {
      console.error("Failed to load the font:", error);
    }
  };

  const handleFontUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedExtensions = /(\.ttf|\.otf)$/i;
      const maxSize = 1 * 1024 * 1024; // 1 MB

      if (!allowedExtensions.exec(file.name)) {
        alert("Invalid file type. Please upload a .ttf or .otf font file.");
        if (fileFontInputRef.current) {
          fileFontInputRef.current.value = null;
        }
        return;
      }

      if (file.size > maxSize) {
        alert("File size exceeds 1 MB. Please upload a smaller font file.");
        if (fileFontInputRef.current) {
          fileFontInputRef.current.value = null;
        }
        return;
      }

      const fontName = file.name.split(".")[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const font = new FontFace(fontName, reader.result);
        font
          .load()
          .then((loadedFont) => {
            document.fonts.add(loadedFont);
            setUploadedFonts([...uploadedFonts, fontName]);
            alert("Font uploaded successfully.");
          })
          .catch(() => {
            alert("Failed to load the font.");
          });
      };
      console.log("HERE");
      uploadFont(file);
      reader.readAsArrayBuffer(file);
      setFontsLoaded(false);
    }
  };

  const handlePresetChange = (event) => {
    const preset = presets.find((p) => p.name === event.target.value);
    if (preset) {
      setSelectedPreset(preset.name);
      updateCanvasSize(preset.width, preset.height);
    }
  };

  const handleCustomSizeChange = (field, value) => {
    if (value >= 1) {
      if (field === "width") {
        setCanvasWidth(value);
        updateCanvasSize(value, canvasHeight);
      } else {
        setCanvasHeight(value);
        updateCanvasSize(canvasWidth, value);
      }
    }
  };

  const updateCanvasSize = (width, height) => {
    if (canvas) {
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.renderAll();
      drawGrid();
      saveState(canvas);
    }
  };

  // const handleBackgroundSelect = (color) => {
  //   if (canvas) {
  //     canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
  //   }
  // };

  const handleAddImageWithoutBackground = (url) => {
    if (canvas) {
      const imgElement = new Image();
      imgElement.crossOrigin = "Anonymous"; // cors
      imgElement.src = url;

      imgElement.onload = () => {
        const imgInstance = new fabric.Image(imgElement, {
          left: 100,
          top: 100,
          scaleX:
            imgElement.width > canvas.width
              ? canvas.width / imgElement.width
              : 1,
          scaleY:
            imgElement.height > canvas.height
              ? canvas.height / imgElement.height
              : 1,
        });

        if (imgElement.complete && imgElement.naturalHeight !== 0) {
          canvas.add(imgInstance);
          canvas.setActiveObject(imgInstance);
          saveState(canvas);
        } else {
          console.error(
            "Изображение не загружено или имеет некорректные размеры."
          );
        }
      };

      imgElement.onerror = (err) => {
        console.error("Ошибка загрузки изображения:", err);
      };
    }
  };

  const handleSave = () => {
    if (canvas) {
      let gridWasTrue = false;
      if (gridVisible == true) {
        setGridVisible(false);
        gridWasTrue = true;
      }

      setTimeout(() => {
        let dataUrl;
        if (exportFormat === "jpeg" || exportFormat === "webp") {
          dataUrl = canvas.toDataURL(`image/${exportFormat}`, 1.0);
        } else {
          dataUrl = canvas.toDataURL(`image/${exportFormat}`);
        }
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `edited-image.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (gridWasTrue == true) {
          setGridVisible(true);
        }
      }, 5);
    }
  };

  const handleToolSelect = (tool) => {
    if (canvas) {
      canvas.isDrawingMode = tool === "draw";
      canvas.selection = tool === "move";
      canvas.forEachObject((obj) => {
        obj.selectable = canvas.selection;
      });
      canvas.renderAll();
      saveState(canvas);
    }
  };

  const addText = () => {
    if (canvas) {
      const text = new fabric.IText("Edit me", {
        left: 100,
        top: 100,
        fill: textColor,
        fontFamily: textFont,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      saveState(canvas);
    }
  };

  const addRectangle = () => {
    if (canvas) {
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: shapeColor,
        width: 100,
        height: 100,
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      saveState(canvas);
    }
  };

  const addCircle = () => {
    if (canvas) {
      const circle = new fabric.Circle({
        left: 100,
        top: 100,
        fill: shapeColor,
        radius: 50,
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      saveState(canvas);
    }
  };

  const addTriangle = () => {
    if (canvas) {
      const triangle = new fabric.Triangle({
        left: 100,
        top: 100,
        fill: shapeColor,
        width: 100,
        height: 100,
      });
      canvas.add(triangle);
      canvas.setActiveObject(triangle);
      saveState(canvas);
    }
  };

  const addHexagon = () => {
    if (canvas) {
      const hexagon = new fabric.Polygon(
        [
          { x: 50, y: 0 },
          { x: 100, y: 25 },
          { x: 100, y: 75 },
          { x: 50, y: 100 },
          { x: 0, y: 75 },
          { x: 0, y: 25 },
        ],
        {
          left: 100,
          top: 100,
          fill: shapeColor,
        }
      );
      canvas.add(hexagon);
      canvas.setActiveObject(hexagon);
      saveState(canvas);
    }
  };

  const deleteSelected = () => {
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach((obj) => {
        canvas.remove(obj);
      });
      canvas.discardActiveObject();
      saveState(canvas);
    }
  };

  const copySelected = () => {
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        activeObject.clone((cloned) => {
          canvas.discardActiveObject();
          cloned.set({
            left: cloned.left + 10,
            top: cloned.top + 10,
          });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.renderAll();
          saveState(canvas);
        });
      }
    }
  };

  const applyFilter = (filter) => {
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "image") {
        activeObject.filters = [];
        if (filter === "grayscale") {
          activeObject.filters.push(new fabric.Image.filters.Grayscale());
        } else if (filter === "sepia") {
          activeObject.filters.push(new fabric.Image.filters.Sepia());
        } else if (filter === "invert") {
          activeObject.filters.push(new fabric.Image.filters.Invert());
        }
        activeObject.applyFilters();
        canvas.renderAll();
        saveState(canvas);
      }
    }
  };

  const handleReflection = (direction) => {
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        if (Array.isArray(activeObject._objects)) {
          activeObject._objects.forEach((obj) => {
            if (direction === "vertical") {
              obj.flipY = !obj.flipY;
            } else if (direction === "horizontal") {
              obj.flipX = !obj.flipX;
            }
          });
        } else {
          if (direction === "vertical") {
            activeObject.flipY = !activeObject.flipY;
          } else if (direction === "horizontal") {
            activeObject.flipX = !activeObject.flipX;
          }
        }
        canvas.renderAll();
        saveState(canvas);
      }
    }
  };

  const handleFill = () => {
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        if (Array.isArray(activeObject._objects)) {
          activeObject._objects.forEach((obj) => {
            obj.set("fill", color);
          });
        } else {
          activeObject.set("fill", color);
        }
        canvas.renderAll();
      } else {
        canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
      }
      saveState(canvas);
    }
  };

  const handleFontChange = async (font) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    const isDefaultFont = [
      "Arial",
      "Times New Roman",
      "Courier New",
      "Georgia",
    ].includes(font);

    if (isDefaultFont) {
      if (activeObject && activeObject.type === "i-text") {
        activeObject.set("fontFamily", font);
        canvas.renderAll();
        setTextFont(font);
      } else {
        setTextFont(font);
      }
    } else {
      try {
        const fontFile = font + ".otf";
        const fontUrl = `http://localhost:3000/uploads/fonts/${fontFile}`;
        const response = await fetch(fontUrl);
        if (!response.ok) {
          throw new Error("Failed to load font");
        }
        const fontData = await response.blob();
        const fontUrlObject = URL.createObjectURL(fontData);

        if (activeObject && activeObject.type === "i-text") {
          const fontFace = new FontFace(font, `url(${fontUrlObject})`);
          await fontFace.load();
          document.fonts.add(fontFace);

          activeObject.set("fontFamily", font);
          canvas.requestRenderAll();
          setTextFont(font);
        } else {
          setTextFont(fontFile);
        }
        saveState(canvas);
      } catch (error) {
        console.error("Failed to change font:", error);
      }
    }
  };

  const toggleGrid = () => {
    setGridVisible(!gridVisible);
    saveState(canvas);
  };

  const drawGrid = () => {
    if (canvas && gridVisible) {
      const gridSpacing = 20;
      const gridLines = [];

      for (let i = 0; i < canvas.width / gridSpacing; i++) {
        const lineX = new fabric.Line(
          [i * gridSpacing, 0, i * gridSpacing, canvas.height],
          {
            stroke: "#ccc",
            selectable: false,
            evented: false,
          }
        );
        const lineY = new fabric.Line(
          [0, i * gridSpacing, canvas.width, i * gridSpacing],
          {
            stroke: "#ccc",
            selectable: false,
            evented: false,
          }
        );
        gridLines.push(lineX, lineY);
      }
      canvas.add(...gridLines);
      canvas.sendToBack(...gridLines);
    } else {
      canvas &&
        canvas.getObjects("line").forEach((line) => canvas.remove(line));
    }
  };

  const moveForward = () => {
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.bringForward(activeObject);
      }
      saveState(canvas);
    }
  };

  const moveBack = () => {
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.sendBackwards(activeObject);
      }
      saveState(canvas);
    }
  };

  useEffect(() => {
    drawGrid();
  }, [gridVisible, canvas]);

  const changeObjectOpacity = (canvas, opacity) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.set('opacity', opacity);
      canvas.renderAll();
    }
  };
  const handleOpacityChange = (e, newValue) => {
    setOpacity(newValue);
    changeObjectOpacity(canvas, newValue);
  };

  return (
    <Paper
      sx={{
        width: "80%",
        marginLeft: "17%",
        padding: "30px",
        marginTop: "10px",
      }}
    >
      <AppBar position="static">
        <Box>
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px", width: "100%" }}>
              <Tooltip title="Toggle Grid">
                <IconButton color="inherit" onClick={toggleGrid}>
                  <GridOnIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Move">
                <IconButton
                  color="inherit"
                  onClick={() => handleToolSelect("move")}
                >
                  <MoveIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Move Forward">
                <IconButton color="inherit" onClick={moveForward}>
                  <KeyboardArrowUpIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Move Back">
                <IconButton color="inherit" onClick={moveBack}>
                  <KeyboardArrowDownIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Draw">
                <IconButton
                  color="inherit"
                  onClick={() => handleToolSelect("draw")}
                >
                  <BrushIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Brush size">
                <Slider
                  sx={{ maxWidth: "50px", marginTop: "10px", color: "white" }}
                  value={brushSize}
                  onChange={(e, newValue) => setBrushSize(newValue)}
                  aria-labelledby="brush-size-slider"
                  min={1}
                  max={100}
                />
              </Tooltip>
              <Tooltip title="Fill">
                <IconButton color="inherit" onClick={() => handleFill()}>
                  <FormatColorFillIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add Text">
                <IconButton color="inherit" onClick={addText}>
                  <TextFieldsIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                component="label"
                sx={{ marginBottom: 2, marginTop: "10px" }}
              >
                Upload Font
                <input
                  type="file"
                  hidden
                  accept=".ttf,.otf"
                  onChange={handleFontUpload}
                />
              </Button>
              <Tooltip title="Vertical Reflection">
                <IconButton
                  color="inherit"
                  onClick={() => handleReflection("vertical")}
                >
                  <SwapVertIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Horizontal Reflection">
                <IconButton
                  color="inherit"
                  onClick={() => handleReflection("horizontal")}
                >
                  <SwapHorizIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="undo">
                <IconButton color="inherit" onClick={() => undo()}>
                  <UndoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="redo">
                <IconButton color="inherit" onClick={() => redo()}>
                  <RedoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Object opacity">
                <Slider
                  sx={{ maxWidth: "50px", marginTop: "10px", color: "white" }}
                  value={opacity}
                  onChange={handleOpacityChange}
                  aria-labelledby="opacity-slider"
                  min={0}
                  max={1}
                  step={0.01}
                />
              </Tooltip>
              <Tooltip title="Add Rectangle">
                <IconButton color="inherit" onClick={addRectangle}>
                  <RectangleIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add Circle">
                <IconButton color="inherit" onClick={addCircle}>
                  <CircleIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add Triangle">
                <IconButton color="inherit" onClick={addTriangle}>
                  <TriangleIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add Hexagon">
                <IconButton color="inherit" onClick={addHexagon}>
                  <HexagonIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy">
                <IconButton color="inherit" onClick={copySelected}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton color="inherit" onClick={deleteSelected}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row", gap: "16px" }}>
              <Tooltip title="Grayscale">
                <IconButton
                  color="inherit"
                  onClick={() => applyFilter("grayscale")}
                >
                  <FilterIcon /> Grayscale
                </IconButton>
              </Tooltip>
              <Tooltip title="Sepia">
                <IconButton
                  color="inherit"
                  onClick={() => applyFilter("sepia")}
                >
                  <FilterIcon /> Sepia
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              <FormControl variant="outlined" margin="dense">
                <InputLabel>Preset</InputLabel>
                <Select
                  value={selectedPreset}
                  onChange={handlePresetChange}
                  label="Preset"
                >
                  {presets.map((preset) => (
                    <MenuItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedPreset === "Custom" && (
                <>
                  <TextField
                    label="Width"
                    type="number"
                    variant="outlined"
                    margin="dense"
                    value={canvasWidth}
                    onChange={(e) =>
                      handleCustomSizeChange("width", e.target.value)
                    }
                    style={{ marginRight: 8, maxWidth: "100px" }}
                  />
                  <TextField
                    label="Height"
                    type="number"
                    variant="outlined"
                    margin="dense"
                    value={canvasHeight}
                    onChange={(e) =>
                      handleCustomSizeChange("height", e.target.value)
                    }
                    style={{ marginRight: 8, maxWidth: "100px" }}
                  />
                </>
              )}
              <FormControl sx={{ m: 1, minWidth: 120 }}>
                <InputLabel>Font</InputLabel>
                <Select
                  value={textFont}
                  onChange={(e) => handleFontChange(e.target.value)}
                >
                  {fonts.concat(uploadedFonts).map((font) => (
                    <MenuItem key={font} value={font}>
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <MuiColorInput
                margin="dense"
                label="Color"
                size="medium"
                format="rgb"
                value={color}
                onChange={handleColorSelect}
              />
            </Box>
            <Tooltip title="Invert" sx={{ marginLeft: 'auto' }}>
              <IconButton
                color="inherit"
                onClick={() => applyFilter("invert")}
              >
              <FilterIcon />Invert</IconButton>
            </Tooltip>
          </Toolbar>
        </Box>
      </AppBar>
      <Box>
        {selectedImage && (
          <>
            <ReactCrop
              src={selectedImage}
              crop={crop}
              onImageLoaded={(img) => (imageRef.current = img)}
              onChange={(newCrop) => setCrop(newCrop)}
              onComplete={(c) => setCompletedCrop(c)}
            />
          </>
        )}
        <Box sx={{ display: "flex", marginTop: "20px" }}>
          <canvas
            ref={canvasRef}
            width={1200}
            height={650}
            style={{ border: "1px solid black" }}
          ></canvas>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleImageUploadServer()}
        >
          <CloudUploadIcon /> Save
        </Button>
        <FormControl sx={{ m: 1, minWidth: 140 }}>
          <InputLabel>Select Image</InputLabel>
          <Select
            onChange={(e) => handleAddImageWithoutBackground(e.target.value)}
          >
            {imagesWithoutBackgrounds.map((img, index) => (
              <MenuItem key={index} value={img.url}>
                {img.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" component="label" sx={{ margin: 2 }}>
          Upload Image
          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
        </Button>
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <InputLabel>Export Format</InputLabel>
          <Select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <MenuItem value="png">PNG</MenuItem>
            <MenuItem value="jpeg">JPEG</MenuItem>
            <MenuItem value="webp">WEBP</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSave()}
        >
          <SaveIcon /> Download image
        </Button>
      </Box>
    </Paper>
  );
};

export default ImageRedactor;
