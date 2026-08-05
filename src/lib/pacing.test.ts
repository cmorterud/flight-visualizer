import { describe, expect, it } from "vitest";
import {
  getSimulationMinuteForElapsedTime,
  getTotalPlaybackDuration,
} from "./pacing";

describe("recording pacing", () => {
  it("runs a linear day in 24 seconds at speed 60", () => {
    expect(getTotalPlaybackDuration("linear", 60)).toBe(24);
    expect(getSimulationMinuteForElapsedTime(12, "linear", 60)).toBe(720);
    expect(getSimulationMinuteForElapsedTime(24, "linear", 60)).toBe(1440);
  });

  it("keeps activity pacing continuous and monotonic", () => {
    const duration = getTotalPlaybackDuration("activity", 60);
    let previous = -1;
    for (let elapsed = 0; elapsed <= duration; elapsed += 0.05) {
      const minute = getSimulationMinuteForElapsedTime(elapsed, "activity", 60);
      expect(minute).toBeGreaterThanOrEqual(previous);
      previous = minute;
    }
    expect(
      getSimulationMinuteForElapsedTime(duration, "activity", 60),
    ).toBeCloseTo(1440);
  });
});
