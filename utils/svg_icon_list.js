export const SVG_LIST = Array.from({ length: 1021 }, (_, i) => {
  const id = i + 1;
  const padded = String(id).padStart(2, "0");
  return {
    id,
    name: padded,
    url: `/images/svg_icon/${padded}.svg`,
  };
});
