import { useEffect, useState } from "react";

const imageFilters = [
  { name: "Original", cssFilter: "none", showIntensity: false },
  {
    name: "Tropical",
    cssFilter: "saturate(1.5) hue-rotate(-15deg) brightness(1.1)",
    showIntensity: true,
  },
  {
    name: "Crisp",
    cssFilter: "contrast(1.2) brightness(1.05) saturate(1.1)",
    showIntensity: true,
  },
  { name: "Sandy", cssFilter: "sepia(0.6) contrast(1.1) brightness(0.9)", showIntensity: true },
  {
    name: "Moody",
    cssFilter: "grayscale(0.3) sepia(0.2) contrast(0.9) brightness(0.8)",
    showIntensity: true,
  },
  {
    name: "Black & White",
    cssFilter: "grayscale(1)",
    showIntensity: true,
    defaultValue: 1,
    min: 0,
    max: 1,
  },
  {
    name: "Neon",
    cssFilter: "hue-rotate(90deg) saturate(2) brightness(1.2)",
    showIntensity: true,
  },
  {
    name: "Washed",
    cssFilter: "contrast(0.8) saturate(0.5) brightness(1.2)",
    showIntensity: true,
  },
  {
    name: "Bright",
    cssFilter: "brightness(1.3) saturate(1.1)",
    showIntensity: true,
    defaultValue: 1.3,
    min: 0.5,
    max: 2,
  },
  { name: "Mellow", cssFilter: "sepia(0.4) contrast(0.95) brightness(1.05)", showIntensity: true },
  {
    name: "Romantic",
    cssFilter: "sepia(0.3) hue-rotate(-20deg) brightness(1.1)",
    showIntensity: true,
  },
  {
    name: "Newspaper",
    cssFilter: "grayscale(1) contrast(1.5) brightness(0.8)",
    showIntensity: true,
  },
  {
    name: "Darken",
    cssFilter: "brightness(0.7)",
    showIntensity: true,
    defaultValue: 0.7,
    min: 0.2,
    max: 1,
  },
  {
    name: "Lighten",
    cssFilter: "brightness(1.3)",
    showIntensity: true,
    defaultValue: 1.3,
    min: 1,
    max: 2,
  },
  { name: "Faded", cssFilter: "contrast(0.7) saturate(0.6)", showIntensity: true },

  {
    name: "Unicorn",
    cssFilter: "hue-rotate(300deg) saturate(1.2) brightness(1.1) contrast(1.1)",
    showIntensity: true,
  },
  {
    name: "Nighttrain",
    cssFilter: "hue-rotate(220deg) saturate(0.8) brightness(0.9) contrast(1.1)",
    showIntensity: true,
  },
  {
    name: "Neon sky",
    cssFilter: "hue-rotate(45deg) saturate(1.8) brightness(1.2) contrast(1.1)",
    showIntensity: true,
  },
  {
    name: "Blue Ray",
    cssFilter: "hue-rotate(240deg) saturate(2.5) brightness(1.0) contrast(1.0)",
    showIntensity: true,
  },
  {
    name: "Jellybean",
    cssFilter: "hue-rotate(330deg) saturate(2.0) brightness(1.1) contrast(1.0)",
    showIntensity: true,
  },
  {
    name: "Concrete",
    cssFilter: "grayscale(0.8) contrast(1.2) brightness(0.9)",
    showIntensity: true,
  },
  {
    name: "Organic",
    cssFilter: "sepia(0.5) hue-rotate(-10deg) brightness(1.05) contrast(1.05)",
    showIntensity: true,
  },
  {
    name: "Pixie",
    cssFilter: "hue-rotate(180deg) saturate(1.5) brightness(1.1) contrast(1.05)",
    showIntensity: true,
  },
  {
    name: "Marge",
    cssFilter: "hue-rotate(60deg) saturate(1.5) brightness(1.1) contrast(1.05)",
    showIntensity: true,
  },
  {
    name: "Flamingo",
    cssFilter: "hue-rotate(90deg) saturate(1.8) brightness(1.1) contrast(1.1)",
    showIntensity: true,
  },
  {
    name: "Lucille",
    cssFilter: "hue-rotate(0deg) saturate(2.0) brightness(0.9) contrast(1.2)",
    showIntensity: true,
  },
  {
    name: "Kool-Aid",
    cssFilter: "hue-rotate(280deg) saturate(1.8) brightness(1.1) contrast(1.1)",
    showIntensity: true,
  },
];

export default function ColorFilterModal({ isOpen, onClose, image, onApplyFilter }) {
  const [selectedFilterName, setSelectedFilterName] = useState("Original");
  const [intensity, setIntensity] = useState(0);

  const selectedFilter = imageFilters.find((f) => f.name === selectedFilterName);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFilterName("Original");
      setIntensity(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFilter && selectedFilter.showIntensity) {
      setIntensity(selectedFilter.defaultValue || 1);
    } else {
      setIntensity(0);
    }
  }, [selectedFilterName, selectedFilter]);

  let filterValue = selectedFilter?.cssFilter || "none";

  if (selectedFilter?.showIntensity) {
    if (selectedFilter.name === "Black & White") {
      filterValue = `grayscale(${intensity})`;
    } else if (
      selectedFilter.name === "Bright" ||
      selectedFilter.name === "Darken" ||
      selectedFilter.name === "Lighten"
    ) {
      filterValue = `brightness(${intensity})`;
    }
  }

  const handleApply = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.crossOrigin = "anonymous";

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.filter = filterValue;
      ctx.drawImage(img, 0, 0);

      const filteredImage = canvas.toDataURL("image/png");

      onApplyFilter(filteredImage);
      onClose();
    };

    img.onerror = () => {
      alert(
        "Failed to load the image for applying filter. Make sure it's accessible and CORS is configured if needed.",
      );
    };

    img.src = image;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-lg h-[600px] overflow-auto">
        {" "}
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-semibold">
            Filters
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {" "}
          {imageFilters.map((filter) => (
            <button
              key={filter.name}
              onClick={() => setSelectedFilterName(filter.name)}
              className={`flex flex-col items-center p-1 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  selectedFilterName === filter.name
                    ? "border-2 border-blue-600"
                    : "border border-gray-200 hover:border-blue-300"
                }
              `}
              aria-pressed={selectedFilterName === filter.name}
            >
              <div
                className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center"
                style={{
                  filter: filter.cssFilter,
                }}
              >
                <img
                  src={image}
                  alt={filter.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              <span className="mt-2 text-sm text-gray-700">{filter.name}</span>
            </button>
          ))}
        </div>
        {selectedFilter?.showIntensity && (
          <div className="mb-6">
            <label htmlFor="intensity" className="block mb-1 font-medium">
              Intensity: {intensity.toFixed(2)}
            </label>
            <input
              type="range"
              id="intensity"
              min={selectedFilter.min !== undefined ? selectedFilter.min : 0}
              max={selectedFilter.max !== undefined ? selectedFilter.max : 1}
              step={0.01}
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-700"
            />
          </div>
        )}
        <div className="mb-6 flex justify-center">
          <img
            src={image}
            alt="Preview"
            style={{ filter: filterValue }}
            className="max-w-full max-h-80 rounded-md border shadow-md"
            draggable={false}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}
