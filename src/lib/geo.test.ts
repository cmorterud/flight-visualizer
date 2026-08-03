import { describe, expect, it } from "vitest";
import { greatCirclePath } from "./geo";

describe("great-circle path generation", () => {
  it("creates a curved geographic route with fixed endpoints", () => {
    const path = greatCirclePath(
      [-84.4277, 33.6407],
      [-118.4085, 33.9416],
      0,
      300,
      41,
    );
    expect(path).toHaveLength(41);
    expect(path[0].coordinate[0]).toBeCloseTo(-84.4277, 4);
    expect(path[40].coordinate[0]).toBeCloseTo(-118.4085, 4);
    expect(path[20].coordinate[1]).toBeGreaterThan(34.5);
  });

  it("interpolates timestamps from departure to arrival", () => {
    const path = greatCirclePath([-84, 33], [-73, 40], 120, 240, 5);
    expect(path.map((point) => point.timestamp)).toEqual([
      120, 150, 180, 210, 240,
    ]);
  });
});
