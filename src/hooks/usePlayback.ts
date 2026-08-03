import { useCallback, useEffect, useRef, useState } from "react";

export interface PlaybackState {
  currentMinute: number;
  isPlaying: boolean;
  speed: number;
  progress: number;
}

export interface PlaybackControls {
  play(): void;
  pause(): void;
  restart(): void;
  seek(minute: number): void;
  setSpeed(speed: number): void;
}

export function usePlayback(
  options: {
    initialSpeed?: number;
    autoPlay?: boolean;
    loop?: boolean;
    autoPlayDelay?: number;
  } = {},
): PlaybackState & PlaybackControls {
  const {
    initialSpeed = 60,
    autoPlay = false,
    loop = false,
    autoPlayDelay = 0,
  } = options;
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState(initialSpeed);
  const timeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const previousRef = useRef<number | null>(null);
  const speedRef = useRef(initialSpeed);
  const loopRef = useRef(loop);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    if (!autoPlay) return;
    const timeout = window.setTimeout(() => setIsPlaying(true), autoPlayDelay);
    return () => window.clearTimeout(timeout);
  }, [autoPlay, autoPlayDelay]);

  useEffect(() => {
    if (!isPlaying) {
      previousRef.current = null;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      return;
    }
    const tick = (now: number) => {
      const previous = previousRef.current ?? now;
      previousRef.current = now;
      let next = timeRef.current + ((now - previous) / 1000) * speedRef.current;
      if (next >= 1440) {
        if (loopRef.current) next %= 1440;
        else {
          next = 1440;
          setIsPlaying(false);
        }
      }
      timeRef.current = next;
      setCurrentMinute(next);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const restart = useCallback(() => {
    timeRef.current = 0;
    previousRef.current = null;
    setCurrentMinute(0);
    setIsPlaying(true);
  }, []);
  const seek = useCallback((minute: number) => {
    const next = Math.max(0, Math.min(1440, minute));
    timeRef.current = next;
    previousRef.current = null;
    setCurrentMinute(next);
  }, []);
  const setSpeed = useCallback((value: number) => setSpeedState(value), []);

  return {
    currentMinute,
    isPlaying,
    speed,
    progress: currentMinute / 1440,
    play,
    pause,
    restart,
    seek,
    setSpeed,
  };
}
