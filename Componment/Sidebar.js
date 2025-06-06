import React, { useState } from "react";
import { filterStyles } from "@/utils/filterStyles";
import { SVG_LIST } from "@/utils/svg_icon_list";
import { SVG_SHAPE_LIST } from "@/utils/svg_shape_list";

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
}) => {
  const [activeTab, setActiveTab] = useState("shapes"); // "shapes" or "icons"

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
                className="bg-black text-white p-2 rounded-md"
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
            </div>

            <div className="h-[1000px] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(activeTab === "shapes" ? SVG_SHAPE_LIST : SVG_LIST).map(({ id, name, url }) => (
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
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
