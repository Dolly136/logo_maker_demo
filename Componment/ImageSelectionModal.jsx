"use client";
import React from "react";
import { X } from "lucide-react";

const ImageSelectionModal = ({ isOpen, onClose, originalImage, currentImage, onSelectImage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Select Image for Editing</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentImage && (
            <div
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => onSelectImage(currentImage)}
            >
              <h3 className="font-medium text-gray-700 mb-3">Current Image</h3>
              <div className="w-32 h-32 overflow-hidden rounded-md border border-gray-300 flex items-center justify-center mb-3">
                <img src={currentImage} alt="Current" className="w-full h-full object-contain" />
              </div>
              <button className="text-blue-600 hover:underline">Edit Current</button>
            </div>
          )}

          {originalImage && originalImage !== currentImage && ( // Only show original if different
            <div
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => onSelectImage(originalImage)}
            >
              <h3 className="font-medium text-gray-700 mb-3">Original Image</h3>
              <div className="w-32 h-32 overflow-hidden rounded-md border border-gray-300 flex items-center justify-center mb-3">
                <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
              </div>
              <button className="text-blue-600 hover:underline">Edit Original</button>
            </div>
          )}
           {/* If current image is also original, show only one option clearly labeled */}
           {originalImage && originalImage === currentImage && (
             <div className="flex flex-col items-center p-4 border border-gray-200 rounded-lg shadow-sm cursor-not-allowed">
               <h3 className="font-medium text-gray-700 mb-3">Original Image</h3>
               <div className="w-32 h-32 overflow-hidden rounded-md border border-gray-300 flex items-center justify-center mb-3">
                 <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
               </div>
               <p className="text-gray-500 text-sm">No cropped version available</p>
             </div>
           )}
        </div>

        {!currentImage && !originalImage && (
          <p className="text-center text-gray-600">No images to display for editing.</p>
        )}
      </div>
    </div>
  );
};

export default ImageSelectionModal;