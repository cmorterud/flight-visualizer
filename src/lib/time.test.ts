import { describe, expect, it } from "vitest";
import { parseHHMM, resolveFlightTimes } from "./time";

describe("flight time normalization", () => {
  it("parses HHMM-style flight times", () => {
    expect(parseHHMM("5")).toBe(5);
    expect(parseHHMM(930)).toBe(570);
    expect(parseHHMM("2400")).toBe(1440);
    expect(parseHHMM("2461")).toBeNull();
  });

  it("handles a departure crossing midnight", () => {
    expect(
      resolveFlightTimes({
        direction: "departure",
        actualDeparture: 2330,
        actualElapsed: 120,
      }),
    ).toEqual({ startMinute: 1410, endMinute: 1530 });
  });

  it("calculates the start time for an arrival", () => {
    expect(
      resolveFlightTimes({
        direction: "arrival",
        actualArrival: 900,
        actualElapsed: 105,
      }),
    ).toEqual({ startMinute: 435, endMinute: 540 });
  });

  it("calculates the end time for a departure", () => {
    expect(
      resolveFlightTimes({
        direction: "departure",
        actualDeparture: 800,
        actualElapsed: 135,
      }),
    ).toEqual({ startMinute: 480, endMinute: 615 });
  });

  it("falls back from actual to scheduled values", () => {
    expect(
      resolveFlightTimes({
        direction: "departure",
        actualDeparture: "",
        scheduledDeparture: 700,
        actualElapsed: "",
        scheduledElapsed: 90,
      }),
    ).toEqual({ startMinute: 420, endMinute: 510 });
  });
});
