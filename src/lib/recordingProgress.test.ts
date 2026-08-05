import { describe, expect, it } from "vitest";
import { getRecordingProgress } from "./recordingProgress";

describe("recording progress", () => {
  it.each([
    [-10, 0],
    [0, 0],
    [720, 0.5],
    [1440, 1],
    [1500, 1],
    [Number.NaN, 0],
  ])("clamps minute %s to %s", (minute, expected) => {
    expect(getRecordingProgress(minute)).toBe(expected);
  });
});
