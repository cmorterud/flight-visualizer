import { useEffect, useRef, useState } from "react";
import {
  getRecordingFrame,
  RECORDING_TIMING,
  type RecordingFrame,
} from "../lib/recordingTimeline";
import type { PacingMode } from "../lib/recordingOptions";

type Options = {
  ready: boolean;
  autoplay: boolean;
  loop: boolean;
  showHook: boolean;
  pacing: PacingMode;
  speed: number;
};

export function useRecordingPlayback(options: Options): RecordingFrame & {
  isPlaying: boolean;
} {
  const { ready, autoplay, loop, showHook, pacing, speed } = options;
  const [frame, setFrame] = useState(() =>
    getRecordingFrame(0, { loop, showHook, pacing, speed }),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const elapsedRef = useRef(0);
  const previousRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ready || !autoplay) return;
    const frameId = requestAnimationFrame(() => setIsPlaying(true));
    return () => cancelAnimationFrame(frameId);
  }, [autoplay, loop, pacing, ready, showHook, speed]);

  useEffect(() => {
    if (!isPlaying) {
      previousRef.current = null;
      return;
    }
    let frameId = 0;
    const tick = (now: number) => {
      const previous = previousRef.current ?? now;
      previousRef.current = now;
      elapsedRef.current += (now - previous) / 1000;
      const next = getRecordingFrame(elapsedRef.current, {
        loop,
        showHook,
        pacing,
        speed,
      });
      setFrame(next);
      if (!loop && next.phase === "ending") {
        const finishedAt =
          next.expectedPlaybackSeconds +
          (showHook
            ? RECORDING_TIMING.hookSeconds + RECORDING_TIMING.transitionSeconds
            : 0) +
          RECORDING_TIMING.endingSeconds;
        if (next.cycleElapsedSeconds >= finishedAt) {
          setIsPlaying(false);
          return;
        }
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, loop, pacing, showHook, speed]);

  return { ...frame, isPlaying };
}
