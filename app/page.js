"use client";

import ColorPickerListSvg from "@/Componment/ColorPickerListSvg";
import Sidebar from "@/Componment/Sidebar";
import Topbar from "@/Componment/Topbar";
import { filterStyles } from "@/utils/filterStyles";
import {
  extractColors,
  fetchSvgText,
  replaceColorsWithGradients,
  svgToImage,
} from "@/utils/servicesFunction";
import { useEffect, useRef, useState } from "react";
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
    if (!transformerRef.current) return; // <-- add this guard

    if (!selectedId) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
      // other state clearing...
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

  const addText = () => {
    const newText = {
      id: Date.now().toString(),
      x: 50,
      y: 50,
      text: "New Text",
      fontSize: 24,
      width: 300,
      draggable: true,
    };
    setTexts([...texts, newText]);
  };

  const handleSelect = (id) => {
    console.log(id, "id");
    if (!isEditing) {
      setSelected(id);
    }
  };

  const handleDblClick = (id) => {
    setIsEditing(true);
    setEditingTextId(id);
    const currentText = texts.find((t) => t.id === id);
    setValue(currentText.text);
  };

  const handleBlur = () => {
    setIsEditing(false);
    setTexts((prev) => prev.map((t) => (t.id === editingTextId ? { ...t, text: value } : t)));
    setEditingTextId(null);
  };

  const handleDragEnd = (id, pos) => {
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...pos } : t)));
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
    const imageNode = imageNodeRef.current;
    const cropNode = cropRectRef.current;
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
    const bottomRight = absTransform.point({ x: cropX + cropWidth, y: cropY + cropHeight });

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
      setSelected(false);

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
          handleCrop={handleCrop}
          removeBackground={removeBackground}
          imageFile={imageFile}
          replaceBgPopUpOpen={replaceBgPopUpOpen}
          upscaleImage={upscaleImage}
          handleOpenColorFilter={handleOpenColorFilter}
          imageObj={imageObj}
          handleDownload={handleDownload}
          addText={addText}
          stageHeight={stageHeight}
          stageWidth={stageWidth}
        />

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
              {selectedBg && imageObj && (
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

              {/* Main editable image */}
              {imageObj && (
                <>
                  <KonvaImage
                    image={imageObj}
                    x={imageProps.x}
                    y={imageProps.y}
                    scaleX={imageProps.scaleX}
                    scaleY={imageProps.scaleY}
                    rotation={imageProps.rotation}
                    width={imageProps.width}
                    height={imageProps.height}
                    draggable={!showCropRect}
                    onClick={() => !showCropRect && setSelected(true)}
                    ref={imageNodeRef}
                    onTransformEnd={() => {
                      const node = imageNodeRef.current;
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
                    onDragEnd={() => {
                      const node = imageNodeRef.current;
                      setImageProps((prevProps) => ({
                        ...prevProps,
                        x: node.x(),
                        y: node.y(),
                      }));
                    }}
                  />
                  {selected && !showCropRect && (
                    <Transformer
                      ref={transformerRef}
                      rotateEnabled={true}
                      enabledAnchors={[
                        "top-left",
                        "top-center",
                        "top-right",
                        "middle-left",
                        "middle-right",
                        "bottom-left",
                        "bottom-center",
                        "bottom-right",
                      ]}
                      boundBoxFunc={(oldBox, newBox) => {
                        if (
                          newBox.width * newBox.scaleX < 30 ||
                          newBox.height * newBox.scaleY < 30
                        ) {
                          return oldBox;
                        }
                        return newBox;
                      }}
                    />
                  )}
                </>
              )}

              {/* Crop Rectangle */}
              {showCropRect && (
                <>
                  <Rect
                    ref={cropRectRef}
                    x={cropArea.x}
                    y={cropArea.y}
                    width={cropArea.width}
                    height={cropArea.height}
                    fill="rgba(0,0,0,0.5)"
                    stroke="yellow"
                    strokeWidth={2}
                    draggable
                    dragBoundFunc={(pos) => {
                      const imageNode = imageNodeRef.current;
                      if (!imageNode) return pos;

                      const imageClientRect = imageNode.getClientRect();
                      let newX = pos.x;
                      let newY = pos.y;
                      const cropWidth = cropRectRef.current.width() * cropRectRef.current.scaleX();
                      const cropHeight =
                        cropRectRef.current.height() * cropRectRef.current.scaleY();

                      if (newX < imageClientRect.x) newX = imageClientRect.x;
                      if (newY < imageClientRect.y) newY = imageClientRect.y;
                      if (newX + cropWidth > imageClientRect.x + imageClientRect.width) {
                        newX = imageClientRect.x + imageClientRect.width - cropWidth;
                      }
                      if (newY + cropHeight > imageClientRect.y + imageClientRect.height) {
                        newY = imageClientRect.y + imageClientRect.height - cropHeight;
                      }

                      return { x: newX, y: newY };
                    }}
                    onTransformEnd={() => {
                      const node = cropRectRef.current;
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
                    onDragEnd={() => {
                      const node = cropRectRef.current;
                      setCropArea({
                        x: node.x(),
                        y: node.y(),
                        width: node.width() * node.scaleX(),
                        height: node.height() * node.scaleY(),
                      });
                    }}
                  />
                  <Transformer
                    ref={cropTransformerRef}
                    rotateEnabled={false}
                    enabledAnchors={[
                      "top-left",
                      "top-center",
                      "top-right",
                      "middle-left",
                      "middle-right",
                      "bottom-left",
                      "bottom-center",
                      "bottom-right",
                    ]}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 30 || newBox.height < 30) {
                        return oldBox;
                      }

                      const imageNode = imageNodeRef.current;
                      if (!imageNode) return newBox;

                      const imageClientRect = imageNode.getClientRect();
                      let constrainedNewBox = { ...newBox };

                      if (constrainedNewBox.x < imageClientRect.x) {
                        constrainedNewBox.width -= imageClientRect.x - constrainedNewBox.x;
                        constrainedNewBox.x = imageClientRect.x;
                      }
                      if (constrainedNewBox.y < imageClientRect.y) {
                        constrainedNewBox.height -= imageClientRect.y - constrainedNewBox.y;
                        constrainedNewBox.y = imageClientRect.y;
                      }
                      if (
                        constrainedNewBox.x + constrainedNewBox.width >
                        imageClientRect.x + imageClientRect.width
                      ) {
                        constrainedNewBox.width =
                          imageClientRect.x + imageClientRect.width - constrainedNewBox.x;
                      }
                      if (
                        constrainedNewBox.y + constrainedNewBox.height >
                        imageClientRect.y + imageClientRect.height
                      ) {
                        constrainedNewBox.height =
                          imageClientRect.y + imageClientRect.height - constrainedNewBox.y;
                      }

                      constrainedNewBox.width = Math.max(30, constrainedNewBox.width);
                      constrainedNewBox.height = Math.max(30, constrainedNewBox.height);

                      return constrainedNewBox;
                    }}
                  />
                </>
              )}
            </Layer>
            <Layer>
              {texts?.map((text) => (
                <KonvaText
                  key={text.id}
                  ref={(node) => (textRefs.current[text.id] = node)}
                  {...text}
                  draggable
                  onClick={() => handleSelect(text.id)}
                  onTap={() => handleSelect(text.id)}
                  onDblClick={() => handleDblClick(text.id)}
                  onDblTap={() => handleDblClick(text.id)}
                  onDragEnd={(e) =>
                    handleDragEnd(text.id, {
                      x: e.target.x(),
                      y: e.target.y(),
                    })
                  }
                />
              ))}
              {selected && !isEditing && <Transformer ref={trRef} />}
            </Layer>
            <Layer>
              {images.map(({ id, image, x, y }) => (
                <KonvaImage
                  key={id}
                  id={`img-${id}`}
                  image={image}
                  x={x}
                  y={y}
                  draggable
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onSelectImage(id);
                  }}
                  onDragEnd={(e) => {
                    const posX = e.target.x();
                    const posY = e.target.y();
                    setImages((prev) =>
                      prev.map((img) => (img.id === id ? { ...img, x: posX, y: posY } : img)),
                    );
                  }}
                />
              ))}
              <Transformer
                ref={transformerRef}
                rotateEnabled
                enabledAnchors={[
                  "top-left",
                  "top-center",
                  "top-right",
                  "middle-left",
                  "middle-right",
                  "bottom-left",
                  "bottom-center",
                  "bottom-right",
                ]}
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
