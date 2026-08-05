import { describe, expect, it } from "vitest";
import type { ProcessedFlight } from "../types/flights";
import { getRecordingProgress } from "./recordingProgress";
import { getRecordingFrame, RECORDING_TIMING } from "./recordingTimeline";
import {
  createFlightCountIndex,
  getAirborneCountFromIndex,
  getArrivedCountFromIndex,
  getDepartedCountFromIndex,
} from "./stats";

const options = {
  showHook: true,
  loop: true,
  pacing: "linear" as const,
  speed: 60,
};

describe("recording phase timeline", () => {
  it("resets the completed hook network before normal playback", () => {
    expect(getRecordingFrame(0, options)).toMatchObject({
      phase: "hook",
      currentMinute: 1440,
    });
    expect(
      getRecordingFrame(RECORDING_TIMING.hookSeconds + 0.01, options),
    ).toMatchObject({ phase: "transition-to-playback", currentMinute: 0 });
    expect(getRecordingFrame(0.88, options).phase).toBe("playing");
    expect(getRecordingFrame(0.88, options).currentMinute).toBeGreaterThan(0);
  });

  it("loops directly into the next cycle without a final screen", () => {
    const nextCycle =
      RECORDING_TIMING.hookSeconds + RECORDING_TIMING.transitionSeconds + 24;
    expect(getRecordingFrame(nextCycle + 0.01, options).phase).toBe("hook");
  });

  it("stops in a completed state when looping is disabled", () => {
    const frame = getRecordingFrame(1000, { ...options, loop: false });
    expect(frame).toMatchObject({ phase: "complete", currentMinute: 1440 });
    expect(getRecordingProgress(frame.currentMinute)).toBe(1);
  });

  it("resets the loop frame and progress from the same minute", () => {
    const resetFrame = getRecordingFrame(24, {
      ...options,
      showHook: false,
    });
    const flights: ProcessedFlight[] = [
      {
        id: "arrival-reset-check",
        flightDate: "2026-05-15",
        airline: "DL",
        origin: "JFK",
        destination: "ATL",
        direction: "arrival",
        startMinute: 60,
        endMinute: 120,
        durationMinutes: 60,
        path: [],
      },
    ];
    const countIndex = createFlightCountIndex(flights);

    expect(resetFrame).toMatchObject({ phase: "playing", currentMinute: 0 });
    expect({
      progress: getRecordingProgress(resetFrame.currentMinute),
      active: getAirborneCountFromIndex(
        countIndex,
        resetFrame.currentMinute,
      ),
      arrived: getArrivedCountFromIndex(
        countIndex,
        resetFrame.currentMinute,
      ),
      departed: getDepartedCountFromIndex(
        countIndex,
        resetFrame.currentMinute,
      ),
    }).toEqual({ progress: 0, active: 0, arrived: 0, departed: 0 });
  });
});
