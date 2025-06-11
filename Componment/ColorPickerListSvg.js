import React from "react";
import { ChromePicker } from "react-color";

const ColorPickerListSvg = ({
  selectedId,
  colorKeys,
  fillTypeMap,
  onColorChange,
  colorMap,
  gradientMap,
  togglePicker,
  pickerVisibility,
}) => {
  return (
    <div>
      {/* <div className="w-100"> */}
        {selectedId && colorKeys.length > 0 && (
          <div 
          // className="h-[1000px] overflow-auto bg-white p-6"
          >
            <h3 className="text-lg font-semibold mb-3">Edit Colors</h3>
            <div className="space-y-6">
              {colorKeys.slice(1).map((orig) => (
                <div key={orig}>
                  <label className="block mb-1 font-semibold">Original: {orig}</label>
                  <div className="mb-2">
                    <label>
                      <input
                        type="radio"
                        checked={fillTypeMap[orig] !== "gradient"}
                        onChange={() => onColorChange(orig, { hex: colorMap[orig] }, false)}
                      />{" "}
                      Solid
                    </label>
                    <label className="ml-4">
                      <input
                        type="radio"
                        checked={fillTypeMap[orig] === "gradient"}
                        onChange={() =>
                          onColorChange(
                            orig,
                            {
                              start: gradientMap[orig]?.start || "#ffffff",
                              end: gradientMap[orig]?.end || "#000000",
                            },
                            true,
                          )
                        }
                      />{" "}
                      Gradient
                    </label>
                  </div>

                  {fillTypeMap[orig] === "gradient" ? (
                    <div className="gap-4">
                      <div>
                        <label>Start</label>
                        <div
                          className="w-10 h-5 rounded cursor-pointer border"
                          style={{ backgroundColor: gradientMap[orig]?.start || "#ffffff" }}
                          onClick={() => togglePicker(orig, "start")}
                        />
                        {pickerVisibility[orig]?.start && (
                          <ChromePicker
                            color={gradientMap[orig]?.start || "#ffffff"}
                            onChangeComplete={(color) =>
                              onColorChange(
                                orig,
                                { start: color.hex, end: gradientMap[orig]?.end || "#000000" },
                                true,
                              )
                            }
                            disableAlpha
                          />
                        )}
                      </div>
                      <div>
                        <label>End</label>
                        <div
                          className="w-10 h-5 rounded cursor-pointer border"
                          style={{ backgroundColor: gradientMap[orig]?.end || "#000000" }}
                          onClick={() => togglePicker(orig, "end")}
                        />
                        {pickerVisibility[orig]?.end && (
                          <ChromePicker
                            color={gradientMap[orig]?.end || "#000000"}
                            onChangeComplete={(color) =>
                              onColorChange(
                                orig,
                                { start: gradientMap[orig]?.start || "#ffffff", end: color.hex },
                                true,
                              )
                            }
                            disableAlpha
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="w-10 h-5 rounded cursor-pointer border mb-2"
                        style={{ backgroundColor: colorMap[orig] }}
                        onClick={() => togglePicker(orig, "solid")}
                      />
                      {pickerVisibility[orig]?.solid && (
                        <ChromePicker
                          color={colorMap[orig]}
                          onChangeComplete={(color) => onColorChange(orig, color, false)}
                          disableAlpha
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      {/* </div> */}
    </div>
  );
};

export default ColorPickerListSvg;
