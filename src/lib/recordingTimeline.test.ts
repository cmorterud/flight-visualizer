import { describe, expect, it } from "vitest";
import { getRecordingFrame, RECORDING_TIMING } from "./recordingTimeline";

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

  it("holds the final state for the configured ending duration", () => {
    const endingStart = 0.87 + 24;
    expect(getRecordingFrame(endingStart + 0.1, options).phase).toBe("ending");
    expect(
      getRecordingFrame(
        endingStart + RECORDING_TIMING.endingSeconds - 0.01,
        options,
      ).phase,
    ).toBe("ending");
  });

  it("uses a clean loop-reset phase before beginning the next cycle", () => {
    const resetStart = 0.87 + 24 + RECORDING_TIMING.endingSeconds;
    expect(getRecordingFrame(resetStart + 0.01, options).phase).toBe(
      "loop-reset",
    );
    expect(
      getRecordingFrame(
        resetStart + RECORDING_TIMING.loopResetSeconds + 0.01,
        options,
      ).phase,
    ).toBe("hook");
  });

  it("stays on the final frame when looping is disabled", () => {
    const frame = getRecordingFrame(1000, { ...options, loop: false });
    expect(frame).toMatchObject({ phase: "ending", currentMinute: 1440 });
  });
});
