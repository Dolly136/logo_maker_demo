export const SVG_LIST = [
  {
    id: 0,
    name: "Trimmo",
    url: "https://trimmo.bio/images/Trimmo-Logo.svg",
  },
  ...Array.from({ length: 1021 }, (_, i) => {
    const id = i + 1;
    const padded = String(id).padStart(2, "0");
    return {
      id,
      name: padded,
      url: `/images/svg_icon/${padded}.svg`,
    };
  }),
];
