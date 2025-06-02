"use client";
import React from "react";
import {
  Crop,
  Maximize,
  Sparkles,
  ImagePlus,
  Palette,
  SlidersHorizontal,
  X,
} from "lucide-react";

const ImageEditorModal = ({ isOpen, onClose, onSelectOption }) => {
  if (!isOpen) return null;

  const editingOptions = [
    {
      icon: Crop,
      title: "Crop",
      description: "Cut and resize your image to fit your design.",
      action: "crop",
    },
    {
      icon: Maximize,
      title: "Expand",
      description: "Instantly generate more of your image in any direction.",
      action: "expand",
    },
    {
      icon: Sparkles,
      title: "Smart Select",
      description: "Refine your image by removing or replacing any object.",
      action: "smart-select",
    },
    {
      icon: ImagePlus,
      title: "Replace Background",
      description: "Easily switch your background to a new one.",
      action: "replace-background",
    },
    {
      icon: Palette,
      title: "Color Filters",
      description: "Give your image a colorful twist with filters.",
      action: "color-filters",
    },
    {
      icon: SlidersHorizontal,
      title: "Adjust",
      description: "Enhance lighting and color for your image.",
      action: "adjust",
    },
  ];

  const handleOptionClick = (action) => {
    onSelectOption(action);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Edit Image</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {editingOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleOptionClick(option.action)}
              className="p-4 border border-gray-200 rounded-md hover:shadow-lg transition cursor-pointer flex items-start gap-4"
            >
              <option.icon size={28} className="text-blue-500" />
              <div>
                <h3 className="font-semibold text-gray-800">{option.title}</h3>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
