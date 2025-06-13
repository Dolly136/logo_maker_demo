"use client";

import ContextRightClick from "@/Componment/ContextRightClick";
import Sidebar from "@/Componment/Sidebar";
import Topbar from "@/Componment/Topbar";
import { canvasPresets } from "@/utils/canvasPresets";
import { filterStyles } from "@/utils/filterStyles";
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
  const [uploadedImages, setUploadedImages] = useState([]);
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
  const selectedSvgObj = images.find((img) => img.id === selectedId);
  const cropRectRef = useRef();
  const cropTransformerRef = useRef();
  const transformerRef = useRef();
  const imageNodeRef = useRef();
  const [layerList, setLayerList] = useState([]);
  const [showLayerList, setShowLayerList] = useState(false);
  const shapeRefs = useRef({});
  const [lockedLayers, setLockedLayers] = useState({});
  const [clipboard, setClipboard] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    layerId: null,
    layerType: null,
  });
  const [canvasSize, setCanvasSize] = useState(canvasPresets[0]);
  const [customWidth, setCustomWidth] = useState(750);
  const [customHeight, setCustomHeight] = useState(750);
  const [stageWidth, setStageWidth] = useState(canvasPresets[0].width);
  const [stageHeight, setStageHeight] = useState(canvasPresets[0].height);
  const [canvasBgColor, setCanvasBgColor] = useState("#ffffff");
  const [appliedFilterKey, setAppliedFilterKey] = useState(null);

  useEffect(() => {
    if (canvasSize.label === "Custom (enter below)") {
      setStageWidth(customWidth);
      setStageHeight(customHeight);
    } else {
      setStageWidth(canvasSize.width);
      setStageHeight(canvasSize.height);
    }
  }, [canvasSize, customWidth, customHeight]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if a layer is selected
      if (!selectedId || !selectedType) return;

      // Copy (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        const item = layerList.find((l) => l.id === selectedId);
        if (item) setClipboard({ ...item });
      }

      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const item = layerList.find((l) => l.id === selectedId);
        if (!item) return;
        // Duplicate logic (same as handleContextMenuDuplicate)
        if (item.type === "text") {
          const newText = {
            ...item,
            id: Date.now().toString(),
            x: item.x + 20,
            y: item.y + 20,
            label: "Text (copy)",
          };
          setTexts((prev) => [...prev, newText]);
        } else if (item.type === "extraImage" || item.type === "mainImage") {
          const imgObj = images.find((img) => img.id === item.id) || {
            id: "main-image",
            image: imageObj,
            x: imageProps.x,
            y: imageProps.y,
            width: imageProps.width,
            height: imageProps.height,
            scaleX: imageProps.scaleX,
            scaleY: imageProps.scaleY,
            rotation: imageProps.rotation,
            url: imageObj?.src,
            label: "Image",
            type: "mainImage",
          };
          const newId = Date.now().toString();
          setImages((prev) => [
            ...prev,
            {
              ...imgObj,
              id: newId,
              x: imgObj.x + 20,
              y: imgObj.y + 20,
              label: (imgObj.label || "Image") + " (copy)",
            },
          ]);
        }
      }

      // Delete (Delete key)
      if (e.key === "Delete") {
        e.preventDefault();
        deleteSelectedLayer();
      }

      // Lock/Unlock (Ctrl+L)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setLockedLayers((prev) => ({
          ...prev,
          [selectedId]: !prev[selectedId],
        }));
      }

      // Flip Horizontal (Ctrl+F)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const item = layerList.find((l) => l.id === selectedId);
        if (!item) return;
        if (item.type === "text") {
          setTexts((prev) =>
            prev.map((t) =>
              t.id === item.id
                ? {
                  ...t,
                  scaleX: t.scaleX ? -t.scaleX : -1,
                }
                : t,
            ),
          );
        } else if (item.type === "extraImage") {
          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? {
                  ...img,
                  scaleX: img.scaleX ? -img.scaleX : -1,
                }
                : img,
            ),
          );
        } else if (item.type === "mainImage") {
          setImageProps((prev) => ({
            ...prev,
            scaleX: prev.scaleX ? -prev.scaleX : -1,
          }));
        }
      }

      // Flip Vertical (Ctrl+Shift+F)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const item = layerList.find((l) => l.id === selectedId);
        if (!item) return;
        if (item.type === "text") {
          setTexts((prev) =>
            prev.map((t) =>
              t.id === item.id
                ? {
                  ...t,
                  scaleY: t.scaleY ? -t.scaleY : -1,
                }
                : t,
            ),
          );
        } else if (item.type === "extraImage") {
          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? {
                  ...img,
                  scaleY: img.scaleY ? -img.scaleY : -1,
                }
                : img,
            ),
          );
        } else if (item.type === "mainImage") {
          setImageProps((prev) => ({
            ...prev,
            scaleY: prev.scaleY ? -prev.scaleY : -1,
          }));
        }
      }

      // Rotate Right (Ctrl+R)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        const item = layerList.find((l) => l.id === selectedId);
        if (!item) return;
        const delta = 90;
        if (item.type === "text") {
          setTexts((prev) =>
            prev.map((t) =>
              t.id === item.id ? { ...t, rotation: ((t.rotation || 0) + delta) % 360 } : t,
            ),
          );
        } else if (item.type === "extraImage") {
          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id ? { ...img, rotation: ((img.rotation || 0) + delta) % 360 } : img,
            ),
          );
        } else if (item.type === "mainImage") {
          setImageProps((prev) => ({
            ...prev,
            rotation: ((prev.rotation || 0) + delta) % 360,
          }));
        }
      }

      // Rotate Left (Ctrl+Shift+R)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        const item = layerList.find((l) => l.id === selectedId);
        if (!item) return;
        const delta = -90;
        if (item.type === "text") {
          setTexts((prev) =>
            prev.map((t) =>
              t.id === item.id ? { ...t, rotation: ((t.rotation || 0) + delta + 360) % 360 } : t,
            ),
          );
        } else if (item.type === "extraImage") {
          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? { ...img, rotation: ((img.rotation || 0) + delta + 360) % 360 }
                : img,
            ),
          );
        } else if (item.type === "mainImage") {
          setImageProps((prev) => ({
            ...prev,
            rotation: ((prev.rotation || 0) + delta + 360) % 360,
          }));
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "ArrowUp") {
        e.preventDefault();
        bringLayerForward();
      }
  
      // Send Backward (Ctrl+Shift+Down)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "ArrowDown") {
        e.preventDefault();
        sendLayerBackward();
      }
    };


    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedId,
    selectedType,
    layerList,
    images,
    texts,
    imageObj,
    imageProps,
    setClipboard,
    setTexts,
    setImages,
    setImageProps,
    setLockedLayers,
  ]);

  // ...existing code...

  useEffect(() => {
    // Move Konva nodes to match layerList order
    layerList.forEach((item) => {
      const node = shapeRefs.current[item.id];
      if (node) node.moveToTop();
    });
    stageRef.current?.batchDraw();
  }, [layerList]);
  // ...existing code...

  function bringLayerForward() {
    if (!selectedId) return;
    setLayerList((prev) => {
      const idx = prev.findIndex((l) => l.id === selectedId);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const newList = [...prev];
      [newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]];
      return newList;
    });
  }

  function sendLayerBackward() {
    if (!selectedId) return;
    setLayerList((prev) => {
      const idx = prev.findIndex((l) => l.id === selectedId);
      if (idx <= 0) return prev;
      const newList = [...prev];
      [newList[idx], newList[idx - 1]] = [newList[idx - 1], newList[idx]];
      return newList;
    });
  }

  // ...existing code...

  useEffect(() => {
    if (imageObj) {
      setImageProps((prev) => ({
        ...prev,
        x: (stageWidth - prev.width * prev.scaleX) / 2,
        y: (stageHeight - prev.height * prev.scaleY) / 2,
      }));
    }
    setTexts((prev) =>
      prev.map((t) => ({
        ...t,
        x: Math.max(0, Math.min(t.x, stageWidth - 50)),
        y: Math.max(0, Math.min(t.y, stageHeight - 50)),
      })),
    );
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        x: Math.max(0, Math.min(img.x, stageWidth - 50)),
        y: Math.max(0, Math.min(img.y, stageHeight - 50)),
      })),
    );
    setCropArea((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(prev.x, stageWidth - prev.width)),
      y: Math.max(0, Math.min(prev.y, stageHeight - prev.height)),
    }));
  }, [stageWidth, stageHeight]);

  function pushUndoState() {
    setUndoStack((prev) => [
      ...prev,
      {
        images,
        texts,
        imageObj,
        imageProps,
        cropArea,
        selectedId,
        selectedType,
        colorMap,
        fillTypeMap,
        gradientMap,
        colorKeys,
        showCropRect,
        selectedBg,
        isBgRemoved,
        bgRemovedBlob,
        cropAspectRatio,
        lastCropData,
        appliedFilterKey,
        canvasSize,
        customWidth,
        customHeight,
        canvasBgColor,
      },
    ]);
    setRedoStack([]);
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [
      ...prev,
      {
        images,
        texts,
        imageObj,
        imageProps,
        cropArea,
        selectedId,
        selectedType,
        colorMap,
        fillTypeMap,
        gradientMap,
        colorKeys,
        showCropRect,
        selectedBg,
        isBgRemoved,
        bgRemovedBlob,
        cropAspectRatio,
        lastCropData,
        appliedFilterKey,
        canvasSize,
        customWidth,
        customHeight,
        canvasBgColor,
      },
    ]);
    setImages(lastState.images);
    setTexts(lastState.texts);
    setImageObj(lastState.imageObj);
    setImageProps(lastState.imageProps);
    setCropArea(lastState.cropArea);
    setSelectedId(lastState.selectedId);
    setSelectedType(lastState.selectedType);
    setColorMap(lastState.colorMap);
    setFillTypeMap(lastState.fillTypeMap);
    setGradientMap(lastState.gradientMap);
    setColorKeys(lastState.colorKeys);
    setShowCropRect(lastState.showCropRect);
    setSelectedBg(lastState.selectedBg);
    setIsBgRemoved(lastState.isBgRemoved);
    setBgRemovedBlob(lastState.bgRemovedBlob);
    setCropAspectRatio(lastState.cropAspectRatio);
    setLastCropData(lastState.lastCropData);
    setAppliedFilterKey(lastState.appliedFilterKey);
    setCanvasSize(lastState.canvasSize);
    setCustomWidth(lastState.customWidth);
    setCustomHeight(lastState.customHeight);
    setCanvasBgColor(lastState.canvasBgColor);
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [
      ...prev,
      {
        images,
        texts,
        imageObj,
        imageProps,
        cropArea,
        selectedId,
        selectedType,
        colorMap,
        fillTypeMap,
        gradientMap,
        colorKeys,
        showCropRect,
        selectedBg,
        isBgRemoved,
        bgRemovedBlob,
        cropAspectRatio,
        lastCropData,
        appliedFilterKey,
        canvasSize,
        customWidth,
        customHeight,
        canvasBgColor,
      },
    ]);
    setImages(nextState.images);
    setTexts(nextState.texts);
    setImageObj(nextState.imageObj);
    setImageProps(nextState.imageProps);
    setCropArea(nextState.cropArea);
    setSelectedId(nextState.selectedId);
    setSelectedType(nextState.selectedType);
    setColorMap(nextState.colorMap);
    setFillTypeMap(nextState.fillTypeMap);
    setGradientMap(nextState.gradientMap);
    setColorKeys(nextState.colorKeys);
    setShowCropRect(nextState.showCropRect);
    setSelectedBg(nextState.selectedBg);
    setIsBgRemoved(nextState.isBgRemoved);
    setBgRemovedBlob(nextState.bgRemovedBlob);
    setCropAspectRatio(nextState.cropAspectRatio);
    setLastCropData(nextState.lastCropData);
    setAppliedFilterKey(nextState.appliedFilterKey);
    setCanvasSize(nextState.canvasSize);
    setCustomWidth(nextState.customWidth);
    setCustomHeight(nextState.customHeight);
    setCanvasBgColor(nextState.canvasBgColor);
  }

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
      newLayerList.push({ ...img, id: img.id, type: "extraImage", label: "Svg" });
    });

    setLayerList(newLayerList);
  }, [selectedBg, imageObj, texts, images, showCropRect]);

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
        deleteSelectedLayer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedId,
    selectedType,
    images,
    texts,
    colorMap,
    fillTypeMap,
    gradientMap,
    showCropRect,
    selectedBg,
  ]);

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
  }, [
    undoStack,
    redoStack,
    images,
    texts,
    imageObj,
    imageProps,
    cropArea,
    selectedId,
    selectedType,
    colorMap,
    fillTypeMap,
    gradientMap,
    colorKeys,
    showCropRect,
    selectedBg,
    isBgRemoved,
    bgRemovedBlob,
    cropAspectRatio,
    lastCropData,
  ]);

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
    try {
      const svgText = await fetchSvgText(url);
      const colors = extractColors(svgText);
      const initialMap = {};
      const typeMap = {};
      colors.forEach((c) => {
        initialMap[c] = c;
        typeMap[c] = "color";
      });

      pushUndoState();

      svgToImage(svgText, (img) => {
        const id = Date.now().toString();
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
            colorMap: initialMap,
            fillTypeMap: typeMap,
            gradientMap: {},
            colorKeys: colors,
          },
        ]);
        setSelectedId(id);
        setPickerVisibility({});
        setRedoStack([]);
      });
    } catch (error) {
      alert("Failed to load SVG: " + error.message);
    }
  }

  function updateImageColors(imgObj, newColorMap, newFillTypeMap, newGradientMap) {
    const newSvg = replaceColorsWithGradients(
      imgObj.svgText,
      newColorMap,
      newFillTypeMap,
      newGradientMap,
    );
    svgToImage(newSvg, (img) => {
      setImages((prev) =>
        prev.map((i) =>
          i.id === imgObj.id
            ? {
              ...i,
              image: img,
              colorMap: newColorMap,
              fillTypeMap: newFillTypeMap,
              gradientMap: newGradientMap,
            }
            : i,
        ),
      );
    });
  }
  function onColorChange(origColor, newColor, isGradient = false) {
    if (!selectedId) return;

    pushUndoState();
    setRedoStack([]);

    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== selectedId) return img;
        const newFillTypes = { ...img.fillTypeMap, [origColor]: isGradient ? "gradient" : "color" };
        const updatedMap = {
          ...img.colorMap,
          [origColor]: isGradient ? origColor : newColor.hex,
        };
        const newGradientMap = isGradient
          ? {
            ...img.gradientMap,
            [origColor]: { start: newColor.start, end: newColor.end },
          }
          : img.gradientMap;

        updateImageColors(img, updatedMap, newFillTypes, newGradientMap);

        return {
          ...img,
          colorMap: updatedMap,
          fillTypeMap: newFillTypes,
          gradientMap: newGradientMap,
        };
      }),
    );
  }
  function deleteSelectedLayer() {
    if (!selectedId || !selectedType) return;
    pushUndoState();
    setRedoStack([]);

    if (selectedType === "mainImage" || selectedType === "image") {
      setImageObj(null);
      setSelectedId(null);
      setColorKeys([]);
      setColorMap({});
      setFillTypeMap({});
      setGradientMap({});
    } else if (selectedType === "text") {
      setTexts((prev) => prev.filter((t) => t.id !== selectedId));
      setSelectedId(null);
    } else if (selectedType === "extraImage") {
      setImages((prev) => prev.filter((img) => img.id !== selectedId));
      setSelectedId(null);
      setColorKeys([]);
      setColorMap({});
      setFillTypeMap({});
      setGradientMap({});
    } else if (selectedType === "crop") {
      setShowCropRect(false);
      setSelectedId(null);
    } else if (selectedType === "background") {
      setSelectedBg(null);
      setSelectedId(null);
    }
  }

  function handleLayerRightClick(e, item) {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      layerId: item.id,
      layerType: item.type,
    });
  }

  function handleContextMenuDelete() {
    setSelectedId(contextMenu.layerId);
    setSelectedType(contextMenu.layerType);
    setContextMenu({ ...contextMenu, visible: false });
    setTimeout(() => {
      deleteSelectedLayer();
    }, 0);
  }

  function handleClickAnywhere() {
    if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
  }

  useEffect(() => {
    window.addEventListener("click", handleClickAnywhere);
    return () => window.removeEventListener("click", handleClickAnywhere);
  });

  const addText = (text, fontFamily) => {
    pushUndoState();
    const newText = {
      id: Date.now().toString(),
      x: 50,
      y: 50,
      text,
      fontSize: 32,
      fontFamily,
      fill: "#000000",
      draggable: true,
      fontStyle: "normal",
      textDecoration: "",
      shadowColor: "",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 0,
      textTransform: "none",
    };
    setTexts((prev) => [...prev, newText]);
  };

  const updateTextStyle = (key, value) => {
    pushUndoState();
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

  const handleSelect = (id, type) => {
    setSelectedId(id);
    setSelectedType(type);
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
    pushUndoState();
    setIsEditing(false);
    setTexts((prev) => prev.map((t) => (t.id === editingTextId ? { ...t, text: value } : t)));
    setEditingTextId(null);
  };

  useEffect(() => {
    const imageNode = shapeRefs.current["main-image"];
    if (!imageNode || !imageObj || !appliedFilterKey) return;
    const filter = filterStyles[appliedFilterKey];
    if (!filter) return;

    imageNode.filters(filter.filters || []);
    const adjustableProps = ["brightness", "contrast", "hue", "saturation", "value"];
    adjustableProps.forEach((prop) => {
      imageNode[prop](filter[prop] !== undefined ? filter[prop] : 0);
    });
    imageNode.cache();
    imageNode.getLayer().batchDraw();
  }, [appliedFilterKey, imageObj, shapeRefs.current["main-image"]]);

  const applyFilter = (filterKey) => {
    pushUndoState();
    setAppliedFilterKey(filterKey);
    // const imageNode = imageNodeRef.current;
    const imageNode = shapeRefs.current["main-image"];
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
    pushUndoState();
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setUploadedImages((prev) => [...prev, { file, url, id: Date.now().toString() }]);
      if (imageFile === null) {
        setImageFile(file);
      }
    }
  };

  const handleAddUploadedImageToCanvas = (imgObj) => {
    const img = new window.Image();
    img.src = imgObj.url;
    img.onload = () => {
      const newWidth = img.width > stageWidth ? stageWidth : img.width;
      const newHeight = img.height > stageHeight ? stageHeight : img.height;
      const scaleX = newWidth / img.width;
      const scaleY = newHeight / img.height;
      const id = Date.now().toString();
      setImages((prev) => [
        ...prev,
        {
          id,
          image: img,
          x: 50 + prev.length * 30,
          y: 50 + prev.length * 30,
          width: img.width,
          height: img.height,
          scaleX,
          scaleY,
          rotation: 0,
          url: imgObj.url,
          label: "Image",
          type: "extraImage",
        },
      ]);
      setSelectedId(id);
      setSelectedType("extraImage");
    };
  };

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage() || e.target.getParent() === e.target.getStage()) {
      setSelected(false);
    }
    if (e.target === e.target.getStage()) setSelectedId(null);
  };

  const handleCrop = () => {
    pushUndoState();
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
    pushUndoState();
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
    // if (!stageRef.current || !imageObj) return;

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
    pushUndoState();
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
    pushUndoState();
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
    pushUndoState();
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
    pushUndoState();
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

  useEffect(() => {
    const disableScroll = () => {
      document.body.style.overflow = "hidden";
    };
    const enableScroll = () => {
      document.body.style.overflow = "";
    };

    window.addEventListener("dragstart", disableScroll);
    window.addEventListener("dragend", enableScroll);

    return () => {
      window.removeEventListener("dragstart", disableScroll);
      window.removeEventListener("dragend", enableScroll);
    };
  }, []);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    pushUndoState();

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

  function handleContextMenuDuplicate() {
    const item = layerList.find((l) => l.id === contextMenu.layerId);
    if (!item) return;
    pushUndoState();
    if (item.type === "text") {
      const newText = {
        ...item,
        id: Date.now().toString(),
        x: item.x + 20,
        y: item.y + 20,
        label: "Text (copy)",
      };
      setTexts((prev) => [...prev, newText]);
    } else if (item.type === "extraImage" || item.type === "mainImage") {
      // Duplicate image (main or extra)
      const imgObj = images.find((img) => img.id === item.id) || {
        id: "main-image",
        image: imageObj,
        x: imageProps.x,
        y: imageProps.y,
        width: imageProps.width,
        height: imageProps.height,
        scaleX: imageProps.scaleX,
        scaleY: imageProps.scaleY,
        rotation: imageProps.rotation,
        url: imageObj?.src,
        label: "Image",
        type: "mainImage",
      };
      const newId = Date.now().toString();
      setImages((prev) => [
        ...prev,
        {
          ...imgObj,
          id: newId,
          x: imgObj.x + 20,
          y: imgObj.y + 20,
          label: (imgObj.label || "Image") + " (copy)",
        },
      ]);
    }
  }

  function handleContextMenuCopy() {
    const item = layerList.find((l) => l.id === contextMenu.layerId);
    if (!item) return;
    setClipboard({ ...item });
  }

  function handleContextMenuPaste() {
    if (!clipboard) return;
    pushUndoState();
    if (clipboard.type === "text") {
      const newText = {
        ...clipboard,
        id: Date.now().toString(),
        x: clipboard.x + 30,
        y: clipboard.y + 30,
        label: "Text (copy)",
      };
      setTexts((prev) => [...prev, newText]);
    } else if (clipboard.type === "extraImage" || clipboard.type === "mainImage") {
      // Paste image (main or extra)
      const imgObj = images.find((img) => img.id === clipboard.id) || {
        id: "main-image",
        image: imageObj,
        x: imageProps.x,
        y: imageProps.y,
        width: imageProps.width,
        height: imageProps.height,
        scaleX: imageProps.scaleX,
        scaleY: imageProps.scaleY,
        rotation: imageProps.rotation,
        url: imageObj?.src,
        label: "Image",
        type: "mainImage",
      };
      const newId = Date.now().toString();
      setImages((prev) => [
        ...prev,
        {
          ...imgObj,
          id: newId,
          x: imgObj.x + 30,
          y: imgObj.y + 30,
          label: (imgObj.label || "Image") + " (copy)",
        },
      ]);
    }
  }

  function handleContextMenuLock() {
    setLockedLayers((prev) => ({
      ...prev,
      [contextMenu.layerId]: !prev[contextMenu.layerId],
    }));
    setContextMenu({ ...contextMenu, visible: false });
  }

  function handleContextMenuFlip(horizontal = true) {
    const item = layerList.find((l) => l.id === contextMenu.layerId);
    if (!item) return;
    pushUndoState();
    if (item.type === "text") {
      setTexts((prev) =>
        prev.map((t) =>
          t.id === item.id
            ? {
              ...t,
              scaleX: horizontal ? (t.scaleX ? -t.scaleX : -1) : t.scaleX || 1,
              scaleY: !horizontal ? (t.scaleY ? -t.scaleY : -1) : t.scaleY || 1,
            }
            : t,
        ),
      );
    } else if (item.type === "extraImage") {
      setImages((prev) =>
        prev.map((img) =>
          img.id === item.id
            ? {
              ...img,
              scaleX: horizontal ? (img.scaleX ? -img.scaleX : -1) : img.scaleX || 1,
              scaleY: !horizontal ? (img.scaleY ? -img.scaleY : -1) : img.scaleY || 1,
            }
            : img,
        ),
      );
    } else if (item.type === "mainImage") {
      setImageProps((prev) => ({
        ...prev,
        scaleX: horizontal ? (prev.scaleX ? -prev.scaleX : -1) : prev.scaleX || 1,
        scaleY: !horizontal ? (prev.scaleY ? -prev.scaleY : -1) : prev.scaleY || 1,
      }));
    }
    setContextMenu({ ...contextMenu, visible: false });
  }

  function handleContextMenuRotate(direction = "left") {
    const item = layerList.find((l) => l.id === contextMenu.layerId);
    if (!item) return;
    pushUndoState();
    const delta = direction === "left" ? -90 : 90;
    if (item.type === "text") {
      setTexts((prev) =>
        prev.map((t) =>
          t.id === item.id ? { ...t, rotation: ((t.rotation || 0) + delta) % 360 } : t,
        ),
      );
    } else if (item.type === "extraImage") {
      setImages((prev) =>
        prev.map((img) =>
          img.id === item.id ? { ...img, rotation: ((img.rotation || 0) + delta) % 360 } : img,
        ),
      );
    } else if (item.type === "mainImage") {
      setImageProps((prev) => ({
        ...prev,
        rotation: ((prev.rotation || 0) + delta) % 360,
      }));
    }
    setContextMenu({ ...contextMenu, visible: false });
  }

  // Add paste shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        handleContextMenuPaste();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clipboard, texts, images]);

  return (
    <div className="flex w-full bg-gray-100">
      <div className="absolute top-4 left-150 z-50 bg-white p-3 rounded shadow flex gap-2 items-center">
        <label className="font-semibold">Canvas Size:</label>
        <select
          value={canvasSize.label}
          onChange={(e) => {
            pushUndoState();
            const preset = canvasPresets.find((p) => p.label === e.target.value);
            setCanvasSize(preset);
          }}
          className="border rounded px-2 py-1"
        >
          {canvasPresets.map((preset) => (
            <option key={preset.label} value={preset.label}>
              {preset.label}
            </option>
          ))}
        </select>
        {canvasSize.label === "Custom (enter below)" && (
          <>
            <input
              type="number"
              min={1}
              value={customWidth}
              onChange={(e) => {
                pushUndoState();
                setCustomWidth(Number(e.target.value));
              }}
              className="border rounded px-2 py-1 w-20"
              placeholder="Width"
            />
            <span>x</span>
            <input
              type="number"
              min={1}
              value={customHeight}
              onChange={(e) => {
                pushUndoState();
                setCustomHeight(Number(e.target.value));
              }}
              className="border rounded px-2 py-1 w-20"
              placeholder="Height"
            />
          </>
        )}
        <span className="text-gray-500 ml-2">
          ({stageWidth} x {stageHeight})
        </span>
        <label className="ml-4 font-semibold">Canvas Color:</label>
        <input
          type="color"
          value={canvasBgColor}
          onChange={(e) => {
            pushUndoState();
            setCanvasBgColor(e.target.value);
          }}
          className="w-8 h-8 border rounded"
          title="Pick canvas background color"
        />
      </div>
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
        selectedType={selectedType}
        updateTextStyle={updateTextStyle}
        toggleBold={toggleBold}
        toggleItalic={toggleItalic}
        toggleUnderline={toggleUnderline}
        toggleTextTransform={toggleTextTransform}
        onColorChange={onColorChange}
        togglePicker={togglePicker}
        pickerVisibility={pickerVisibility}
        selectedSvgObj={selectedSvgObj}
        handleAddUploadedImageToCanvas={handleAddUploadedImageToCanvas}
        uploadedImages={uploadedImages}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
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
          setOpenColorFilter={setOpenColorFilter}

        />

        {contextMenu.visible && (
          <ContextRightClick
            contextMenu={contextMenu}
            handleContextMenuDuplicate={handleContextMenuDuplicate}
            setContextMenu={setContextMenu}
            handleContextMenuCopy={handleContextMenuCopy}
            handleContextMenuLock={handleContextMenuLock}
            lockedLayers={lockedLayers}
            handleContextMenuFlip={handleContextMenuFlip}
            handleContextMenuRotate={handleContextMenuRotate}
            handleContextMenuDelete={handleContextMenuDelete}
            bringLayerForward={bringLayerForward}
            sendLayerBackward={sendLayerBackward}
          />
        )}

        <div>
          <Stage
            width={stageWidth}
            height={stageHeight}
            onMouseDown={handleStageClick}
            onTouchStart={handleStageClick}
            style={{
              cursor: selected && !showCropRect ? "move" : "default",
              backgroundColor: canvasBgColor,
            }}
            ref={stageRef}
          >
            <Layer>
              <Rect
                x={0}
                y={0}
                width={stageWidth}
                height={stageHeight}
                fill={canvasBgColor}
                listening={false}
              />
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
                  draggable={!showCropRect && !lockedLayers["main-image"]}
                  onClick={() => !showCropRect && handleSelect("main-image", "mainImage")}
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    handleLayerRightClick(
                      { clientX: e.evt.clientX, clientY: e.evt.clientY, preventDefault: () => { } },
                      { id: "main-image", type: "mainImage" },
                    );
                  }}
                  onTransformEnd={(e) => {
                    if (lockedLayers["main-image"]) return;
                    pushUndoState();
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
                    if (lockedLayers["main-image"]) return;
                    pushUndoState();
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
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    handleLayerRightClick(
                      { clientX: e.evt.clientX, clientY: e.evt.clientY, preventDefault: () => { } },
                      { id: "crop-rect", type: "crop" },
                    );
                  }}
                  onTransformEnd={(e) => {
                    pushUndoState();
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
                    pushUndoState();
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
                  draggable={!lockedLayers[text.id]}
                  text={text.textTransform === "uppercase" ? text.text.toUpperCase() : text.text}
                  onClick={() => handleSelect(text.id, "text")}
                  onTap={() => handleSelect(text.id)}
                  onDblClick={() => handleDblClick(text.id)}
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    handleLayerRightClick(
                      { clientX: e.evt.clientX, clientY: e.evt.clientY, preventDefault: () => { } },
                      { id: text.id, type: "text" },
                    );
                  }}
                  onDblTap={() => handleDblClick(text.id)}
                  onDragEnd={(e) => {
                    pushUndoState();
                    setTexts((prev) =>
                      prev.map((t) =>
                        t.id === text.id ? { ...t, x: e.target.x(), y: e.target.y() } : t,
                      ),
                    );
                  }}
                />
              ))}

              {images.map(({ id, image, x, y, ...imgProps }) => (
                <KonvaImage
                  key={id}
                  ref={(node) => (shapeRefs.current[id] = node)}
                  image={image}
                  x={x}
                  y={y}
                  draggable={!lockedLayers[id]}
                  {...imgProps}
                  onClick={() => handleSelect(id, "extraImage")}
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    handleLayerRightClick(
                      { clientX: e.evt.clientX, clientY: e.evt.clientY, preventDefault: () => { } },
                      { id, type: "extraImage" },
                    );
                  }}
                  onDragEnd={(e) => {
                    pushUndoState();
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

      <div>
        <button
          onClick={() => setShowLayerList((prev) => !prev)}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded shadow"
        >
          {showLayerList ? "Hide Layers" : "Show Layers"}
        </button>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="layer-list">
            {(provided) => (
              <>
                {showLayerList && (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="p-2 border rounded w-[240px] bg-white max-h-[400px] overflow-y-auto"
                  >
                    {layerList.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-2 mb-2 bg-gray-100 rounded shadow-sm flex items-center justify-center gap-2 hover:bg-gray-200 cursor-pointer ${selectedId === item.id ? "bg-blue-100" : ""
                              }`}
                            onClick={() => handleSelect(item.id, item.type)}
                            onContextMenu={(e) => handleLayerRightClick(e, item)}
                          >
                            <div className="w-15 h-15 flex items-center justify-center border rounded overflow-hidden bg-white">
                              {item.type === "mainImage" && (
                                <img
                                  src="./frame.jpg"
                                  alt="Main"
                                  className="w-full h-full object-cover"
                                />
                              )}

                              {item.type === "text" && (
                                <span
                                  style={{
                                    fontSize: "12px",
                                    fontFamily: item.fontFamily,
                                    color: item.fill,
                                    fontStyle: item.fontStyle,
                                    textDecoration: item.textDecoration,
                                  }}
                                >
                                  A
                                </span>
                              )}

                              {item.type === "extraImage" && item.url && (
                                <img
                                  src={item.url}
                                  alt="SVG"
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>

                            {/* <div className="text-sm truncate">{item.label}</div> */}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
