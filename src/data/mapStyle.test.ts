import { describe, expect, it } from "vitest";
import { createDarkMapStyle } from "./mapStyle";

describe("dark map style", () => {
  it("keeps raster brightness values within MapLibre's valid range", () => {
    const layer = createDarkMapStyle().layers.find(
      (candidate) => candidate.id === "carto-dark",
    );
    expect(layer?.type).toBe("raster");
    if (!layer || layer.type !== "raster") return;

    expect(layer.paint?.["raster-brightness-min"]).toBeGreaterThanOrEqual(0);
    expect(layer.paint?.["raster-brightness-min"]).toBeLessThanOrEqual(1);
    expect(layer.paint?.["raster-brightness-max"]).toBeGreaterThanOrEqual(0);
    expect(layer.paint?.["raster-brightness-max"]).toBeLessThanOrEqual(1);
  });
});
