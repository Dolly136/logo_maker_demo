"use client";

import { filterStyles } from "@/utils/filterStyles";
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
  const cropRectRef = useRef();
  const cropTransformerRef = useRef();
  const transformerRef = useRef();
  const imageNodeRef = useRef();

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

      // Apply all filter settings dynamically
      const adjustableProps = ["brightness", "contrast", "hue", "saturation", "value"];
      adjustableProps.forEach((prop) => {
        imageNode[prop](filter[prop] !== undefined ? filter[prop] : 0);
      });

      imageNode.cache();
      imageNode.getLayer().batchDraw();
    }
  };

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

  const handleOpenColorFilter = () => {
    setOpenColorFilter(true);
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
      {replaceBgOpen && (
        <div className="h-auto p-6 bg-white">
          <div
            className="w-full max-w-lg h-64 mb-6 rounded-lg border border-gray-300 bg-white"
            style={{
              backgroundImage: selectedBg ? `url(${selectedBg})` : "none",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <p className="text-center pt-24 text-white font-bold text-xl bg-black/40">
              {selectedBg ? "Background Set" : "Select an Image"}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {bgImage?.map((obj, index) => (
              <img
                key={index}
                src={obj?.img}
                height={100}
                width={100}
                alt={`bg-${index}`}
                className={`cursor-pointer border-4 rounded-md ${
                  selectedBg === obj?.img ? "border-blue-500" : "border-transparent"
                }`}
                onClick={() => {
                  const img = new window.Image();
                  img.src = obj?.img;
                  img.onload = () => setSelectedBg(img);
                }}
              />
            ))}
          </div>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter prompt for replace background"
            className="my-4 p-4 border w-full"
          />
          <button
            onClick={generateBackground}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            disabled={!imageObj || !prompt.trim()}
          >
            Generate background
          </button>
        </div>
      )}
      {openColorFilter && (
        <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4 p-6 bg-white">
          {Object.keys(filterStyles).map((filterKey, i) => (
            <button
              key={i}
              className="bg-black text-white p-2 rounded-md"
              onClick={() => applyFilter(filterKey)}
            >
              {filterKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      )}
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upload Image
          </button>
          <button
            onClick={() => {
              if (originalImageObj) {
                setShowCropRect((prev) => {
                  const isEnteringCropMode = !prev;
                  if (isEnteringCropMode) {
                    setImageObj(originalImageObj);
                    if (lastCropData) {
                      setImageProps(lastCropData.imagePropsAtCrop);
                      setCropArea({
                        x: lastCropData.cropRect.x,
                        y: lastCropData.cropRect.y,
                        width: lastCropData.cropRect.width,
                        height: lastCropData.cropRect.height,
                      });
                    } else {
                      let newWidth = originalImageObj.width;
                      let newHeight = originalImageObj.height;
                      if (
                        originalImageObj.width > stageWidth ||
                        originalImageObj.height > stageHeight
                      ) {
                        const widthRatio = stageWidth / originalImageObj.width;
                        const heightRatio = stageHeight / originalImageObj.height;
                        const scale = Math.min(widthRatio, heightRatio);
                        newWidth = originalImageObj.width * scale;
                        newHeight = originalImageObj.height * scale;
                      }
                      setImageProps({
                        x: (stageWidth - newWidth) / 2,
                        y: (stageHeight - newHeight) / 2,
                        scaleX: newWidth / originalImageObj.width,
                        scaleY: newHeight / originalImageObj.height,
                        rotation: 0,
                        width: originalImageObj.width,
                        height: originalImageObj.height,
                      });
                      setCropArea({
                        x: (stageWidth - newWidth) / 2,
                        y: (stageHeight - newHeight) / 2,
                        width: newWidth,
                        height: newHeight,
                      });
                    }
                  }
                  return !prev;
                });
                setSelected(false);
              }
            }}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            disabled={!originalImageObj}
          >
            {showCropRect ? "Cancel Crop" : "Crop Image"}
          </button>
          {showCropRect && (
            <button
              onClick={handleCrop}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Apply Crop
            </button>
          )}
          <button
            onClick={removeBackground}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            disabled={!imageFile}
          >
            Remove Background
          </button>
          <button
            onClick={replaceBgPopUpOpen}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            Replace background
          </button>
          <button
            onClick={upscaleImage}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            Upscale image
          </button>
          <button
            onClick={handleOpenColorFilter}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            disabled={!imageObj}
          >
            Color filter
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={!imageObj}
          >
            Download Image
          </button>
        </div>
        <button onClick={addText} className="p-2 m-2 bg-blue-600 text-white rounded">
          Add Text
        </button>
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
            // style={{ cursor: selected && !showCropRect ? "move" : "default" }}
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
    </div>
  );
}
