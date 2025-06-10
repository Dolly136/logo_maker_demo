// utils/loadFont.js
export const loadGoogleFont = async (fontFamily) => {
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replaceAll(
    " ",
    "+"
  )}&display=swap`;

  if (!document.getElementById(`font-${fontFamily}`)) {
    const link = document.createElement("link");
    link.id = `font-${fontFamily}`;
    link.rel = "stylesheet";
    link.href = fontUrl;
    document.head.appendChild(link);
  }

  await document.fonts.load(`16px ${fontFamily}`);
  await document.fonts.ready;
};
