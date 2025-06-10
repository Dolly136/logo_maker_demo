import React, { useState } from "react";
import { filterStyles } from "@/utils/filterStyles";
import { SVG_LIST } from "@/utils/svg_icon_list";
import { SVG_SHAPE_LIST } from "@/utils/svg_shape_list";
import { aspectRatios } from "@/utils/servicesFunction";

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
  updateFontFamily,
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
  updateTextStyle,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleTextTransform,
}) => {
  const [activeTab, setActiveTab] = useState("shapes");
  console.log(openColorFilter, "openColorFilter");

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
  const fontList = [
    { name: "Roboto Slab", value: "Roboto Slab, serif", style: "Roboto Slab, serif" },
    {
      name: "Playfair Display",
      value: "Playfair Display, serif",
      style: "Playfair Display, serif",
    },
    { name: "Noto Serif", value: "'Noto Serif', serif", style: "'Noto Serif', serif" },
    { name: "Crimson Text", value: "'Crimson Text', serif", style: "'Crimson Text', serif" },
    { name: "Cormorant", value: "'Cormorant', serif", style: "'Cormorant', serif" },
    { name: "Abril Fatface", value: "Abril Fatface, serif", style: "Abril Fatface, serif" },
    { name: "Chicle", value: "Chicle, serif", style: "Chicle, serif" },
    { name: "Shrikhand", value: "Shrikhand, serif", style: "Shrikhand, serif" },
    {
      name: "Cinzel Decorative",
      value: "Cinzel Decorative, serif",
      style: "Cinzel Decorative, serif",
    },
    { name: "Rye", value: "Rye, serif", style: "Rye, serif" },
    { name: "Arvo", value: "Arvo, serif", style: "Arvo, serif" },
    { name: "Crete Round", value: "Crete Round, serif", style: "Crete Round, serif" },
    { name: "Josefin Slab", value: "Josefin Slab, serif", style: "Josefin Slab, serif" },
    { name: "Alfa Slab One", value: "Alfa Slab One, serif", style: "Alfa Slab One, serif" },
    { name: "Slabo 27px", value: "Slabo 27px, serif", style: "Slabo 27px, serif" },
    { name: "Ultra", value: "Ultra, serif", style: "Ultra, serif" },
    { name: "Vast Shadow", value: "Vast Shadow, serif", style: "Vast Shadow, serif" },
    { name: "Caudex", value: "Caudex, serif", style: "Caudex, serif" },
    { name: "Patua One", value: "Patua One, serif", style: "Patua One, serif" },
    { name: "Bree Serif", value: "Bree Serif, serif", style: "Bree Serif, serif" },
    { name: "Roboto", value: "Roboto, sans-serif", style: "Roboto, sans-serif" },
    { name: "Open Sans", value: "Open Sans, sans-serif", style: "Open Sans, sans-serif" },
    { name: "Lato", value: "Lato, sans-serif", style: "Lato, sans-serif" },
    { name: "Montserrat", value: "Montserrat, sans-serif", style: "Montserrat, sans-serif" },
    { name: "Poppins", value: "Poppins, sans-serif", style: "Poppins, sans-serif" },
    { name: "Inter", value: "Inter, sans-serif", style: "Inter, sans-serif" },
    { name: "Raleway", value: "Raleway, sans-serif", style: "Raleway, sans-serif" },
    { name: "Nunito", value: "Nunito, sans-serif", style: "Nunito, sans-serif" },
    { name: "Mulish", value: "Mulish, sans-serif", style: "Mulish, sans-serif" },
    { name: "Bebas Neue", value: "Bebas Neue, sans-serif", style: "Bebas Neue, sans-serif" },
    { name: "Teko", value: "Teko, sans-serif", style: "Teko, sans-serif" },
    { name: "Lilita One", value: "Lilita One, sans-serif", style: "Lilita One, sans-serif" },
    {
      name: "Archivo Black",
      value: "Archivo Black, sans-serif",
      style: "Archivo Black, sans-serif",
    },
    { name: "Passion One", value: "Passion One, sans-serif", style: "Passion One, sans-serif" },
    {
      name: "Racing Sans One",
      value: "Racing Sans One, sans-serif",
      style: "Racing Sans One, sans-serif",
    },
    { name: "Titan One", value: "Titan One, sans-serif", style: "Titan One, sans-serif" },
    { name: "Federo", value: "Federo, sans-serif", style: "Federo, sans-serif" },
    { name: "Ubuntu", value: "Ubuntu, sans-serif", style: "Ubuntu, sans-serif" },
    { name: "Quicksand", value: "Quicksand, sans-serif", style: "Quicksand, sans-serif" },
    { name: "Josefin Sans", value: "Josefin Sans, sans-serif", style: "Josefin Sans, sans-serif" },
    { name: "Bungee", value: "Bungee, display", style: "Bungee, display" },
    { name: "Anton", value: "Anton, display", style: "Anton, display" },
    { name: "Oswald", value: "Oswald, display", style: "Oswald, display" },
    { name: "Righteous", value: "Righteous, display", style: "Righteous, display" },
    { name: "Lobster", value: "Lobster, display", style: "Lobster, display" },
    { name: "Pacifico", value: "Pacifico, display", style: "Pacifico, display" },
    { name: "Fredoka", value: "Fredoka, display", style: "Fredoka, display" },
    { name: "Monoton", value: "Monoton, display", style: "Monoton, display" },
    {
      name: "Fredericka the Great",
      value: "Fredericka the Great, display",
      style: "Fredericka the Great, display",
    },
    { name: "Black Ops One", value: "Black Ops One, display", style: "Black Ops One, display" },
    { name: "Ruslan Display", value: "Ruslan Display, display", style: "Ruslan Display, display" },
    { name: "Orbitron", value: "Orbitron, display", style: "Orbitron, display" },
    { name: "Bangers", value: "Bangers, display", style: "Bangers, display" },
    {
      name: "Cinzel Decorative",
      value: "Cinzel Decorative, display",
      style: "Cinzel Decorative, display",
    },
    { name: "Chewy", value: "Chewy, display", style: "Chewy, display" },
    { name: "Creepster", value: "Creepster, display", style: "Creepster, display" },
    { name: "Faster One", value: "Faster One, display", style: "Faster One, display" },
    {
      name: "Zilla Slab Highlight",
      value: "Zilla Slab Highlight, display",
      style: "Zilla Slab Highlight, display",
    },
    { name: "Unica One", value: "Unica One, display", style: "Unica One, display" },
    { name: "Sonsie One", value: "Sonsie One, display", style: "Sonsie One, display" },
    { name: "Fira Code", value: "Fira Code, monospace", style: "Fira Code, monospace" },
    {
      name: "JetBrains Mono",
      value: "JetBrains Mono, monospace",
      style: "JetBrains Mono, monospace",
    },
    {
      name: "Source Code Pro",
      value: "Source Code Pro, monospace",
      style: "Source Code Pro, monospace",
    },
    { name: "Inconsolata", value: "Inconsolata, monospace", style: "Inconsolata, monospace" },
    { name: "Roboto Mono", value: "Roboto Mono, monospace", style: "Roboto Mono, monospace" },
    { name: "Space Mono", value: "Space Mono, monospace", style: "Space Mono, monospace" },
    {
      name: "IBM Plex Mono",
      value: "IBM Plex Mono, monospace",
      style: "IBM Plex Mono, monospace",
    },
    { name: "Cousine", value: "Cousine, monospace", style: "Cousine, monospace" },
    { name: "PT Mono", value: "PT Mono, monospace", style: "PT Mono, monospace" },
    { name: "Ubuntu Mono", value: "Ubuntu Mono, monospace", style: "Ubuntu Mono, monospace" },
    { name: "DM Mono", value: "DM Mono, monospace", style: "DM Mono, monospace" },
    { name: "Lekton", value: "Lekton, monospace", style: "Lekton, monospace" },
    { name: "Syne Mono", value: "Syne Mono, monospace", style: "Syne Mono, monospace" },
    {
      name: "Courier Prime",
      value: "'Courier Prime', monospace",
      style: "'Courier Prime', monospace",
    },
    { name: "Cutive Mono", value: "'Cutive Mono', monospace", style: "'Cutive Mono', monospace" },
    {
      name: "Share Tech Mono",
      value: "'Share Tech Mono', monospace",
      style: "'Share Tech Mono', monospace",
    },
    { name: "Oxygen Mono", value: "'Oxygen Mono', monospace", style: "'Oxygen Mono', monospace" },
    { name: "VT323", value: "'VT323', monospace", style: "'VT323', monospace" },
    {
      name: "Overpass Mono",
      value: "'Overpass Mono', monospace",
      style: "'Overpass Mono', monospace",
    },
    {
      name: "Anonymous Pro",
      value: "'Anonymous Pro', monospace",
      style: "'Anonymous Pro', monospace",
    },
    { name: "Yellowtail", value: "Yellowtail, cursive", style: "Yellowtail, cursive" },
    {
      name: "Gloria Hallelujah",
      value: "Gloria Hallelujah, cursive",
      style: "Gloria Hallelujah, cursive",
    },
    {
      name: "Cedarville Cursive",
      value: "Cedarville Cursive, cursive",
      style: "Cedarville Cursive, cursive",
    },
    { name: "Style Script", value: "Style Script, cursive", style: "Style Script, cursive" },
    { name: "Cookie", value: '"Cookie", cursive', style: '"Cookie", cursive' },
    { name: "Coming Soon", value: '"Coming Soon", cursive', style: '"Coming Soon", cursive' },
    { name: "Great Vibes", value: '"Great Vibes", cursive', style: '"Great Vibes", cursive' },
    { name: "Luckiest Guy", value: '"Luckiest Guy", cursive', style: '"Luckiest Guy", cursive' },
    { name: "Rock Salt", value: '"Rock Salt", cursive', style: '"Rock Salt", cursive' },
    { name: "Zeyada", value: '"Zeyada", cursive', style: '"Zeyada", cursive' },
    {
      name: "La Belle Aurore",
      value: '"La Belle Aurore", cursive',
      style: '"La Belle Aurore", cursive',
    },
    {
      name: "Give You Glory",
      value: '"Give You Glory", cursive',
      style: '"Give You Glory", cursive',
    },
    { name: "Reenie Beanie", value: '"Reenie Beanie", cursive', style: '"Reenie Beanie", cursive' },
    { name: "Kristi", value: '"Kristi", cursive', style: '"Kristi", cursive' },
    {
      name: "Just Another Hand",
      value: '"Just Another Hand", cursive',
      style: '"Just Another Hand", cursive',
    },
    {
      name: "Homemade Apple",
      value: '"Homemade Apple", cursive',
      style: '"Homemade Apple", cursive',
    },
    { name: "Handlee", value: '"Handlee", cursive', style: '"Handlee", cursive' },
    {
      name: "Architects Daughter",
      value: '"Architects Daughter", cursive',
      style: '"Architects Daughter", cursive',
    },
    { name: "Allura", value: '"Allura", cursive', style: '"Allura", cursive' },
    {
      name: "Covered By Your Grace",
      value: '"Covered By Your Grace", cursive',
      style: '"Covered By Your Grace", cursive',
    },
  ];

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
          <div className="h-[1000px] overflow-auto grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4 p-6 bg-white">
            {Object.keys(filterStyles).map((filterKey, i) => (
              <button
                key={i}
                className="bg-black text-black p-2 rounded-md border-black "
                onClick={() => applyFilter(filterKey)}
              >
                {filterKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        )}

        {openColorFilter === "add_element" && (
          <div className="h-[1000px] overflow-hidden border-r pr-4 bg-white">
            <h2 className="text-xl font-bold mb-4">SVG Library</h2>

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
            </div>

            <div className="h-[1000px] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(activeTab === "shapes"
                  ? SVG_SHAPE_LIST
                  : activeTab === "icons"
                  ? SVG_LIST
                  : []
                ).map(({ id, name, url }) => (
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
                    <button
                      onClick={() => addText("Thanks a Bunch", "Monoton")}
                      className="border rounded bg-purple-600 text-white hover:bg-purple-700 p-2"
                    >
                      Monoton
                    </button>
                    <button
                      onClick={() => addText("Hello Stylish", "Lobster")}
                      className="border rounded bg-purple-600 text-white hover:bg-purple-700 p-2"
                    >
                      Lobster
                    </button>
                    <button
                      onClick={() => addText("Elegant Text", "Pacifico")}
                      className="border rounded bg-purple-600 text-white hover:bg-purple-700 p-2"
                    >
                      Pacifico
                    </button>
                    <button
                      onClick={() => addText("Elegant Title", "Playfair Display")}
                      className="border rounded bg-purple-600 text-white hover:bg-purple-700 p-2"
                    >
                      Playfair Display
                    </button>
                    <button
                      onClick={() => addText("Simple Body", "Poppins")}
                      className="border rounded bg-purple-600 text-white hover:bg-purple-700 p-2"
                    >
                      Poppins
                    </button>
                    <button
                      onClick={() => addText("Plain Text", "Roboto")}
                      className="border rounded bg-purple-600 text-white hover:bg-purple-700 p-2"
                    >
                      Roboto
                    </button>
                    <button
                      onClick={async () => {
                        await document.fonts.load("16px 'Dancing Script'");
                        addText("Beautiful!", "Dancing Script,cursive");
                      }}
                      className="border px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Add Dancing Script Text
                    </button>
                    <button
                      onClick={() => addText("BIRTHDAY BASH", "Anton")}
                      className="border rounded bg-purple-600 text-white hover:bg-purple-700 p-2 mb-4 ml-2"
                    >
                      Add Bold Title
                    </button>
                    {selectedId && (
                      <div className="p-4 max-w-5xl mx-auto">
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
                  </>
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
