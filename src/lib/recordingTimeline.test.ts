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

  it("loops directly into the next cycle without a final screen", () => {
    const nextCycle =
      RECORDING_TIMING.hookSeconds + RECORDING_TIMING.transitionSeconds + 24;
    expect(getRecordingFrame(nextCycle + 0.01, options).phase).toBe("hook");
  });

  it("stops in a completed state when looping is disabled", () => {
    const frame = getRecordingFrame(1000, { ...options, loop: false });
    expect(frame).toMatchObject({ phase: "complete", currentMinute: 1440 });
  });
});
