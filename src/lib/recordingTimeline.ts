import {
  getSimulationMinuteForElapsedTime,
  getTotalPlaybackDuration,
} from "./pacing";
import type { PacingMode } from "./recordingOptions";

export type RecordingPhase =
  "hook" | "transition-to-playback" | "playing" | "ending" | "loop-reset";

export const RECORDING_TIMING = {
  hookSeconds: 0.75,
  transitionSeconds: 0.12,
  endingSeconds: 1.75,
  loopResetSeconds: 0.05,
} as const;

export interface RecordingFrame {
  phase: RecordingPhase;
  currentMinute: number;
  elapsedPlaybackSeconds: number;
  cycleElapsedSeconds: number;
  expectedPlaybackSeconds: number;
}

export function getRecordingFrame(
  elapsedSeconds: number,
  options: {
    showHook: boolean;
    loop: boolean;
    pacing: PacingMode;
    speed: number;
  },
): RecordingFrame {
  const playbackDuration = getTotalPlaybackDuration(
    options.pacing,
    options.speed,
  );
  const openingDuration = options.showHook
    ? RECORDING_TIMING.hookSeconds + RECORDING_TIMING.transitionSeconds
    : 0;
  const cycleDuration =
    openingDuration +
    playbackDuration +
    RECORDING_TIMING.endingSeconds +
    (options.loop ? RECORDING_TIMING.loopResetSeconds : 0);
  const elapsed = Math.max(0, elapsedSeconds);
  const cycleElapsed = options.loop
    ? elapsed % cycleDuration
    : Math.min(
        elapsed,
        openingDuration + playbackDuration + RECORDING_TIMING.endingSeconds,
      );

  if (options.showHook && cycleElapsed < RECORDING_TIMING.hookSeconds) {
    return {
      phase: "hook",
      currentMinute: 1440,
      elapsedPlaybackSeconds: 0,
      cycleElapsedSeconds: cycleElapsed,
      expectedPlaybackSeconds: playbackDuration,
    };
  }
  if (options.showHook && cycleElapsed < openingDuration) {
    return {
      phase: "transition-to-playback",
      currentMinute: 0,
      elapsedPlaybackSeconds: 0,
      cycleElapsedSeconds: cycleElapsed,
      expectedPlaybackSeconds: playbackDuration,
    };
  }

  const playbackElapsed = cycleElapsed - openingDuration;
  if (playbackElapsed < playbackDuration) {
    return {
      phase: "playing",
      currentMinute: getSimulationMinuteForElapsedTime(
        playbackElapsed,
        options.pacing,
        options.speed,
      ),
      elapsedPlaybackSeconds: playbackElapsed,
      cycleElapsedSeconds: cycleElapsed,
      expectedPlaybackSeconds: playbackDuration,
    };
  }
  if (
    playbackElapsed < playbackDuration + RECORDING_TIMING.endingSeconds ||
    !options.loop
  ) {
    return {
      phase: "ending",
      currentMinute: 1440,
      elapsedPlaybackSeconds: playbackDuration,
      cycleElapsedSeconds: cycleElapsed,
      expectedPlaybackSeconds: playbackDuration,
    };
  }
  return {
    phase: "loop-reset",
    currentMinute: 1440,
    elapsedPlaybackSeconds: playbackDuration,
    cycleElapsedSeconds: cycleElapsed,
    expectedPlaybackSeconds: playbackDuration,
  };
}
