import { describe, expect, it } from "vitest";
import {
  calculateStats,
  createFlightCountIndex,
  getAirborneCount,
  getAirborneCountFromIndex,
  getArrivedCount,
  getArrivedCountFromIndex,
  getDepartedCount,
  getDepartedCountFromIndex,
  isFlightActive,
} from "./stats";
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

  it("counts arrivals, departures, and airborne flights at a minute", () => {
    const flights = [
      flight("arrival", 20, 80),
      flight("departure", 50, 90),
      flight("arrival", 80, 140),
    ];
    expect(getArrivedCount(flights, 100)).toBe(1);
    expect(getDepartedCount(flights, 100)).toBe(1);
    expect(getAirborneCount(flights, 100)).toBe(1);
  });

  it("keeps crossing-midnight activity and completes selected-day totals", () => {
    const flights = [
      flight("departure", 1410, 1530),
      flight("arrival", -30, 15),
      flight("arrival", 1380, 1500),
    ];
    const index = createFlightCountIndex(flights);
    expect(getAirborneCountFromIndex(index, 0)).toBe(1);
    expect(getArrivedCountFromIndex(index, 15)).toBe(1);
    expect(getDepartedCountFromIndex(index, 1410)).toBe(1);
    expect(getArrivedCountFromIndex(index, 1440)).toBe(2);
    expect(getDepartedCountFromIndex(index, 1440)).toBe(1);
  });
});
