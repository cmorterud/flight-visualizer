import type { PacingMode } from "./recordingOptions";

const DAY_MINUTES = 1440;
const ACTIVITY_SEGMENTS = [
  { start: 0, end: 300, baseRate: 120 },
  { start: 300, end: 1320, baseRate: 55 },
  { start: 1320, end: 1440, baseRate: 90 },
] as const;

export function getTotalPlaybackDuration(
  pacing: PacingMode,
  speed: number,
): number {
  if (pacing === "linear") return DAY_MINUTES / speed;
  const scale = speed / 60;
  return ACTIVITY_SEGMENTS.reduce(
    (total, segment) =>
      total + (segment.end - segment.start) / (segment.baseRate * scale),
    0,
  );
}

export function getSimulationMinuteForElapsedTime(
  elapsedRealSeconds: number,
  pacing: PacingMode,
  speed: number,
): number {
  const elapsed = Math.max(0, elapsedRealSeconds);
  if (pacing === "linear") return Math.min(DAY_MINUTES, elapsed * speed);

  const scale = speed / 60;
  let remaining = elapsed;
  for (const segment of ACTIVITY_SEGMENTS) {
    const rate = segment.baseRate * scale;
    const duration = (segment.end - segment.start) / rate;
    if (remaining <= duration) {
      return Math.min(DAY_MINUTES, segment.start + remaining * rate);
    }
    remaining -= duration;
  }
  return DAY_MINUTES;
}
