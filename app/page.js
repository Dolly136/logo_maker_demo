"use client";

import ColorPickerListSvg from "@/Componment/ColorPickerListSvg";
import Sidebar from "@/Componment/Sidebar";
import Topbar from "@/Componment/Topbar";
import { filterStyles } from "@/utils/filterStyles";
import { loadGoogleFont } from "@/utils/loadFont";
import {
  extractColors,
  fetchSvgText,
  replaceColorsWithGradients,
  svgToImage,
} from "@/utils/servicesFunction";
import { useEffect, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import {
  Image as KonvaImage,
  Text as KonvaText,
  Layer,
  Rect,
  Stage,
  Transformer,
} from "react-konva";

export default function ImageEditor() {
  const fileInputRef = useRef(null);
  const stageRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [originalImageObj, setOriginalImageObj] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [selected, setSelected] = useState(false);
  const [showCropRect, setShowCropRect] = useState(false);
  const [lastCropData, setLastCropData] = useState(null);
  const trRef = useRef(null);
  const [texts, setTexts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [value, setValue] = useState("");
  const [textAreaStyle, setTextAreaStyle] = useState({});
  const textRefs = useRef({});
  const stageWidth = 750;
  const stageHeight = 750;
  const [prompt, setPrompt] = useState("");
  const [isBgRemoved, setIsBgRemoved] = useState(false);
  const [replaceBgOpen, setReplaceBgOpen] = useState(false);
  const [openColorFilter, setOpenColorFilter] = useState(false);
  const [bgRemovedBlob, setBgRemovedBlob] = useState(null);
  const [selectedBg, setSelectedBg] = useState(null);
  const [cropAspectRatio, setCropAspectRatio] = useState(null);

  const [imageProps, setImageProps] = useState({
    x: 50,
    y: 50,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    width: 0,
    height: 0,
  });
  const [cropArea, setCropArea] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [colorMap, setColorMap] = useState({});
  const [fillTypeMap, setFillTypeMap] = useState({});
  const [gradientMap, setGradientMap] = useState({});
  const [colorKeys, setColorKeys] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [pickerVisibility, setPickerVisibility] = useState({});
  const cropRectRef = useRef();
  const cropTransformerRef = useRef();
  const transformerRef = useRef();
  const imageNodeRef = useRef();
  const [layerList, setLayerList] = useState([]);
  useEffect(() => {
    const newLayerList = [];

    if (selectedBg) {
      newLayerList.push({ id: "bg", type: "background", label: "Background" });
    }

    if (imageObj) {
      newLayerList.push({ id: "main-image", type: "mainImage", label: "Image" });
    }

    if (showCropRect) {
      newLayerList.push({ id: "crop-rect", type: "crop", label: "Crop Area" });
    }

    texts.forEach((text) => {
      newLayerList.push({ ...text, id: text.id, type: "text", label: "Text" });
    });

    images.forEach((img) => {
      newLayerList.push({ ...img, id: img.id, type: "extraImage", label: "Image" });
    });

    setLayerList(newLayerList);
  }, [selectedBg, imageObj, texts, images, showCropRect]);

  const togglePicker = (key, type) => {
    setPickerVisibility((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: !prev[key]?.[type],
      },
    }));
  };

  async function addSvg(url) {
    console.log(url, "url");
    try {
      const svgText = await fetchSvgText(url);
      const colors = extractColors(svgText);
      const initialMap = {};
      const typeMap = {};
      colors.forEach((c) => {
        initialMap[c] = c;
        typeMap[c] = "color";
      });

      svgToImage(svgText, (img) => {
        const id = Date.now().toString();

        pushUndoState({
          images,
          selectedId,
          colorMap,
          fillTypeMap,
          gradientMap,
          colorKeys,
        });

        setImages((prev) => [
          ...prev,
          {
            id,
            x: 50 + prev.length * 30,
            y: 50 + prev.length * 30,
            svgText,
            originalColors: colors,
            image: img,
            url,
          },
        ]);
        setSelectedId(id);
        setColorKeys(colors);
        setColorMap(initialMap);
        setFillTypeMap(typeMap);
        setRedoStack([]);
      });
    } catch (error) {
      alert("Failed to load SVG: " + error.message);
    }
  }

  function pushUndoState(state) {
    setUndoStack((prev) => [...prev, state]);
  }

  function updateImageColors(
    imgObj,
    newColorMap,
    newFillTypeMap = fillTypeMap,
    newGradientMap = gradientMap,
  ) {
    const newSvg = replaceColorsWithGradients(
      imgObj.svgText,
      newColorMap,
      newFillTypeMap,
      newGradientMap,
    );
    svgToImage(newSvg, (img) => {
      setImages((prev) => prev.map((i) => (i.id === imgObj.id ? { ...i, image: img } : i)));
    });
  }

  function onColorChange(origColor, newColor, isGradient = false) {
    if (!selectedId) return;

    pushUndoState({
      images,
      selectedId,
      colorMap,
      fillTypeMap,
      gradientMap,
      colorKeys,
    });

    setRedoStack([]);

    const newFillTypes = { ...fillTypeMap, [origColor]: isGradient ? "gradient" : "color" };
    setFillTypeMap(newFillTypes);

    const updatedMap = {
      ...colorMap,
      [origColor]: isGradient ? origColor : newColor.hex,
    };
    setColorMap(updatedMap);

    if (isGradient) {
      setGradientMap((prev) => ({
        ...prev,
        [origColor]: { start: newColor.start, end: newColor.end },
      }));
    }

    const currentImg = images.find((i) => i.id === selectedId);
    if (currentImg)
      updateImageColors(currentImg, updatedMap, newFillTypes, {
        ...gradientMap,
        ...(isGradient && {
          [origColor]: {
            start: newColor.start,
            end: newColor.end,
          },
        }),
      });
  }

  function onSelectImage(id) {
    setSelectedId(id);
    const img = images.find((i) => i.id === id);
    if (!img) return;
    const newMap = {};
    const newFillTypes = {};
    img.originalColors.forEach((c) => {
      newMap[c] = colorMap[c] || c;
      newFillTypes[c] = fillTypeMap[c] || "color";
    });
    setColorKeys(img.originalColors);
    setColorMap(newMap);
    setFillTypeMap(newFillTypes);
  }

  function deleteSelectedImage() {
    if (!selectedId) return;
    pushUndoState({
      images,
      selectedId,
      colorMap,
      fillTypeMap,
      gradientMap,
      colorKeys,
    });
    setRedoStack([]);

    setImages((prev) => prev.filter((img) => img.id !== selectedId));
    setSelectedId(null);
    setColorKeys([]);
    setColorMap({});
    setFillTypeMap({});
    setGradientMap({});
  }

  useEffect(() => {
    if (!transformerRef.current) return;

    if (!selectedId) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
      return;
    }

    const node = stageRef.current.findOne(`#img-${selectedId}`);
    if (node) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId, images]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete") {
        deleteSelectedImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId, images, colorMap, fillTypeMap, gradientMap]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undoStack, redoStack, images, selectedId, colorMap, fillTypeMap, gradientMap]);

  useEffect(() => {
    if (selected && trRef.current && textRefs.current[selected] && !isEditing) {
      trRef.current.nodes([textRefs.current[selected]]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selected, isEditing, texts]);

  useEffect(() => {
    if (!isEditing || !textRefs.current[editingTextId]) return;

    const textNode = textRefs.current[editingTextId];
    const stage = textNode.getStage();
    const stageBox = stage.container().getBoundingClientRect();
    const textPosition = textNode.getAbsolutePosition();
    const scale = textNode.getAbsoluteScale();

    const width = textNode.width() * scale.x;
    const height = textNode.height() * scale.y;
    const fontSize = textNode.fontSize() * scale.y;

    setTextAreaStyle({
      position: "absolute",
      top: stageBox.top + textPosition.y + "px",
      left: stageBox.left + textPosition.x + "px",
      width: width + "px",
      height: height + "px",
      fontSize: fontSize + "px",
      fontFamily: textNode.fontFamily(),
      background: "white",
      border: "1px solid #ccc",
      padding: "4px",
      margin: 0,
      overflow: "hidden",
      resize: "none",
      lineHeight: textNode.lineHeight(),
      outline: "none",
      zIndex: 1000,
    });
  }, [isEditing, editingTextId]);

  useEffect(() => {
    if (!imageFile) return;
    const img = new window.Image();
    img.src = URL.createObjectURL(imageFile);
    img.onload = () => {
      let newWidth = img.width;
      let newHeight = img.height;
      if (img.width > stageWidth || img.height > stageHeight) {
        const widthRatio = stageWidth / img.width;
        const heightRatio = stageHeight / img.height;
        const scale = Math.min(widthRatio, heightRatio);
        newWidth = img.width * scale;
        newHeight = img.height * scale;
      }
      setOriginalImageObj(img);
      setImageObj(img);
      setImageProps({
        x: (stageWidth - newWidth) / 2,
        y: (stageHeight - newHeight) / 2,
        scaleX: newWidth / img.width,
        scaleY: newHeight / img.height,
        rotation: 0,
        width: img.width,
        height: img.height,
      });
      setCropArea({
        x: (stageWidth - newWidth) / 2,
        y: (stageHeight - newHeight) / 2,
        width: newWidth,
        height: newHeight,
      });
      setLastCropData(null);
      setSelected(false);
      setShowCropRect(false);
    };
    return () => {
      if (img.src) URL.revokeObjectURL(img.src);
    };
  }, [imageFile, stageWidth, stageHeight]);

  useEffect(() => {
    if (selected && !showCropRect && transformerRef.current && imageNodeRef.current) {
      transformerRef.current.nodes([imageNodeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selected, imageObj, showCropRect]);

  useEffect(() => {
    if (showCropRect && cropTransformerRef.current && cropRectRef.current) {
      cropTransformerRef.current.nodes([cropRectRef.current]);
      cropTransformerRef.current.getLayer().batchDraw();
    } else if (!showCropRect && cropTransformerRef.current) {
      cropTransformerRef.current.nodes([]);
      cropTransformerRef.current.getLayer().batchDraw();
    }
  }, [showCropRect]);

  function handleUndo() {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];

    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [
      ...prev,
      {
        images,
        selectedId,
        colorMap,
        fillTypeMap,
        gradientMap,
        colorKeys,
      },
    ]);

    setImages(lastState.images);
    setSelectedId(lastState.selectedId);
    setColorMap(lastState.colorMap);
    setFillTypeMap(lastState.fillTypeMap);
    setGradientMap(lastState.gradientMap);
    setColorKeys(lastState.colorKeys);
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];

    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [
      ...prev,
      {
        images,
        selectedId,
        colorMap,
        fillTypeMap,
        gradientMap,
        colorKeys,
      },
    ]);

    setImages(nextState.images);
    setSelectedId(nextState.selectedId);
    setColorMap(nextState.colorMap);
    setFillTypeMap(nextState.fillTypeMap);
    setGradientMap(nextState.gradientMap);
    setColorKeys(nextState.colorKeys);
  }

  const addText = (text, fontFamily) => {
    const newText = {
      id: Date.now().toString(),
      x: 50,
      y: 50,
      text,
      fontSize: 32,
      fontFamily,
      fill: "#000000",
      draggable: true,
      fontStyle: "normal", // normal, bold, italic, bold italic
      textDecoration: "", // underline, line-through
      shadowColor: "",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 0,
      textTransform: "none", // or "uppercase"
    };
    setTexts((prev) => [...prev, newText]);
  };

  const updateTextStyle = (key, value) => {
    setTexts((prev) => prev.map((t) => (t.id === selectedId ? { ...t, [key]: value } : t)));
  };

  const toggleTextTransform = () => {
    const current = texts.find((t) => t.id === selectedId);
    updateTextStyle("textTransform", current?.textTransform === "uppercase" ? "none" : "uppercase");
  };

  const toggleBold = () => {
    const current = texts.find((t) => t.id === selectedId);
    const isBold = current?.fontStyle.includes("bold");
    const newStyle = isBold
      ? current.fontStyle.replace("bold", "").trim()
      : `${current.fontStyle} bold`.trim();
    updateTextStyle("fontStyle", newStyle);
  };

  const toggleItalic = () => {
    const current = texts.find((t) => t.id === selectedId);
    const isItalic = current?.fontStyle.includes("italic");
    const newStyle = isItalic
      ? current.fontStyle.replace("italic", "").trim()
      : `${current.fontStyle} italic`.trim();
    updateTextStyle("fontStyle", newStyle);
  };

  const toggleUnderline = () => {
    const current = texts.find((t) => t.id === selectedId);
    const newStyle = current?.textDecoration === "underline" ? "" : "underline";
    updateTextStyle("textDecoration", newStyle);
  };

  const shapeRefs = useRef({});

  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    const node = shapeRefs.current[selectedId];
    if (transformer && node) {
      transformer.nodes([node]);
      transformer.getLayer().batchDraw();
    } else if (transformer) {
      transformer.nodes([]);
    }
  }, [selectedId]);

  const handleSelect = (id, type) => {
    setSelectedId(id);
    setSelectedType(type);
  };

  const updateFontFamily = async (fontFamily) => {
    if (!selectedId) return;

    await loadGoogleFont(fontFamily);

    setTexts((prev) =>
      prev.map((text) =>
        text.id === selectedId
          ? { ...text, fontFamily, _forceRerender: Date.now() } // force KonvaText re-render
          : text,
      ),
    );
  };

  useEffect(() => {
    if (selectedId && trRef.current && textRefs.current[selectedId]) {
      trRef.current.nodes([textRefs.current[selectedId]]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedId, texts]);

  const handleDblClick = (id) => {
    const textNode = shapeRefs.current[id];
    const stage = stageRef.current;

    if (!textNode || !stage) return;

    const textPosition = textNode.getAbsolutePosition();
    const stageBox = stage.container().getBoundingClientRect();

    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    setTextAreaStyle({
      position: "absolute",
      top: `${areaPosition.y}px`,
      left: `${areaPosition.x}px`,
      fontSize: `${textNode.fontSize()}px`,
      fontFamily: textNode.fontFamily(),
      color: textNode.fill(),
      background: "white",
      border: "1px solid #ccc",
      padding: "4px",
      resize: "none",
      lineHeight: textNode.lineHeight(),
      transformOrigin: "top left",
      textAlign: textNode.align(),
      transform: `rotate(${textNode.rotation()}deg)`,
      whiteSpace: "pre",
      overflow: "hidden",
      zIndex: 1000,
    });

    setValue(textNode.text());
    setEditingTextId(id);
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    setTexts((prev) => prev.map((t) => (t.id === editingTextId ? { ...t, text: value } : t)));
    setEditingTextId(null);
  };

  const handleDragEnd = (type, id, pos) => {
    if (type === "image") {
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, x: pos.x, y: pos.y } : img)),
      );
    } else if (type === "text") {
      setTexts((prev) => prev.map((txt) => (txt.id === id ? { ...txt, x: pos.x, y: pos.y } : txt)));
    }
  };
  const applyFilter = (filterKey) => {
    const imageNode = imageNodeRef.current;
    const filter = filterStyles[filterKey];

    if (imageNode && imageObj) {
      imageNode.filters(filter.filters || []);

      const adjustableProps = ["brightness", "contrast", "hue", "saturation", "value"];
      adjustableProps.forEach((prop) => {
        imageNode[prop](filter[prop] !== undefined ? filter[prop] : 0);
      });

      imageNode.cache();
      imageNode.getLayer().batchDraw();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
    }
  };

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage() || e.target.getParent() === e.target.getStage()) {
      setSelected(false);
    }
    if (e.target === e.target.getStage()) setSelectedId(null);
  };

  const handleCrop = () => {
    const imageNode = shapeRefs.current["main-image"];
    const cropNode = shapeRefs.current["crop-rect"];
    if (!imageNode || !cropNode || !originalImageObj) return;

    const imagePropsBeforeCrop = {
      x: imageNode.x(),
      y: imageNode.y(),
      scaleX: imageNode.scaleX(),
      scaleY: imageNode.scaleY(),
      rotation: imageNode.rotation(),
      width: imageNode.width(),
      height: imageNode.height(),
    };

    const cropX = cropNode.x();
    const cropY = cropNode.y();
    const cropWidth = cropNode.width() * cropNode.scaleX();
    const cropHeight = cropNode.height() * cropNode.scaleY();

    const absTransform = imageNode.getAbsoluteTransform().copy().invert();
    const topLeft = absTransform.point({ x: cropX, y: cropY });
    const bottomRight = absTransform.point({
      x: cropX + cropWidth,
      y: cropY + cropHeight,
    });

    const srcX = Math.max(0, topLeft.x);
    const srcY = Math.max(0, topLeft.y);
    const srcWidth = Math.min(originalImageObj.width - srcX, bottomRight.x - topLeft.x);
    const srcHeight = Math.min(originalImageObj.height - srcY, bottomRight.y - topLeft.y);

    const canvas = document.createElement("canvas");
    canvas.width = srcWidth;
    canvas.height = srcHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(originalImageObj, srcX, srcY, srcWidth, srcHeight, 0, 0, srcWidth, srcHeight);

    const croppedImage = new window.Image();
    croppedImage.src = canvas.toDataURL();
    croppedImage.onload = () => {
      setImageObj(croppedImage);

      setImageProps({
        x: cropX,
        y: cropY,
        scaleX: cropWidth / croppedImage.width,
        scaleY: cropHeight / croppedImage.height,
        width: croppedImage.width,
        height: croppedImage.height,
        rotation: imagePropsBeforeCrop.rotation,
      });

      setShowCropRect(false);
      setSelectedId(null);

      setLastCropData({
        cropRect: {
          x: cropX,
          y: cropY,
          width: cropWidth,
          height: cropHeight,
        },
        imagePropsAtCrop: imagePropsBeforeCrop,
      });
    };
  };

  const handleAspectRatioChange = (value) => {
    let newAspectRatio = null;

    if (value === "original" && imageProps?.width && imageProps?.height) {
      newAspectRatio = imageProps.width / imageProps.height;
    } else if (value !== "none") {
      const [widthStr, heightStr] = value.split(":");
      newAspectRatio = Number(widthStr) / Number(heightStr);
    }

    setCropAspectRatio(newAspectRatio);

    if (!imageObj) return;

    let currentImageDisplayWidth = imageProps.width * imageProps.scaleX;
    let currentImageDisplayHeight = imageProps.height * imageProps.scaleY;

    let newCropWidth = currentImageDisplayWidth;
    let newCropHeight = currentImageDisplayHeight;

    if (newAspectRatio !== null) {
      if (currentImageDisplayWidth / currentImageDisplayHeight > newAspectRatio) {
        newCropHeight = currentImageDisplayHeight;
        newCropWidth = newCropHeight * newAspectRatio;
      } else {
        newCropWidth = currentImageDisplayWidth;
        newCropHeight = newCropWidth / newAspectRatio;
      }
    }

    const imageNode = imageNodeRef.current;
    let imageClientRect = imageNode ? imageNode.getClientRect() : null;

    let cropX = (stageWidth - newCropWidth) / 2;
    let cropY = (stageHeight - newCropHeight) / 2;

    if (imageClientRect) {
      cropX = Math.max(imageClientRect.x, cropX);
      cropY = Math.max(imageClientRect.y, cropY);

      if (cropX + newCropWidth > imageClientRect.x + imageClientRect.width) {
        cropX = imageClientRect.x + imageClientRect.width - newCropWidth;
      }
      if (cropY + newCropHeight > imageClientRect.y + imageClientRect.height) {
        cropY = imageClientRect.y + imageClientRect.height - newCropHeight;
      }

      if (newCropWidth > imageClientRect.width) {
        newCropWidth = imageClientRect.width;
        if (newAspectRatio !== null) {
          newCropHeight = newCropWidth / newAspectRatio;
        }
      }
      if (newCropHeight > imageClientRect.height) {
        newCropHeight = imageClientRect.height;
        if (newAspectRatio !== null) {
          newCropWidth = newCropHeight * newAspectRatio;
        }
      }
    }

    setCropArea({
      x: cropX,
      y: cropY,
      width: newCropWidth,
      height: newCropHeight,
    });

    setTimeout(() => {
      if (cropTransformerRef.current && cropRectRef.current) {
        cropTransformerRef.current.nodes([cropRectRef.current]);
        cropTransformerRef.current.getLayer().batchDraw();
      }
    }, 0);
  };

  const handleDownload = () => {
    if (!stageRef.current || !imageObj) return;

    const cropRectNode = cropRectRef.current;
    const cropTransformerNode = cropTransformerRef.current;
    const transformerNode = transformerRef.current;
    let cropRectVisible = false;
    let cropTransformerVisible = false;
    let transformerVisible = false;
    if (cropRectNode) {
      cropRectVisible = cropRectNode.visible();
      cropRectNode.visible(false);
    }
    if (cropTransformerNode) {
      cropTransformerVisible = cropTransformerNode.visible();
      cropTransformerNode.visible(false);
    }
    if (transformerNode) {
      transformerVisible = transformerNode.visible();
      transformerNode.visible(false);
    }
    stageRef.current.batchDraw();
    requestAnimationFrame(() => {
      const dataURL = stageRef.current.toDataURL({
        mimeType: "image/png",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "edited-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (cropRectNode) cropRectNode.visible(cropRectVisible);
      if (cropTransformerNode) cropTransformerNode.visible(cropTransformerVisible);
      if (transformerNode) transformerNode.visible(transformerVisible);
      stageRef.current.batchDraw();
    });
  };

  const handleOpenColorFilter = (value) => {
    setOpenColorFilter(value);
    setReplaceBgOpen(false);
    setShowCropRect(false);
  };

  const removeBackground = async () => {
    if (!imageFile) {
      alert("Please upload an image first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", imageFile);
    try {
      const response = await fetch("http://192.168.0.168:8000/remove-bg/", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to remove background");
      }
      const blob = await response.blob();
      setBgRemovedBlob(blob);
      setIsBgRemoved(true);
      const imageURL = URL.createObjectURL(blob);
      const bgRemovedImage = new window.Image();
      bgRemovedImage.src = imageURL;
      bgRemovedImage.onload = () => {
        setImageObj(bgRemovedImage);
        setSelected(false);
        setShowCropRect(false);
        setImageProps({
          x: (stageWidth - bgRemovedImage.width) / 2,
          y: (stageHeight - bgRemovedImage.height) / 2,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          width: bgRemovedImage.width,
          height: bgRemovedImage.height,
        });
      };
    } catch (error) {
      console.error("Background removal failed:", error);
      alert("Background removal failed.");
    }
  };

  const replaceBgPopUpOpen = async () => {
    if (!imageFile) {
      alert("Please upload an image first.");
      return;
    }
    if (!isBgRemoved) {
      const formData = new FormData();
      formData.append("file", imageFile);
      try {
        const response = await fetch("http://192.168.0.168:8000/remove-bg/", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Failed to remove background");
        }
        const blob = await response.blob();
        setBgRemovedBlob(blob);
        setIsBgRemoved(true);
        const imageURL = URL.createObjectURL(blob);
        const bgRemovedImage = new window.Image();
        bgRemovedImage.src = imageURL;
        bgRemovedImage.onload = () => {
          setImageObj(bgRemovedImage);
          setSelected(false);
          setShowCropRect(false);
          setImageProps({
            x: (stageWidth - bgRemovedImage.width) / 2,
            y: (stageHeight - bgRemovedImage.height) / 2,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            width: bgRemovedImage.width,
            height: bgRemovedImage.height,
          });
          setReplaceBgOpen(true);
        };
      } catch (error) {
        console.error("Background removal failed:", error);
        alert("Background removal failed.");
      }
    } else {
      setReplaceBgOpen(true);
    }
  };

  const upscaleImage = async () => {
    if (!imageFile) {
      alert("Please upload an image first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", imageFile);
    try {
      const response = await fetch("http://192.168.0.30:8000/upscale", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upscale image");
      }
      const blob = await response.blob();
      const imageURL = URL.createObjectURL(blob);
      const loadedImage = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageURL;
      });
      setImageObj(loadedImage);
      setSelected(false);
      setShowCropRect(false);
      setImageProps({
        x: (stageWidth - loadedImage.width) / 2,
        y: (stageHeight - loadedImage.height) / 2,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        width: loadedImage.width,
        height: loadedImage.height,
      });
      URL.revokeObjectURL(imageURL);
    } catch (error) {
      console.error("Upscale Image failed:", error);
      alert("Upscale Image failed.");
    }
  };

  const generateBackground = async () => {
    if (!imageFile || !prompt.trim()) {
      alert("Please upload an image and enter a prompt.");
      return;
    }
    try {
      let blobToUse = bgRemovedBlob;
      if (!isBgRemoved) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const response = await fetch("http://192.168.0.168:8000/remove-bg/", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Failed to remove background");
        }
        blobToUse = await response.blob();
        setBgRemovedBlob(blobToUse);
        setIsBgRemoved(true);
      }
      const inpaintFormData = new FormData();
      inpaintFormData.append("file", blobToUse);
      inpaintFormData.append("prompt", prompt);
      const inpaintResponse = await fetch("http://192.168.0.168:8000/inpaint/", {
        method: "POST",
        body: inpaintFormData,
      });
      if (!inpaintResponse.ok) {
        throw new Error("Inpaint failed");
      }
      const finalBlob = await inpaintResponse.blob();
      const imageURL = URL.createObjectURL(finalBlob);
      const finalImage = new window.Image();
      finalImage.src = imageURL;
      finalImage.onload = () => {
        setImageObj(finalImage);
        setSelected(false);
        setShowCropRect(false);
        setPrompt("");
        setImageProps({
          x: (stageWidth - finalImage.width) / 2,
          y: (stageHeight - finalImage.height) / 2,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          width: finalImage.width,
          height: finalImage.height,
        });
      };
    } catch (error) {
      console.error("Background replacement failed:", error);
      alert("Background replacement failed.");
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reordered = Array.from(layerList);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setLayerList(reordered);

    setTimeout(() => {
      reordered.forEach((item) => {
        const node = shapeRefs.current[item.id];
        if (node) node.moveToTop();
      });
      stageRef.current?.batchDraw();
    }, 0);
  };

  return (
    <div className="flex w-full bg-gray-100">
      <Sidebar
        replaceBgOpen={replaceBgOpen}
        selected={selected}
        setSelectedBg={setSelectedBg}
        prompt={prompt}
        setPrompt={setPrompt}
        generateBackground={generateBackground}
        imageObj={imageObj}
        openColorFilter={openColorFilter}
        applyFilter={applyFilter}
        addSvg={addSvg}
        addText={addText}
        updateFontFamily={updateFontFamily}
        texts={texts}
        showCropRect={showCropRect}
        cropAspectRatio={cropAspectRatio}
        handleAspectRatioChange={handleAspectRatioChange}
        setSelected={setSelected}
        setOpenColorFilter={setOpenColorFilter}
        originalImageObj={originalImageObj}
        setCropArea={setCropArea}
        setImageProps={setImageProps}
        setImageObj={setImageObj}
        setShowCropRect={setShowCropRect}
        handleCrop={handleCrop}
        selectedId={selectedId}
        updateTextStyle={updateTextStyle}
        toggleBold={toggleBold}
        toggleItalic={toggleItalic}
        toggleUnderline={toggleUnderline}
        toggleTextTransform={toggleTextTransform}
      />
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6">
        <Topbar
          lastCropData={lastCropData}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          originalImageObj={originalImageObj}
          setShowCropRect={setShowCropRect}
          setImageObj={setImageObj}
          setImageProps={setImageProps}
          setCropArea={setCropArea}
          setSelected={setSelected}
          showCropRect={showCropRect}
          removeBackground={removeBackground}
          imageFile={imageFile}
          replaceBgPopUpOpen={replaceBgPopUpOpen}
          upscaleImage={upscaleImage}
          handleOpenColorFilter={handleOpenColorFilter}
          imageObj={imageObj}
          handleDownload={handleDownload}
          stageHeight={stageHeight}
          stageWidth={stageWidth}
          handleAspectRatioChange={handleAspectRatioChange}
          cropAspectRatio={cropAspectRatio}
          setOpenColorFilter={setOpenColorFilter}
        />

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="layer-list">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {layerList.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-2 mb-2 bg-gray-100 rounded shadow cursor-pointer"
                        onClick={() => handleSelect(item.id, item.type)}
                      >
                        {item.label}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <div
          style={{
            border: "2px solid #ccc",
            borderRadius: 8,
            width: stageWidth,
            height: stageHeight,
            backgroundColor: "#fff",
          }}
        >
          <Stage
            width={stageWidth}
            height={stageHeight}
            onMouseDown={handleStageClick}
            onTouchStart={handleStageClick}
            style={{ cursor: selected && !showCropRect ? "move" : "default" }}
            ref={stageRef}
          >
            <Layer>
              {selectedBg && (
                <KonvaImage
                  image={selectedBg}
                  x={imageProps.x}
                  y={imageProps.y}
                  width={imageProps.width}
                  height={imageProps.height}
                  scaleX={imageProps.scaleX}
                  scaleY={imageProps.scaleY}
                  rotation={imageProps.rotation}
                  listening={false}
                />
              )}

              {imageObj && (
                <KonvaImage
                  image={imageObj}
                  ref={(node) => (shapeRefs.current["main-image"] = node)}
                  {...imageProps}
                  x={imageProps.x}
                  y={imageProps.y}
                  scaleX={imageProps.scaleX}
                  scaleY={imageProps.scaleY}
                  rotation={imageProps.rotation}
                  width={imageProps.width}
                  height={imageProps.height}
                  draggable={!showCropRect}
                  onClick={() => !showCropRect && handleSelect("main-image", "image")}
                  onTransformEnd={(e) => {
                    const node = shapeRefs.current["main-image"];
                    setImageProps({
                      x: node.x(),
                      y: node.y(),
                      width: node.width(),
                      height: node.height(),
                      scaleX: node.scaleX(),
                      scaleY: node.scaleY(),
                      rotation: node.rotation(),
                    });
                  }}
                  onDragEnd={(e) => {
                    const node = shapeRefs.current["main-image"];
                    setImageProps((prev) => ({
                      ...prev,
                      x: node.x(),
                      y: node.y(),
                    }));
                  }}
                />
              )}

              {showCropRect && (
                <Rect
                  ref={(node) => (shapeRefs.current["crop-rect"] = node)}
                  {...cropArea}
                  fill="rgba(0,0,0,0.4)"
                  stroke="yellow"
                  strokeWidth={2}
                  draggable
                  onClick={() => handleSelect("crop-rect", "crop")}
                  onTransformEnd={(e) => {
                    const node = shapeRefs.current["crop-rect"];
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    setCropArea({
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(30, node.width() * scaleX),
                      height: Math.max(30, node.height() * scaleY),
                    });
                  }}
                  onDragEnd={(e) => {
                    const node = shapeRefs.current["crop-rect"];
                    setCropArea({
                      x: node.x(),
                      y: node.y(),
                      width: node.width() * node.scaleX(),
                      height: node.height() * node.scaleY(),
                    });
                  }}
                />
              )}

              {texts.map((text) => (
                <KonvaText
                  key={text.id}
                  ref={(node) => (shapeRefs.current[text.id] = node)}
                  {...text}
                  text={text.textTransform === "uppercase" ? text.text.toUpperCase() : text.text}
                  onClick={() => handleSelect(text.id, "text")}
                  onTap={() => handleSelect(text.id)}
                  onDblClick={() => handleDblClick(text.id)}
                  onDblTap={() => handleDblClick(text.id)}
                  onDragEnd={(e) => {
                    setTexts((prev) =>
                      prev.map((t) =>
                        t.id === text.id ? { ...t, x: e.target.x(), y: e.target.y() } : t,
                      ),
                    );
                  }}
                />
              ))}

              {images.map(({ id, image, x, y }) => (
                <KonvaImage
                  key={id}
                  ref={(node) => (shapeRefs.current[id] = node)}
                  image={image}
                  x={x}
                  y={y}
                  draggable
                  onClick={() => handleSelect(id, "extra-image")}
                  onDragEnd={(e) => {
                    setImages((prev) =>
                      prev.map((img) =>
                        img.id === id ? { ...img, x: e.target.x(), y: e.target.y() } : img,
                      ),
                    );
                  }}
                />
              ))}

              <Transformer
                ref={transformerRef}
                rotateEnabled={selectedType !== "crop"}
                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 30 || newBox.height < 30) return oldBox;
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
          {isEditing && (
            <textarea
              style={textAreaStyle}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleBlur}
              autoFocus
              spellCheck={false}
            />
          )}
        </div>
      </div>
      <ColorPickerListSvg
        selectedId={selectedId}
        colorKeys={colorKeys}
        fillTypeMap={fillTypeMap}
        onColorChange={onColorChange}
        colorMap={colorMap}
        gradientMap={gradientMap}
        togglePicker={togglePicker}
        pickerVisibility={pickerVisibility}
      />
    </div>
  );
}
