"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { Images } from "@/utils/Images";

export default function ImageEditor() {
  const [loadedImages, setLoadedImages] = useState([]);
  const [highlightImage, setHighlightImage] = useState(null);
  const [highlightVisible, setHighlightVisible] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null); // 🔥 background image

  const highlightRef = useRef(null);
  const canvasRef = useRef(null);
  const processCanvasRef = useRef(null);

  const BLACK_THRESHOLD = 50;
  const COLOR_TOLERANCE = 20;

  // 🔥 Load background image (frame.jpg)
  useEffect(() => {
    const bg = new window.Image();
    bg.src = "/frame.jpg"; // ✅ Make sure frame.jpg is in your public folder
    bg.onload = () => setBackgroundImage(bg);
  }, []);

  const removeBlackBackground = (img) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r < BLACK_THRESHOLD && g < BLACK_THRESHOLD && b < BLACK_THRESHOLD) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      const newImg = new window.Image();
      newImg.onload = () => resolve(newImg);
      newImg.src = canvas.toDataURL();
    });
  };

  useEffect(() => {
    const loadImages = async () => {
      const entries = Object.entries(Images.segments);
      const promises = entries.map(([name, base64]) => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "Anonymous";
          img.src = `data:image/png;base64,${base64}`;
          img.onload = async () => {
            const processedImg = await removeBlackBackground(img);
            resolve({ name, image: processedImg });
          };
          img.onerror = reject;
        });
      });

      try {
        const results = await Promise.all(promises);
        setLoadedImages(results);
      } catch (error) {
        console.error("Image loading failed:", error);
      }
    };

    loadImages();
  }, []);

  const maxWidth = Math.max(
    ...loadedImages.map(({ image }) => image.width || 0),
    backgroundImage?.width || 300,
  );
  const maxHeight = Math.max(
    ...loadedImages.map(({ image }) => image.height || 0),
    backgroundImage?.height || 300,
  );

  const isSimilarColor = (r1, g1, b1, r2, g2, b2, tolerance) => {
    return (
      Math.abs(r1 - r2) <= tolerance &&
      Math.abs(g1 - g2) <= tolerance &&
      Math.abs(b1 - b2) <= tolerance
    );
  };

  const handleMouseMove = (evt) => {
    const stage = evt.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    for (let i = loadedImages.length - 1; i >= 0; i--) {
      const imageObj = loadedImages[i].image;

      canvas.width = imageObj.width;
      canvas.height = imageObj.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageObj, 0, 0);

      const { x, y } = pointer;
      const px = Math.floor(x);
      const py = Math.floor(y);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (px < 0 || py < 0 || px >= imageData.width || py >= imageData.height) continue;

      const index = (py * imageData.width + px) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      const a = imageData.data[index + 3];

      if (a !== 0) {
        console.log("Hovered image index:", i);

        // 👉 Pass image and index
        highlightMatchingPixels(imageObj, { r, g, b }, i);
        break; // ✅ Break loop after match
      }
    }

    fadeOutHighlight();
  };

  const highlightMatchingPixels = (imageObj, targetRGBA) => {
    const tempCanvas = processCanvasRef.current;
    const ctx = tempCanvas.getContext("2d");

    tempCanvas.width = imageObj.width;
    tempCanvas.height = imageObj.height;

    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(imageObj, 0, 0);

    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (
        a > 0 &&
        isSimilarColor(r, g, b, targetRGBA.r, targetRGBA.g, targetRGBA.b, COLOR_TOLERANCE)
      ) {
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 128;
      } else {
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const img = new window.Image();
    img.onload = () => {
      setHighlightImage(img);
      setHighlightVisible(true);
      fadeInHighlight();
    };
    img.src = tempCanvas.toDataURL();
  };

  const fadeInHighlight = () => {
    if (highlightRef.current) {
      new Konva.Tween({
        node: highlightRef.current,
        duration: 0.4,
        opacity: 1,
        easing: Konva.Easings.EaseInOut,
      }).play();
    }
  };

  const fadeOutHighlight = () => {
    if (highlightRef.current) {
      new Konva.Tween({
        node: highlightRef.current,
        duration: 1,
        opacity: 0,
        easing: Konva.Easings.EaseInOut,
      }).play();
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white flex flex-col items-center">
      {/* Hidden canvases */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <canvas ref={processCanvasRef} style={{ display: "none" }} />

      {loadedImages.length === 0 ? (
        <p>Loading images...</p>
      ) : (
        <Stage
          width={maxWidth}
          height={maxHeight}
          onMouseMove={handleMouseMove}
          onMouseLeave={fadeOutHighlight}
        >
          <Layer>
            {/* 🔥 Background image is rendered first */}
            {backgroundImage && <KonvaImage image={backgroundImage} x={0} y={0} />}

            {loadedImages.map(({ name, image }) => (
              <KonvaImage key={name} image={image} />
            ))}

            {highlightImage && <KonvaImage ref={highlightRef} image={highlightImage} opacity={0} />}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
