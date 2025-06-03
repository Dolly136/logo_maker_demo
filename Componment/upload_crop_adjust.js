"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from "react-konva";
import Konva from "konva";

export default function ImageEditor() {
  const fileInputRef = useRef(null);
  const stageRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [originalImageObj, setOriginalImageObj] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [selected, setSelected] = useState(false);
  const [showCropRect, setShowCropRect] = useState(false);
  const [openAdjust, setOpenAdjust] = useState(false);
  const [activeFilter, setActiveFilter] = useState("none");

  const [filterProps, setFilterProps] = useState({
    brightness: 0,
    contrast: 0,
    sepia: 0,
    grayscale: 0,
    hue: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    opacity: 1, 
    sharpness: 0, 
    vignetteIntensity: 0, 
    grainIntensity: 0,
    tintExposureColor: "#000000", 
    tintExposureIntensity: 0, 
  });

  const [lastCropData, setLastCropData] = useState(null);

  const cropRectRef = useRef();
  const cropTransformerRef = useRef();
  const transformerRef = useRef();
  const imageNodeRef = useRef();
  const vignetteOverlayRef = useRef(); 
  const grainOverlayRef = useRef();

  const stageWidth = 750;
  const stageHeight = 750;

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

const applyFilters = useCallback(() => {
  const imageNode = imageNodeRef.current;
  if (!imageNode) return;

  imageNode.clearCache();
  imageNode.cache();

  const currentFilters = [];

  imageNode.brightness(0);
  imageNode.contrast(0);
  imageNode.hue(0);
  imageNode.saturation(0);
  imageNode.value(0);
  imageNode.enhance(0);
  imageNode.alpha(1);
  imageNode.opacity(filterProps.opacity);

  if (filterProps.brightness !== 0) {
    currentFilters.push(Konva.Filters.Brighten);
    imageNode.brightness(filterProps.brightness);
  }

  if (filterProps.contrast !== 0) {
    currentFilters.push(Konva.Filters.Contrast);
    imageNode.contrast(filterProps.contrast);
  }

  if (filterProps.sepia === 1) {
    currentFilters.push(Konva.Filters.Sepia);
  }

  if (filterProps.grayscale === 1) {
    currentFilters.push(Konva.Filters.Grayscale);
  }

  if (
    filterProps.hue !== 0 ||
    filterProps.saturation !== 0 ||
    filterProps.exposure !== 0
  ) {
    currentFilters.push(Konva.Filters.HSV);
    imageNode.hue(filterProps.hue);
    imageNode.saturation(filterProps.saturation);
    imageNode.value(filterProps.exposure);
  }

  if (filterProps.sharpness !== 0) {
    currentFilters.push(Konva.Filters.Enhance);
    imageNode.enhance(filterProps.sharpness / 100);
  }

  if (filterProps.temperature !== 0) {
    const tempFactor = 3;
    redAdjust += filterProps.temperature * tempFactor;
    blueAdjust -= filterProps.temperature * tempFactor;

    // Clamp values to safe range
    redAdjust = Math.max(-255, Math.min(255, redAdjust));
    blueAdjust = Math.max(-255, Math.min(255, blueAdjust));
  }

  if (filterProps.tintExposureIntensity > 0) {
    const hexToRgb = (hex) => {
      const bigint = parseInt(hex.slice(1), 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    };
    const tintRgb = hexToRgb(filterProps.tintExposureColor);
    currentFilters.push(Konva.Filters.RGBA);
    imageNode.alpha(filterProps.tintExposureIntensity); // 0–1
  } 

  imageNode.filters(currentFilters);
  imageNode.getLayer().batchDraw();

  const imageClientRect = imageNode.getClientRect();
  const vignetteOverlay = vignetteOverlayRef.current;
  if (vignetteOverlay) {
    vignetteOverlay.x(imageClientRect.x);
    vignetteOverlay.y(imageClientRect.y);
    vignetteOverlay.width(imageClientRect.width);
    vignetteOverlay.height(imageClientRect.height);

    if (filterProps.vignetteIntensity > 0) {
      const intensity = filterProps.vignetteIntensity;
      const gradient = vignetteOverlay.getContext()._context.createRadialGradient(
        imageClientRect.width / 2,
        imageClientRect.height / 2,
        Math.min(imageClientRect.width, imageClientRect.height) * 0.2,
        imageClientRect.width / 2,
        imageClientRect.height / 2,
        Math.min(imageClientRect.width, imageClientRect.height) * 0.7
      );
      gradient.addColorStop(0, `rgba(0,0,0,0)`);
      gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
      vignetteOverlay.fill(gradient);
      vignetteOverlay.visible(true);
    } else {
      vignetteOverlay.visible(false);
    }
    vignetteOverlay.getLayer().batchDraw();
  }

  // ---- GRAIN OVERLAY ----
  const grainOverlay = grainOverlayRef.current;
  if (grainOverlay) {
    grainOverlay.x(imageClientRect.x);
    grainOverlay.y(imageClientRect.y);
    grainOverlay.width(imageClientRect.width);
    grainOverlay.height(imageClientRect.height);

    if (filterProps.grainIntensity > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = imageClientRect.width;
      canvas.height = imageClientRect.height;
      const ctx = canvas.getContext("2d");
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() * 2 - 1) * 255;
        data[i] = grain;
        data[i + 1] = grain;
        data[i + 2] = grain;
        data[i + 3] = 255 * filterProps.grainIntensity;
      }

      ctx.putImageData(imageData, 0, 0);

      const grainImage = new window.Image();
      grainImage.src = canvas.toDataURL();
      grainImage.onload = () => {
        grainOverlay.fillPatternImage(grainImage);
        grainOverlay.fillPatternRepeat("no-repeat");
        grainOverlay.visible(true);
        grainOverlay.getLayer().batchDraw();
      };
    } else {
      grainOverlay.visible(false);
      grainOverlay.getLayer().batchDraw();
    }
  }
}, [filterProps]);



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
        x: (stageWidth - newWidth) / 2, // Center image on stage
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
      setActiveFilter("none");
      setFilterProps({
        brightness: 0,
        contrast: 0,
        sepia: 0,
        grayscale: 0,
        hue: 0,
        saturation: 0,
        exposure: 0,
        temperature: 0,
        opacity: 1,
        sharpness: 0,
        vignetteIntensity: 0,
        grainIntensity: 0,
        tintExposureColor: "#000000",
        tintExposureIntensity: 0,
      });
    };

    return () => {
      if (img.src) URL.revokeObjectURL(img.src);
    };
  }, [imageFile, stageWidth, stageHeight]);

  useEffect(() => {
    if (imageObj && imageNodeRef.current) {
      applyFilters();
    }
  }, [imageObj, filterProps, imageProps, applyFilters]);

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
    // If the click target is the stage itself or its parent (layer), deselect the image
    if (e.target === e.target.getStage() || e.target.getParent() === e.target.getStage()) {
      setSelected(false);
    }
  };

  const handleCrop = () => {
    const imageNode = imageNodeRef.current;
    const cropNode = cropRectRef.current;

    if (!imageNode || !cropNode || !originalImageObj) return;

    const originalImageDisplayProps = {
      x: imageNode.x(),
      y: imageNode.y(),
      scaleX: imageNode.scaleX(),
      scaleY: imageNode.scaleY(),
      rotation: imageNode.rotation(),
      width: imageNode.width(),
      height: imageNode.height(),
    };

    const cropDisplayX = cropNode.x();
    const cropDisplayY = cropNode.y();
    const cropDisplayWidth = cropNode.width() * cropNode.scaleX();
    const cropDisplayHeight = cropNode.height() * cropNode.scaleY();

    const imageAbsoluteTransform = imageNode.getAbsoluteTransform().copy();
    imageAbsoluteTransform.invert();

    const p1 = imageAbsoluteTransform.point({ x: cropDisplayX, y: cropDisplayY });
    const p2 = imageAbsoluteTransform.point({
      x: cropDisplayX + cropDisplayWidth,
      y: cropDisplayY + cropDisplayHeight,
    });

    let sourceX = p1.x;
    let sourceY = p1.y;
    let sourceWidth = p2.x - p1.x;
    let sourceHeight = p2.y - p1.y;

    const finalSourceX = Math.max(0, sourceX);
    const finalSourceY = Math.max(0, sourceY);
    const finalSourceWidth = Math.min(originalImageObj.width - finalSourceX, sourceWidth);
    const finalSourceHeight = Math.min(originalImageObj.height - finalSourceY, sourceHeight);

    const canvas = document.createElement("canvas");
    canvas.width = finalSourceWidth;
    canvas.height = finalSourceHeight;

    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.drawImage(
      originalImageObj,
      finalSourceX,
      finalSourceY,
      finalSourceWidth,
      finalSourceHeight,
      0,
      0,
      finalSourceWidth,
      finalSourceHeight,
    );
    ctx.restore();

    const croppedImage = new window.Image();
    croppedImage.src = canvas.toDataURL();
    croppedImage.onload = () => {
      setImageObj(croppedImage); 
      const newScaleX = cropDisplayWidth / croppedImage.width;
      const newScaleY = cropDisplayHeight / croppedImage.height;

      setImageProps({
        x: cropDisplayX,
        y: cropDisplayY,
        scaleX: newScaleX,
        scaleY: newScaleY,
        width: croppedImage.width,
        height: croppedImage.height,
        rotation: originalImageDisplayProps.rotation, // Maintain original rotation
      });

      setShowCropRect(false);
      setSelected(false);
      setActiveFilter("none");
      setFilterProps({
        brightness: 0,
        contrast: 0,
        sepia: 0,
        grayscale: 0,
        hue: 0,
        saturation: 0,
        exposure: 0,
        temperature: 0,
        opacity: 1,
        sharpness: 0,
        vignetteIntensity: 0,
        grainIntensity: 0,
        tintExposureColor: "#000000",
        tintExposureIntensity: 0,
      });

      setLastCropData({
        cropRect: {
          x: cropDisplayX,
          y: cropDisplayY,
          width: cropDisplayWidth,
          height: cropDisplayHeight,
        },
        imagePropsAtCrop: originalImageDisplayProps,
      });
    };
  };

  const handleDownload = () => {
    if (!stageRef.current || !imageObj) return;

    const cropRectNode = cropRectRef.current;
    const cropTransformerNode = cropTransformerRef.current;
    const transformerNode = transformerRef.current;
    const vignetteOverlayNode = vignetteOverlayRef.current;
    const grainOverlayNode = grainOverlayRef.current;

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
    if (vignetteOverlayNode) {
      vignetteOverlayNode.visible(false);
    }
    if (grainOverlayNode) {
      grainOverlayNode.visible(false);
    }

    applyFilters();

    stageRef.current.batchDraw();

    requestAnimationFrame(() => {
      const dataURL = stageRef.current.toDataURL({
        mimeType: "image/png",
        pixelRatio: 2, // Increase pixel ratio for higher quality download
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
      if (vignetteOverlayNode) vignetteOverlayNode.visible(filterProps.vignetteIntensity > 0);
      if (grainOverlayNode) grainOverlayNode.visible(filterProps.grainIntensity > 0);
      stageRef.current.batchDraw();
    });
  };

  const handleSliderChange = (filterName, value) => {
    setActiveFilter("custom"); // Indicate custom adjustments
    setFilterProps((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const renderFilterSliders = () => {
    if (!imageObj || showCropRect) {
      return null;
    }

    return (
      <div className="w-full max-w-xl mb-4 px-4 grid grid-cols-2 gap-4">
        <div className="col-span-2 text-lg font-semibold text-gray-800">
          Light & Color Adjustments
        </div>

        <div>
          <label htmlFor="brightness-slider" className="block text-sm font-medium text-gray-700">
            Brightness ({filterProps.brightness.toFixed(2)})
          </label>
          <input
            id="brightness-slider"
            type="range"
            min={-1} 
            max={1}
            step={0.01}
            value={filterProps.brightness}
            onChange={(e) => handleSliderChange("brightness", parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="contrast-slider" className="block text-sm font-medium text-gray-700">
            Contrast ({filterProps.contrast.toFixed(0)})
          </label>
          <input
            id="contrast-slider"
            type="range"
            min={-100} 
            max={100}
            step={1}
            value={filterProps.contrast}
            onChange={(e) => handleSliderChange("contrast", parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="saturation-slider" className="block text-sm font-medium text-gray-700">
            Saturation ({filterProps.saturation.toFixed(2)})
          </label>
          <input
            id="saturation-slider"
            type="range"
            min={-2} 
            max={2}
            step={0.01}
            value={filterProps.saturation}
            onChange={(e) => handleSliderChange("saturation", parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="temperature-slider" className="block text-sm font-medium text-gray-700">
            Temperature ({filterProps.temperature.toFixed(0)})
          </label>
          <input
            id="temperature-slider"
            type="range"
            min={-50} 
            max={50}
            step={1}
            value={filterProps.temperature}
            onChange={(e) => handleSliderChange("temperature", parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="exposure-slider" className="block text-sm font-medium text-gray-700">
            Exposure ({filterProps.exposure.toFixed(2)})
          </label>
          <input
            id="exposure-slider"
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={filterProps.exposure}
            onChange={(e) => handleSliderChange("exposure", parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="hue-slider" className="block text-sm font-medium text-gray-700">
            Hue ({filterProps.hue.toFixed(0)}°)
          </label>
          <input
            id="hue-slider"
            type="range"
            min={-180} 
            max={180}
            step={1}
            value={filterProps.hue}
            onChange={(e) => handleSliderChange("hue", parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="opacity-slider" className="block text-sm font-medium text-gray-700">
            Opacity ({filterProps.opacity.toFixed(2)})
          </label>
          <input
            id="opacity-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={filterProps.opacity}
            onChange={(e) => handleSliderChange("opacity", parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="sharpness-slider" className="block text-sm font-medium text-gray-700">
            Sharpness ({filterProps.sharpness.toFixed(0)})
          </label>
          <input
            id="sharpness-slider"
            type="range"
            min={-100}
            max={100}
            step={1}
            value={filterProps.sharpness}
            onChange={(e) => handleSliderChange("sharpness", parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="vignette-slider" className="block text-sm font-medium text-gray-700">
            Vignette ({filterProps.vignetteIntensity.toFixed(2)})
          </label>
          <input
            id="vignette-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={filterProps.vignetteIntensity}
            onChange={(e) => handleSliderChange("vignetteIntensity", parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="grain-slider" className="block text-sm font-medium text-gray-700">
            Grain ({filterProps.grainIntensity.toFixed(2)})
          </label>
          <input
            id="grain-slider"
            type="range"
            min={0}
            max={0.5} 
            step={0.01}
            value={filterProps.grainIntensity}
            onChange={(e) => handleSliderChange("grainIntensity", parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="col-span-2">
          <label htmlFor="tint-color-picker" className="block text-sm font-medium text-gray-700">
            Tint Color
          </label>
          <input
            id="tint-color-picker"
            type="color"
            value={filterProps.tintExposureColor}
            onChange={(e) => handleSliderChange("tintExposureColor", e.target.value)}
            className="h-10 w-full cursor-pointer"
          />
          <label
            htmlFor="tint-intensity-slider"
            className="block text-sm font-medium text-gray-700 mt-2"
          >
            Tint Intensity ({filterProps.tintExposureIntensity.toFixed(2)})
          </label>
          <input
            id="tint-intensity-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={filterProps.tintExposureIntensity}
            onChange={(e) =>
              handleSliderChange("tintExposureIntensity", parseFloat(e.target.value))
            }
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="sepia-toggle"
            checked={filterProps.sepia === 1}
            onChange={(e) => handleSliderChange("sepia", e.target.checked ? 1 : 0)}
            className="mr-2"
          />
          <label htmlFor="sepia-toggle" className="text-sm font-medium text-gray-700">
            Sepia
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="grayscale-toggle"
            checked={filterProps.grayscale === 1}
            onChange={(e) => handleSliderChange("grayscale", e.target.checked ? 1 : 0)}
            className="mr-2"
          />
          <label htmlFor="grayscale-toggle" className="text-sm font-medium text-gray-700">
            Grayscale
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full bg-gray-100">
      {imageObj && !showCropRect && openAdjust && (
        <div className="h-auto p-6 bg-white">
          <>{renderFilterSliders()}</>
        </div>
      )}
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 ">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div className="flex space-x-4 mb-6 flex-wrap justify-center">
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
                    setActiveFilter("none");
                    setFilterProps({
                      brightness: 0,
                      contrast: 0,
                      sepia: 0,
                      grayscale: 0,
                      hue: 0,
                      saturation: 0,
                      exposure: 0,
                      temperature: 0,
                      opacity: 1,
                      sharpness: 0,
                      vignetteIntensity: 0,
                      grainIntensity: 0,
                      tintExposureColor: "#000000",
                      tintExposureIntensity: 0,
                    });

                    if (lastCropData) {
                      // If there's previous crop data, restore image and crop area to that state
                      setImageProps(lastCropData.imagePropsAtCrop);
                      setCropArea({
                        x: lastCropData.cropRect.x,
                        y: lastCropData.cropRect.y,
                        width: lastCropData.cropRect.width,
                        height: lastCropData.cropRect.height,
                      });
                    } else {
                      // Otherwise, initialize image and crop area based on original image fit
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
          <button
            onClick={() => setOpenAdjust(true)}
            disabled={!imageObj}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-700 disabled:bg-gray"
          >
            Adjust
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
            onClick={handleDownload}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={!imageObj}
          >
            Download Image
          </button>
        </div>

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
                    onTransformEnd={(e) => {
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
                      // Filters will be re-applied via useEffect due to imageProps change
                    }}
                    onDragEnd={(e) => {
                      const node = imageNodeRef.current;
                      setImageProps((prevProps) => ({
                        ...prevProps,
                        x: node.x(),
                        y: node.y(),
                      }));
                      // Filters will be re-applied via useEffect due to imageProps change
                    }}
                    // Removed individual filter props here, as they are managed by applyFilters()
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
              {imageObj && (
                <>
                  <Rect
                    ref={vignetteOverlayRef}
                    listening={false} // Prevent interaction
                    visible={false} 
                  />
                  <Rect
                    ref={grainOverlayRef}
                    listening={false} 
                    opacity={1} 
                    visible={false}
                  />
                </>
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
