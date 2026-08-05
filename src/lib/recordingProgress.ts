export const RECORDING_TOTAL_MINUTES = 1440;

export function getRecordingProgress(currentMinute: number): number {
  if (!Number.isFinite(currentMinute)) return 0;
  return Math.max(
    0,
    Math.min(1, currentMinute / RECORDING_TOTAL_MINUTES),
  );
}
