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
  handleCrop,
  removeBackground,
  imageFile,
  replaceBgPopUpOpen,
  upscaleImage,
  handleOpenColorFilter,
  imageObj,
  handleDownload,
  addText,
  stageHeight,
  stageWidth
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
          onClick={() => handleOpenColorFilter("color_filter")}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          disabled={!imageObj}
        >
          Color filter
        </button>
        <button
          onClick={() => handleOpenColorFilter("add_element")}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Add element
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
    </div>
  );
};

export default Topbar;
