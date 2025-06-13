import React, { useState } from "react";
import { filterStyles } from "@/utils/filterStyles";
import { SVG_LIST } from "@/utils/svg_icon_list";
import { SVG_SHAPE_LIST } from "@/utils/svg_shape_list";
import { aspectRatios } from "@/utils/servicesFunction";
import { fontList } from "@/utils/fontList";
import ColorPickerListSvg from "./ColorPickerListSvg";
import { UploadCloud, X } from "lucide-react";

const ITEMS_PER_PAGE = 4;

const Sidebar = ({
  replaceBgOpen,
  setSelectedBg,
  prompt,
  setPrompt,
  generateBackground,
  imageObj,
  openColorFilter,
  applyFilter,
  addSvg,
  selected,
  addText,
  texts,
  showCropRect,
  handleAspectRatioChange,
  cropAspectRatio,
  setSelected,
  setOpenColorFilter,
  originalImageObj,
  setCropArea,
  setImageProps,
  setImageObj,
  setShowCropRect,
  handleCrop,
  selectedId,
  selectedType,
  updateTextStyle,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleTextTransform,
  onColorChange,
  togglePicker,
  pickerVisibility,
  selectedSvgObj,
  handleAddUploadedImageToCanvas,
  uploadedImages,
  handleFileChange,
  fileInputRef,
}) => {
  const [activeTab, setActiveTab] = useState("shapes");
  const [currentPage, setCurrentPage] = useState(0);

  const getPaginatedItems = () => {
    const list = activeTab === "shapes" ? SVG_SHAPE_LIST : activeTab === "icons" ? SVG_LIST : [];

    const start = currentPage * ITEMS_PER_PAGE;
    return list.slice(start, start + ITEMS_PER_PAGE);
  };

  const totalPages =
    activeTab === "texts"
      ? 1
      : Math.ceil(
          (activeTab === "shapes"
            ? SVG_SHAPE_LIST.length
            : activeTab === "icons"
            ? SVG_LIST.length
            : 0) / ITEMS_PER_PAGE,
        );

  const getAspectClass = (value) => {
    if (value === 1) return "aspect-square";
    if (value === 9 / 16) return "aspect-[9/16]";
    if (value === 16 / 9) return "aspect-[16/9]";
    if (value === 5 / 4) return "aspect-[5/4]";
    if (value === 4 / 5) return "aspect-[4/5]";
    if (value === 4 / 3) return "aspect-[4/3]";
    if (value === 3 / 4) return "aspect-[3/4]";
    if (value === 3 / 2) return "aspect-[3/2]";
    if (value === 2 / 3) return "aspect-[2/3]";
    return "w-full h-full";
  };

  const bgImage = [
    { img: "./01.jpg" },
    { img: "./02.jpg" },
    { img: "./03.jpg" },
    { img: "./04.jpg" },
    { img: "./05.jpg" },
    { img: "./06.jpg" },
    { img: "./07.jpg" },
    { img: "./08.jpg" },
    { img: "./08.jpg" },
    { img: "./10.jpg" },
  ];

  return (
    <div>
      <div className="w-100">
        {replaceBgOpen && (
          <div className="h-auto p-6 bg-white">
            <div
              className="w-full max-w-lg h-64 mb-6 rounded-lg border border-gray-300 bg-white"
              style={{
                backgroundImage: selected ? `url(${selected})` : "none",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            >
              <p className="text-center pt-24 text-white font-bold text-xl bg-black/40">
                {selected ? "Background Set" : "Select an Image"}
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
                    selected === obj?.img ? "border-blue-500" : "border-transparent"
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

        {openColorFilter === "color_filter" && (
          <div className="h-[1000px] overflow-hidden border-r pr-4 bg-white">
            <div className="flex items-center justify-between p-4 border-b ">
              <h2 className="text-xl font-bold mb-4">Color filter</h2>
              <X className="cursor-pointer" onClick={() => setOpenColorFilter("")} />
            </div>
            <div className="h-[1000px] overflow-auto grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4 p-6 ">
              {Object.keys(filterStyles).map((filterKey, i) => (
                <button
                  key={i}
                  className="bg-black text-black p-2 rounded-md border-black hover:bg-gray-200 hover:text-black transition-colors duration-300"
                  style={{ backgroundColor: filterStyles[filterKey].color }}
                  onClick={() => applyFilter(filterKey)}
                >
                  {filterKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        )}

        {openColorFilter === "add_element" && (
          <div className="h-[1000px] overflow-hidden border-r pr-4 bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold mb-4">SVG Library</h2>
              <X className="cursor-pointer" onClick={() => setOpenColorFilter("")} />
            </div>

            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveTab("icons")}
                className={`px-4 py-2 rounded ${
                  activeTab === "icons" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                Icons
              </button>
              <button
                onClick={() => setActiveTab("shapes")}
                className={`px-4 py-2 rounded ${
                  activeTab === "shapes" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                Shapes
              </button>
              <button
                onClick={() => setActiveTab("texts")}
                className={`px-4 py-2 rounded ${
                  activeTab === "texts" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                Add Text
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`px-4 py-2 rounded ${
                  activeTab === "media" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                Uploaded Media
              </button>
            </div>

            <div className="h-[1000px] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3 mb-6 relative">
                {/* SVG / ICON Buttons */}
                {["shapes", "icons"].includes(activeTab) &&
                  getPaginatedItems().map(({ id, name, url }) => (
                    <button
                      key={id}
                      onClick={() => addSvg(url)}
                      className="border rounded hover:border-blue-500 p-1"
                      title={name}
                    >
                      <img
                        src={url}
                        alt={name}
                        className="w-full h-14 object-contain"
                        onError={(e) => (e.currentTarget.src = "")}
                      />
                    </button>
                  ))}

                {activeTab === "texts" && (
                  <>
                    {[
                      ["Thanks a Bunch", "Monoton"],
                      ["Hello Stylish", "Lobster"],
                      ["Elegant Text", "Pacifico"],
                      ["Elegant Title", "Playfair Display"],
                      ["Simple Body", "Poppins"],
                      ["Plain Text", "Roboto"],
                      ["Beautiful!", "Dancing Script,cursive"],
                      ["BIRTHDAY BASH", "Anton"],
                    ].map(([text, font]) => (
                      <button
                        key={font}
                        onClick={async () => {
                          await document.fonts.load("16px '" + font.split(",")[0] + "'");
                          addText(text, font);
                        }}
                        className="border rounded bg-purple-600 text-white hover:bg-purple-700 p-2"
                      >
                        {font}
                      </button>
                    ))}
                  </>
                )}

                {totalPages > 1 && (
                  <div className="col-span-2 flex justify-between items-center mt-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                      disabled={currentPage === 0}
                      className="text-sm px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-sm">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="text-sm px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Text Styling Panel (Optional) */}
                {selectedType === "text" && selectedId && (
                  <div className="col-span-2 p-4 max-w-5xl mx-auto">
                    <div className="flex flex-wrap gap-3 items-center border p-4 rounded-lg shadow mb-6 bg-white">
                      <select
                        onChange={(e) => updateTextStyle("fontFamily", e.target.value)}
                        value={texts.find((t) => t.id === selectedId)?.fontFamily || ""}
                        className="border p-2 rounded"
                      >
                        <option value="">Font</option>
                        {fontList.map((f) => (
                          <option key={f.name} value={f.name} style={{ fontFamily: f.style }}>
                            {f.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={10}
                        max={150}
                        className="border p-2 w-24 rounded"
                        value={texts.find((t) => t.id === selectedId)?.fontSize || 40}
                        onChange={(e) => updateTextStyle("fontSize", parseInt(e.target.value))}
                      />

                      <input
                        type="color"
                        className="w-10 h-10 rounded border"
                        value={texts.find((t) => t.id === selectedId)?.fill || "#000000"}
                        onChange={(e) => updateTextStyle("fill", e.target.value)}
                      />

                      <button
                        onClick={toggleBold}
                        className="border px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        Bold
                      </button>
                      <button
                        onClick={toggleItalic}
                        className="border px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        Italic
                      </button>
                      <button
                        onClick={toggleUnderline}
                        className="border px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        Underline
                      </button>
                      <button
                        onClick={toggleTextTransform}
                        className="border px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        Uppercase
                      </button>
                    </div>
                  </div>
                )}

                {selectedType === "extraImage" && selectedId && (
                  <ColorPickerListSvg
                    selectedId={selectedId}
                    colorKeys={selectedSvgObj?.colorKeys || []}
                    fillTypeMap={selectedSvgObj?.fillTypeMap || {}}
                    onColorChange={onColorChange}
                    colorMap={selectedSvgObj?.colorMap || {}}
                    gradientMap={selectedSvgObj?.gradientMap || {}}
                    togglePicker={togglePicker}
                    pickerVisibility={pickerVisibility}
                  />
                )}

                {activeTab === "media" && (
                  <div className="col-span-3 grid grid-cols-3 gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className="p-6 text-black rounded-lg hover:bg-blue-700 cursor-pointer flex flex-col items-center justify-center"
                      style={{
                        borderColor: "#ccc",
                        backgroundColor: "#f9f9f9",
                        borderRadius: "0.375rem",
                        borderWidth: "1px",
                        borderStyle: "dashed",
                      }}
                    >
                      <UploadCloud /> Upload Image
                    </div>
                    {uploadedImages?.map((img) => (
                      <div
                        key={img.id}
                        className="border w-30 h-30 rounded-md cursor-pointer hover:border-blue-500"
                        onClick={() => handleAddUploadedImageToCanvas(img)}
                        title="Add to canvas"
                      >
                        <img
                          src={img.url}
                          alt="thumb"
                          className="w-full h-full object-cover rounded"
                          style={{ background: "#eee" }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {openColorFilter === "crop" && showCropRect && (
          <div className="w-full h-[1000px] max-w-md mx-auto bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-3 gap-4">
              {aspectRatios.map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => handleAspectRatioChange(value)}
                  className={`relative flex flex-col items-center justify-center p-2 border rounded-lg ${
                    cropAspectRatio === value
                      ? "border-blue-500 ring-2 ring-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src="/frame.jpg"
                      alt="preview"
                      className={`object-cover ${getAspectClass(value)}`}
                    />
                  </div>
                  <span className="text-xs mt-1">{label}</span>
                  {cropAspectRatio === value && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px]">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
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
                    setOpenColorFilter("crop");
                  }
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={!originalImageObj}
              >
                {showCropRect ? "Cancel Crop" : "Crop Image"}
              </button>
              <button
                onClick={handleCrop}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Apply Crop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
