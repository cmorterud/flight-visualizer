import { describe, expect, it } from "vitest";
import { calculateStats, isFlightActive } from "./stats";
import type { ProcessedFlight } from "../types/flights";

const flight = (
  direction: "arrival" | "departure",
  startMinute: number,
  endMinute: number,
): ProcessedFlight => ({
  id: `${direction}-${startMinute}`,
  flightDate: "2026-05-15",
  airline: "DL",
  origin: direction === "arrival" ? "JFK" : "ATL",
  destination: direction === "arrival" ? "ATL" : "JFK",
  direction,
  startMinute,
  endMinute,
  durationMinutes: endMinute - startMinute,
  path: [],
});

describe("flight state statistics", () => {
  it("determines whether a flight is active", () => {
    const item = flight("departure", 100, 200);
    expect(isFlightActive(item, 100)).toBe(true);
    expect(isFlightActive(item, 199.9)).toBe(true);
    expect(isFlightActive(item, 200)).toBe(false);
  });

  it("calculates completed arrivals and departures", () => {
    const stats = calculateStats(
      [
        flight("arrival", 20, 80),
        flight("departure", 50, 90),
        flight("arrival", 80, 140),
      ],
      100,
    );
    expect(stats).toEqual({
      active: 1,
      completedArrivals: 1,
      completedDepartures: 1,
    });
  });
});
