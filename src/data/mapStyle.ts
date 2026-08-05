import type { StyleSpecification } from "maplibre-gl";
import { FLIGHT_VISUAL_THEME } from "./theme";

export function createDarkMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
        ],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors © CARTO",
      },
    },
    layers: [
      {
        id: "carto-dark",
        type: "raster",
        source: "carto",
        paint: {
          "raster-opacity": FLIGHT_VISUAL_THEME.basemapOpacity,
          "raster-brightness-min": 0.06,
          "raster-brightness-max": 1,
          "raster-contrast": 0.04,
        },
      },
    ],
  };
}
