import { describe, expect, it } from "vitest";
import { parseRecordingOptions, RECORDING_DEFAULTS } from "./recordingOptions";

describe("recording query parsing", () => {
  it("uses safe defaults for missing and invalid values", () => {
    expect(
      parseRecordingOptions("?airport=bad-code&speed=Infinity&pacing=fast"),
    ).toEqual(RECORDING_DEFAULTS);
  });

  it("parses supported booleans, speed, pacing, airport, and date", () => {
    expect(
      parseRecordingOptions(
        "?airport=lax&date=2026-07-15&speed=90&autoplay=0&loop=false&showHook=1&pacing=activity&showSafeAreas=true&showDebug=1",
      ),
    ).toEqual({
      airport: "LAX",
      date: "2026-07-15",
      speed: 90,
      autoplay: false,
      loop: false,
      showHook: true,
      pacing: "activity",
      showSafeAreas: true,
      showDebug: true,
    });
  });

  it("falls back for zero, negative, NaN, and oversized speeds", () => {
    for (const value of ["0", "-60", "NaN", "999999"]) {
      expect(parseRecordingOptions(`?speed=${value}`).speed).toBe(60);
    }
  });
});
