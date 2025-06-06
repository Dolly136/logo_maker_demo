import Konva from "konva";

export const filterStyles = {
  Original: {
    filters: [],
  },
  Tropical: {
    filters: [Konva.Filters.Brighten, Konva.Filters.HSV],
    brightness: 0.2,
    hue: 10,
    saturation: 0.3,
  },
  Crisp: {
    filters: [Konva.Filters.Contrast],
    contrast: 50,
  },
  Sandy: {
    filters: [Konva.Filters.Sepia],
  },
  Moody: {
    filters: [Konva.Filters.Grayscale, Konva.Filters.Brighten],
    brightness: -0.2,
  },
  "Black and white": {
    filters: [Konva.Filters.Grayscale],
  },
  Neon: {
    filters: [Konva.Filters.HSV],
    hue: 120,
    saturation: 1,
    value: 0.2,
  },
  Washed: {
    filters: [Konva.Filters.Brighten],
    brightness: 0.3,
  },
  Bright: {
    filters: [Konva.Filters.Brighten],
    brightness: 0.6,
  },
  Mellow: {
    filters: [Konva.Filters.Brighten, Konva.Filters.Contrast],
    brightness: 0.1,
    contrast: -20,
  },
  Romantic: {
    filters: [Konva.Filters.Sepia, Konva.Filters.Brighten],
    brightness: 0.2,
  },
  Newspaper: {
    filters: [Konva.Filters.Grayscale, Konva.Filters.Contrast],
    contrast: 40,
  },
  Darken: {
    filters: [Konva.Filters.Brighten],
    brightness: -0.4,
  },
  Lighten: {
    filters: [Konva.Filters.Brighten],
    brightness: 0.4,
  },
  Faded: {
    filters: [Konva.Filters.Brighten, Konva.Filters.Contrast],
    brightness: 0.3,
    contrast: -30,
  },
  Unicorn: {
    filters: [Konva.Filters.HSV],
    hue: 300,
    saturation: 0.8,
  },
  Nightrain: {
    filters: [Konva.Filters.Grayscale, Konva.Filters.HSV],
    hue: 240,
    saturation: 0.3,
  },
  "Neon sky": {
    filters: [Konva.Filters.HSV],
    hue: 200,
    saturation: 1,
  },
  "Blue ray": {
    filters: [Konva.Filters.HSV],
    hue: 180,
    saturation: 0.8,
  },
  Jellybean: {
    filters: [Konva.Filters.HSV],
    hue: 330,
    saturation: 0.7,
  },
  Concreat: {
    filters: [Konva.Filters.Grayscale, Konva.Filters.Contrast],
    contrast: 20,
  },
  Organic: {
    filters: [Konva.Filters.Sepia, Konva.Filters.Brighten],
    brightness: 0.1,
  },
  Pixie: {
    filters: [Konva.Filters.HSV],
    hue: 280,
    saturation: 0.6,
  },
  Marge: {
    filters: [Konva.Filters.HSV],
    hue: 60,
    saturation: 0.9,
  },
  Flamingo: {
    filters: [Konva.Filters.HSV],
    hue: 10,
    saturation: 1,
  },
  Lucille: {
    filters: [Konva.Filters.HSV],
    hue: 90,
    saturation: 0.6,
  },
  "Kool-Aid": {
    filters: [Konva.Filters.HSV],
    hue: 150,
    saturation: 1,
  },
};