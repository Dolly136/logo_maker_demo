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
import DragListView from "react-drag-listview";
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
  const [imageObj, setImageObj] = useState([]);
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

  console.log(layerList, "layerList");

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
      if (!selectedId || !selectedType) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        const item = layerList.find((l) => l.id === selectedId);
        if (item) setClipboard({ ...item });
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const item = layerList.find((l) => l.id === selectedId);
        if (!item) return;
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

      if (e.key === "Delete") {
        e.preventDefault();
        deleteSelectedLayer();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setLockedLayers((prev) => ({
          ...prev,
          [selectedId]: !prev[selectedId],
        }));
      }

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

  useEffect(() => {
    layerList.forEach((item) => {
      const node = shapeRefs.current[item.id];
      if (node) node.moveToTop();
    });
    stageRef.current?.batchDraw();
  }, [layerList]);

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

      const imgObj = {
        id: Date.now().toString(),
        image: img,
        label: "Image",
        type: "mainImage",
        width: img.width,
        height: img.height,
      };

      const centeredX = (stageWidth - newWidth) / 2;
      const centeredY = (stageHeight - newHeight) / 2;

      setOriginalImageObj(imgObj);
      setImageObj([imgObj]);
      setImageProps({
        0: {
          x: centeredX,
          y: centeredY,
          scaleX: newWidth / img.width,
          scaleY: newHeight / img.height,
          rotation: 0,
          width: img.width,
          height: img.height,
        },
      });
      setCropArea({
        x: centeredX,
        y: centeredY,
        width: newWidth,
        height: newHeight,
      });
      setLastCropData(null);
      setSelectedId(null);
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

  const [croppingIdx, setCroppingIdx] = useState(null);
  const [originalImageObjs, setOriginalImageObjs] = useState({}); 
  const [lastCropDatas, setLastCropDatas] = useState({}); 

  const initiateCropMode = (idx) => {
    if (!imageObj[idx] || showCropRect) return;

    setShowCropRect(true);
    setCroppingIdx(idx);

    if (lastCropDatas[idx] && originalImageObjs[idx]) {
      setImageObj((prev) => prev.map((img, i) => (i === idx ? originalImageObjs[idx] : img)));
      setImageProps((prev) => ({
        ...prev,
        [idx]: lastCropDatas[idx].imagePropsAtCrop,
      }));
      setCropArea(lastCropDatas[idx].cropRect);
    } else {
      setOriginalImageObjs((prev) => ({
        ...prev,
        [idx]: imageObj[idx],
      }));

      const img = imageObj[idx];
      let newWidth = img.width;
      let newHeight = img.height;
      const widthRatio = stageWidth / img.width;
      const heightRatio = stageHeight / img.height;
      const scale = Math.min(widthRatio, heightRatio);
      newWidth = img.width * scale;
      newHeight = img.height * scale;

      const centeredX = (stageWidth - newWidth) / 2;
      const centeredY = (stageHeight - newHeight) / 2;

      setImageProps((prev) => ({
        ...prev,
        [idx]: {
          x: centeredX,
          y: centeredY,
          scaleX: newWidth / img.width,
          scaleY: newHeight / img.height,
          rotation: 0,
          width: img.width,
          height: img.height,
        },
      }));

      setCropArea({
        x: centeredX,
        y: centeredY,
        width: newWidth,
        height: newHeight,
      });
    }

    setSelected(false);
    setOpenColorFilter("crop");
  };

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
      setImageObj((prev) => prev.filter((img) => img.id !== selectedId));
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
    console.log(item, "item");
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
    const file = e.target.files[0];
    if (!file) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";

    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      const id = Date.now().toString();

      let newWidth = img.width;
      let newHeight = img.height;

      const widthRatio = stageWidth / img.width;
      const heightRatio = stageHeight / img.height;
      const scale = Math.min(widthRatio, heightRatio);

      newWidth = img.width * scale;
      newHeight = img.height * scale;

      const centeredX = (stageWidth - newWidth) / 2;
      const centeredY = (stageHeight - newHeight) / 2;

      setUploadedImages((prev) => [...prev, { id, file, url }]);

      setImageObj((prev) => {
        if (prev.length === 0) {
          return [
            {
              id,
              image: img,
              label: "Image",
              type: "mainImage",
              width: img.width,
              height: img.height,
            },
          ];
        }
        return prev;
      });

      setImageProps((prev) => {
        if (Object.keys(prev).length === 0) {
          return {
            0: {
              x: centeredX,
              y: centeredY,
              scaleX: newWidth / img.width,
              scaleY: newHeight / img.height,
              rotation: 0,
              width: img.width,
              height: img.height,
            },
          };
        }
        return prev;
      });
    };
  };

  useEffect(() => {
    const newLayerList = [];

    if (selectedBg) {
      newLayerList.push({ id: "bg", type: "background", label: "Background" });
    }

    imageObj.forEach((img) => {
      console.log(img, "img");
      newLayerList.push({
        id: img.id,
        type: img.type,
        label: img.label,
        url: img,
      });
    });

    texts.forEach((text) => {
      newLayerList.push({ ...text, id: text.id, type: "text", label: "Text" });
    });

    images.forEach((img) => {
      newLayerList.push({ ...img, id: img.id, type: "extraImage", label: "Svg" });
    });

    setLayerList(newLayerList);
  }, [selectedBg, imageObj, texts, images, showCropRect]);

  const handleAddUploadedImageToCanvas = (img) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = img.url;

    image.onload = () => {
      const newImageObj = {
        id: Date.now().toString(),
        image,
        label: "Uploaded Image",
        type: "mainImage",
        width: image.width,
        height: image.height,
      };
      setImageObj((prev) => [...prev, newImageObj]);
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
    if (croppingIdx === null) return;

    const imageNode = shapeRefs.current[croppingIdx];
    const cropNode = shapeRefs.current["crop-rect"];
    if (!imageNode || !cropNode || !imageObj[croppingIdx]) return;

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

    const currentImageData = imageObj[croppingIdx];
    const originalImg = currentImageData.image;

    const absTransform = imageNode.getAbsoluteTransform().copy().invert();
    const topLeft = absTransform.point({ x: cropX, y: cropY });
    const bottomRight = absTransform.point({
      x: cropX + cropWidth,
      y: cropY + cropHeight,
    });

    const srcX = Math.max(0, topLeft.x);
    const srcY = Math.max(0, topLeft.y);
    const srcWidth = Math.min(originalImg.width - srcX, bottomRight.x - topLeft.x);
    const srcHeight = Math.min(originalImg.height - srcY, bottomRight.y - topLeft.y);

    // Safety check
    if (srcWidth <= 0 || srcHeight <= 0) {
      console.warn("Invalid crop dimensions");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = srcWidth;
    canvas.height = srcHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(originalImg, srcX, srcY, srcWidth, srcHeight, 0, 0, srcWidth, srcHeight);

    const croppedImage = new window.Image();
    croppedImage.src = canvas.toDataURL();

    croppedImage.onload = () => {
      const updatedImageObj = {
        ...currentImageData,
        image: croppedImage,
        width: croppedImage.width,
        height: croppedImage.height,
      };

      // Replace in imageObj
      setImageObj((prev) => prev.map((img, idx) => (idx === croppingIdx ? updatedImageObj : img)));

      // Update its props
      setImageProps((prev) => ({
        ...prev,
        [croppingIdx]: {
          x: cropX,
          y: cropY,
          scaleX: 1,
          scaleY: 1,
          width: croppedImage.width,
          height: croppedImage.height,
          rotation: imagePropsBeforeCrop.rotation,
        },
      }));

      setShowCropRect(false);
      setSelectedId(null);
      setCroppingIdx(null);

      // Store last crop data
      setLastCropDatas((prev) => ({
        ...prev,
        [croppingIdx]: {
          cropRect: {
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight,
          },
          imagePropsAtCrop: imagePropsBeforeCrop,
        },
      }));
    };
  };

  const handleAspectRatioChange = (value) => {
    pushUndoState();
    let newAspectRatio = null;

    if (value === "original" && imageProps[croppingIdx]?.width && imageProps[croppingIdx]?.height) {
      newAspectRatio = imageProps[croppingIdx].width / imageProps[croppingIdx].height;
    } else if (value !== "none") {
      const [widthStr, heightStr] = value.split(":");
      newAspectRatio = Number(widthStr) / Number(heightStr);
    }

    setCropAspectRatio(newAspectRatio);

    if (!imageObj[croppingIdx]) return;

    const props = imageProps[croppingIdx];
    let currentImageDisplayWidth = props.width * props.scaleX;
    let currentImageDisplayHeight = props.height * props.scaleY;

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

    // Use the correct image node for croppingIdx
    const imageNode = shapeRefs.current[croppingIdx];
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
        setImageObj([finalImage]);
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

  function handleContextMenuDuplicate() {
    const item = layerList.find((l) => l.id === contextMenu.layerId);
    if (!item) return;

    pushUndoState();

    const newId = Date.now().toString();

    if (item.type === "text") {
      const original = texts.find((t) => t.id === item.id);
      if (!original) return;

      const newText = {
        ...original,
        id: newId,
        x: original.x + 20,
        y: original.y + 20,
        label: (original.label || "Text") + " (copy)",
      };

      setTexts((prev) => [...prev, newText]);
      setLayerList((prev) => [...prev, { id: newId, type: "text", label: newText.label }]);
    } else if (item.type === "extraImage") {
      const original = images.find((img) => img.id === item.id);
      if (!original) return;

      const newImage = {
        ...original,
        id: newId,
        x: original.x + 20,
        y: original.y + 20,
        label: (original.label || "Image") + " (copy)",
      };

      setImages((prev) => [...prev, newImage]);
      setLayerList((prev) => [...prev, { id: newId, type: "extraImage", label: newImage.label }]);
    } else if (item.type === "mainImage") {
      const original = imageObj.find((img) => img.id === item.id);
      if (!original) return;

      const newMainImage = {
        ...original,
        id: newId,
        x: (original.x || 0) + 20,
        y: (original.y || 0) + 20,
        label: (original.label || "Image") + " (copy)",
        type: "mainImage",
      };

      setImageObj((prev) => [...prev, newMainImage]);
      setLayerList((prev) => [
        ...prev,
        { id: newId, type: "mainImage", label: newMainImage.label },
      ]);
    }
  }

  function handleContextMenuCopy() {
    const item = layerList.find((l) => l.id === contextMenu.layerId);
    if (!item) return;

    let clipboardItem = null;

    if (item.type === "text") {
      clipboardItem = texts.find((t) => t.id === item.id);
    } else if (item.type === "extraImage") {
      clipboardItem = images.find((img) => img.id === item.id);
    } else if (item.type === "mainImage") {
      clipboardItem = imageObj.find((img) => img.id === item.id);
    }

    if (clipboardItem) {
      setClipboard({ ...clipboardItem });
    }
  }

  function handleContextMenuPaste() {
    if (!clipboard) return;

    pushUndoState();

    const newId = Date.now().toString();

    if (clipboard.type === "text") {
      const newText = {
        ...clipboard,
        id: newId,
        x: clipboard.x + 30,
        y: clipboard.y + 30,
        label: (clipboard.label || "Text") + " (copy)",
      };

      setTexts((prev) => [...prev, newText]);
      setLayerList((prev) => [...prev, { id: newId, type: "text", label: newText.label }]);
    } else if (clipboard.type === "extraImage") {
      const newImage = {
        ...clipboard,
        id: newId,
        x: clipboard.x + 30,
        y: clipboard.y + 30,
        label: (clipboard.label || "Image") + " (copy)",
      };

      setImages((prev) => [...prev, newImage]);
      setLayerList((prev) => [...prev, { id: newId, type: "extraImage", label: newImage.label }]);
    } else if (clipboard.type === "mainImage") {
      const newMainImage = {
        ...clipboard,
        id: newId,
        x: (clipboard.x || 0) + 30,
        y: (clipboard.y || 0) + 30,
        label: (clipboard.label || "Image") + " (copy)",
        type: "mainImage",
      };

      setImageObj((prev) => [...prev, newMainImage]);
      setLayerList((prev) => [
        ...prev,
        { id: newId, type: "mainImage", label: newMainImage.label },
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
        [item.id]: {
          ...prev[item.id],
          scaleX: horizontal
            ? prev[item.id]?.scaleX
              ? -prev[item.id].scaleX
              : -1
            : prev[item.id]?.scaleX || 1,
          scaleY: !horizontal
            ? prev[item.id]?.scaleY
              ? -prev[item.id].scaleY
              : -1
            : prev[item.id]?.scaleY || 1,
        },
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
        [item.id]: {
          ...prev[item.id],
          rotation: ((prev[item.id]?.rotation || 0) + delta + 360) % 360,
        },
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

  const onDragEnd = (fromIndex, toIndex) => {
    const actualFromIndex = layerList.length - 1 - fromIndex;
    const actualToIndex = layerList.length - 1 - toIndex;

    const updatedList = [...layerList];
    const [movedItem] = updatedList.splice(actualFromIndex, 1);
    updatedList.splice(actualToIndex, 0, movedItem);

    setLayerList(updatedList);
  };

  const dragProps = {
    onDragEnd,
    nodeSelector: "li",
    handleSelector: ".drag-handle",
  };

  console.log(layerList, "layerList");

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
        <input
          type="text"
          value={canvasBgColor}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(val)) {
              pushUndoState();
              setCanvasBgColor(val);
            } else {
              setCanvasBgColor(val);
            }
          }}
          className="ml-2 w-24 px-2 py-1 border rounded bg-gray-50 text-gray-700"
          style={{ fontFamily: "monospace" }}
          title="Hex color value"
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
          imageFile={imageFile}
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

              {imageObj?.map((img, idx) => (
                <KonvaImage
                  key={idx}
                  image={img.image}
                  ref={(node) => (shapeRefs.current[img.id] = node)}
                  {...imageProps[img.id]}
                  x={imageProps[img.id]?.x || 0}
                  y={imageProps[img.id]?.y || 0}
                  scaleX={imageProps[img.id]?.scaleX || 1}
                  scaleY={imageProps[img.id]?.scaleY || 1}
                  rotation={imageProps[img.id]?.rotation || 0}
                  width={imageProps[img.id]?.width || img.width}
                  height={imageProps[img.id]?.height || img.height}
                  draggable={!showCropRect && !lockedLayers[img.id]}
                  onClick={() => !showCropRect && handleSelect(img.id, "mainImage")}
                  onDblClick={() => initiateCropMode(idx)}
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    handleLayerRightClick(
                      { clientX: e.evt.clientX, clientY: e.evt.clientY, preventDefault: () => {} },
                      { id: img.id, type: "mainImage" },
                    );
                  }}
                  onTransformEnd={() => {
                    if (lockedLayers[img.id]) return;
                    pushUndoState();
                    const node = shapeRefs.current[img.id];
                    setImageProps((prev) => ({
                      ...prev,
                      [img.id]: {
                        x: node.x(),
                        y: node.y(),
                        width: node.width(),
                        height: node.height(),
                        scaleX: node.scaleX(),
                        scaleY: node.scaleY(),
                        rotation: node.rotation(),
                      },
                    }));
                  }}
                  onDragEnd={() => {
                    if (lockedLayers[img.id]) return;
                    pushUndoState();
                    const node = shapeRefs.current[img.id];
                    setImageProps((prev) => ({
                      ...prev,
                      [img.id]: {
                        ...prev[img.id],
                        x: node.x(),
                        y: node.y(),
                      },
                    }));
                  }}
                />
              ))}

              {showCropRect && (
                <Rect
                  ref={(node) => (shapeRefs.current["crop-rect"] = node)}
                  {...cropArea}
                  fill="rgba(0,0,0,0.4)"
                  stroke="yellow"
                  strokeWidth={2}
                  draggable
                  onClick={() => handleSelect("crop-rect", "crop")}
                  onTransformEnd={() => {
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
                  onDragEnd={() => {
                    const node = shapeRefs.current["crop-rect"];
                    setCropArea({
                      x: node.x(),
                      y: node.y(),
                      width: node.width(),
                      height: node.height(),
                    });
                  }}
                />
              )}

              {texts.map((text, index) => (
                <KonvaText
                  key={index}
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
                      { clientX: e.evt.clientX, clientY: e.evt.clientY, preventDefault: () => {} },
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

              {images.map(({ id, image, x, y, ...imgProps }, index) => (
                <KonvaImage
                  key={index}
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
                      { clientX: e.evt.clientX, clientY: e.evt.clientY, preventDefault: () => {} },
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

        <DragListView {...dragProps}>
          <ul className="space-y-2">
            {[...layerList].reverse().map((layer, index) => (
              <li
                key={index}
                className="bg-white p-3 border rounded shadow flex justify-between items-center cursor-move drag-handle"
              >
                <span className="drag-handle">☰</span>
                <div className="flex-1 px-2">
                  <strong className="capitalize">{layer.type}</strong>
                  <div className="text-sm text-gray-500">{layer.id}</div>
                </div>
              </li>
            ))}
          </ul>
        </DragListView>
      </div>
    </div>
  );
}
