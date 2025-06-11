import React from "react";

const Topbar = ({
  fileInputRef,
  handleFileChange,
  originalImageObj,
  setShowCropRect,
  setImageObj,
  setImageProps,
  setCropArea,
  lastCropData,
  setSelected,
  showCropRect,
  removeBackground,
  imageFile,
  replaceBgPopUpOpen,
  upscaleImage,
  handleOpenColorFilter,
  imageObj,
  handleDownload,
  stageHeight,
  stageWidth,
  setOpenColorFilter,
}) => {
  return (
    <div>
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
            if (originalImageObj && !showCropRect) {
              setShowCropRect(true);
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

                if (originalImageObj.width > stageWidth || originalImageObj.height > stageHeight) {
                  const widthRatio = stageWidth / originalImageObj.width;
                  const heightRatio = stageHeight / originalImageObj.height;
                  const scale = Math.min(widthRatio, heightRatio);
                  newWidth = originalImageObj.width * scale;
                  newHeight = originalImageObj.height * scale;
                }

                const centeredX = (stageWidth - newWidth) / 2;
                const centeredY = (stageHeight - newHeight) / 2;

                setImageProps({
                  x: centeredX,
                  y: centeredY,
                  scaleX: newWidth / originalImageObj.width,
                  scaleY: newHeight / originalImageObj.height,
                  rotation: 0,
                  width: originalImageObj.width,
                  height: originalImageObj.height,
                });

                setCropArea({
                  x: centeredX,
                  y: centeredY,
                  width: newWidth,
                  height: newHeight,
                });
              }

              setSelected(false);
              setOpenColorFilter("crop");
            }
          }}
          className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
          disabled={!originalImageObj}
        >
          Crop Image
        </button>

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
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          Upscale image
        </button>
        <button
          onClick={() => handleOpenColorFilter("color_filter")}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          disabled={!imageObj}
        >
          Color filter
        </button>
        <button
          onClick={() => handleOpenColorFilter("add_element")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add element
        </button>
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          // disabled={!imageObj}
        >
          Download Image
        </button>
      </div>
    </div>
  );
};

export default Topbar;
