export async function fetchSvgText(url) {
  const isRemote = url.startsWith("http");
  const fetchUrl = isRemote ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` : url;

  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error("Failed to load SVG");
  return await res.text();
}

export function extractColors(svgText) {
  const colors = new Set();
  const regexAttr = /(fill|stroke|stop-color)=["']([^"']+)["']/gi;
  let match;
  while ((match = regexAttr.exec(svgText)) !== null) {
    colors.add(match[2].toLowerCase());
  }
  const regexStyle = /style=["'][^"']*?(fill|stroke|stop-color):\s*([^;"']+)/gi;
  while ((match = regexStyle.exec(svgText)) !== null) {
    colors.add(match[2].toLowerCase());
  }
  return Array.from(colors);
}

export function replaceColor(svgText, originalColor, newColor) {
  const escOrig = originalColor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regexAttr = new RegExp(`(fill|stroke|stop-color)=["']${escOrig}["']`, "gi");
  svgText = svgText.replace(regexAttr, (match, p1) => `${p1}="${newColor}"`);
  const regexStyle = new RegExp(`(fill|stroke|stop-color):\\s*${escOrig}`, "gi");
  svgText = svgText.replace(regexStyle, (match, p1) => `${p1}: ${newColor}`);
  return svgText;
}

export function replaceColorsWithGradients(svgText, colorMap, fillTypeMap, gradientMap) {
  let defs = "";
  const usedGradients = new Map();

  for (const [origColor, type] of Object.entries(fillTypeMap)) {
    if (type === "gradient") {
      const gradId = `grad-${origColor.replace(/[#()]/g, "")}`;
      const { start, end } = gradientMap[origColor] || {};
      defs += `
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      `;
      usedGradients.set(origColor.toLowerCase(), gradId);
    }
  }

  svgText = svgText.replace(/<svg([^>]*)>/i, (match, attrs) => {
    return `<svg${attrs}><defs>${defs}</defs>`;
  });

  for (const [orig, val] of Object.entries(colorMap)) {
    const escaped = orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const gradId = usedGradients.get(orig.toLowerCase());
    if (fillTypeMap[orig] === "gradient" && gradId) {
      const gradientUrl = `url(#${gradId})`;
      svgText = svgText.replace(
        new RegExp(`(fill|stroke|stop-color)=["']${escaped}["']`, "gi"),
        (_, attr) => `${attr}="${gradientUrl}"`,
      );
      svgText = svgText.replace(
        new RegExp(`(fill|stroke|stop-color):\\s*${escaped}`, "gi"),
        (_, attr) => `${attr}: ${gradientUrl}`,
      );
    } else {
      svgText = replaceColor(svgText, orig, val);
    }
  }
  return svgText;
}

export function svgToImage(svgText, callback) {
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    callback(img);
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    console.error("SVG image load error");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export const aspectRatios = [
  // { label: "Freeform", value: "none" },
  { label: "Original", value: "original" },
  { label: "1:1", value: "1:1" },
  { label: "9:16", value: "9:16" },
  { label: "16:9", value: "16:9" },
  { label: "5:4", value: "5:4" },
  { label: "4:5", value: "4:5" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
];