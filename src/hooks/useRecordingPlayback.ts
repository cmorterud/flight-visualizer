import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRecordingFrame,
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
  play(): void;
  pause(): void;
  reset(): void;
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
      if (!loop && next.phase === "complete") {
        setIsPlaying(false);
        return;
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, loop, pacing, showHook, speed]);

  const play = useCallback(() => {
    if (!ready) return;
    if (frame.phase === "complete") {
      elapsedRef.current = 0;
      previousRef.current = null;
      setFrame(getRecordingFrame(0, { loop, showHook, pacing, speed }));
    }
    setIsPlaying(true);
  }, [frame.phase, loop, pacing, ready, showHook, speed]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const reset = useCallback(() => {
    elapsedRef.current = 0;
    previousRef.current = null;
    setIsPlaying(false);
    setFrame(getRecordingFrame(0, { loop, showHook, pacing, speed }));
  }, [loop, pacing, showHook, speed]);

  return { ...frame, isPlaying, play, pause, reset };
}
