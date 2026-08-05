import { describe, expect, it } from "vitest";
import { AIRPORT_LABEL_THEME, FLIGHT_VISUAL_THEME } from "./theme";

describe("flight visual theme hierarchy", () => {
  it("keeps the selected airport marker larger than active aircraft heads", () => {
    const ratio =
      FLIGHT_VISUAL_THEME.selectedAirportRadiusPixels /
      FLIGHT_VISUAL_THEME.activeHeadRadiusPixels;

    expect(ratio).toBeGreaterThanOrEqual(1.2);
    expect(ratio).toBeLessThanOrEqual(1.35);
    expect(FLIGHT_VISUAL_THEME.selectedAirportHaloRadiusPixels).toBeGreaterThan(
      FLIGHT_VISUAL_THEME.selectedAirportRadiusPixels,
    );
  });

  it("uses the compact recording label size and a clear upward offset", () => {
    expect(AIRPORT_LABEL_THEME.sizePixelsCompact).toBe(13);
    expect(AIRPORT_LABEL_THEME.offsetPixels).toEqual([0, -22]);
  });
});
