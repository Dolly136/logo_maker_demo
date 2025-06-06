export const SVG_SHAPE_LIST = Array.from({ length: 116 }, (_, i) => {
  const id = i + 1;
  const padded = String(id).padStart(2, "0");
  return {
    id,
    name: padded,
    url: `/images/svg_shape_list/${padded}.svg`,
  };
});

