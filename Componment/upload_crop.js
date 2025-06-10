"use client";

import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from "react-konva";

export default function ImageEditor() {
  const fileInputRef = useRef(null);
  const stageRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [originalImageObj, setOriginalImageObj] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [selected, setSelected] = useState(false);
  const [showCropRect, setShowCropRect] = useState(false);

  const [lastCropData, setLastCropData] = useState(null);
  const [cropAspectRatio, setCropAspectRatio] = useState(null);

  const cropRectRef = useRef();
  const cropTransformerRef = useRef();
  const transformerRef = useRef();
  const imageNodeRef = useRef();

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
      setCropAspectRatio(null);
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
        rotation: originalImageDisplayProps.rotation,
      });

      setShowCropRect(false);
      setSelected(false);

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

  const handleAspectRatioChange = (e) => {
    const ratioValue = e.target.value;
    let newAspectRatio = null;

    if (ratioValue !== "none") {
      const [widthStr, heightStr] = ratioValue.split(":");
      newAspectRatio = Number(widthStr) / Number(heightStr);
    }
    setCropAspectRatio(newAspectRatio);
    if (imageObj) {
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
      let imageClientRect = null;
      if (imageNode) {
          imageClientRect = imageNode.getClientRect();
      }

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
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
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
          <>
            <select
              onChange={handleAspectRatioChange}
              className="px-4 py-2 border rounded-lg"
              value={cropAspectRatio === null ? "none" : `${cropAspectRatio * 16}:16`} 
            >
              <option value="none">Free</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="9:16">9:16</option>
              <option value="16:9">16:9</option>
              <option value="5:4">5:4</option>
              <option value="4:5">4:5</option>
              <option value="4:3">4:3</option>
              <option value="3:4">3:4</option>
              <option value="3:2">3:2</option>
              <option value="2:3">2:3</option>
            </select>
            <button
              onClick={handleCrop}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Apply Crop
            </button>
          </>
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
                  }}
                  onDragEnd={(e) => {
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
                      if (newBox.width * newBox.scaleX < 30 || newBox.height * newBox.scaleY < 30) {
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
                    const cropHeight = cropRectRef.current.height() * cropRectRef.current.scaleY();

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
                  keepRatio={cropAspectRatio !== null}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 30 || newBox.height < 30) {
                      return oldBox;
                    }

                    const imageNode = imageNodeRef.current;
                    if (!imageNode) return newBox;

                    const imageClientRect = imageNode.getClientRect();

                    let constrainedNewBox = { ...newBox };

                    if (cropAspectRatio) {
                      const ratio = cropAspectRatio;
                      const width = newBox.width;
                      const height = newBox.height;

                      const is=newBox.width < oldBox.width?true:false

                      if (is) {
                        constrainedNewBox.width = height * ratio;
                      } else {
                        constrainedNewBox.height = width / ratio;
                      }
                      
                    }

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
        </Stage>
      </div>
    </div>
  );
}