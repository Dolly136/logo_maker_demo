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
