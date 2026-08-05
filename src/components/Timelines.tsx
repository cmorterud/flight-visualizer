import { RECORDING_TIMELINE_THEME } from "../data/theme";
import { getRecordingProgress } from "../lib/recordingProgress";

export function RecordingTimeline({
  currentMinute,
}: {
  currentMinute: number;
}) {
  const clampedMinute =
    getRecordingProgress(currentMinute) *
    RECORDING_TIMELINE_THEME.totalMinutes;

  return (
    <div className="recording-timeline" aria-label="24-hour playback progress">
      <div className="recording-timeline-labels" aria-hidden="true">
        <span>{RECORDING_TIMELINE_THEME.startLabel}</span>
        <span>{RECORDING_TIMELINE_THEME.endLabel}</span>
      </div>
      <div
        className="recording-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={RECORDING_TIMELINE_THEME.totalMinutes}
        aria-valuenow={clampedMinute}
      >
        <span
          className="recording-progress-fill"
          style={{ transform: `scaleX(${getRecordingProgress(currentMinute)})` }}
        />
      </div>
    </div>
  );
}

export function InteractiveTimeline({
  currentMinute,
  onSeek,
}: {
  currentMinute: number;
  onSeek: (value: number) => void;
}) {
  return (
    <label className="timeline-label">
      <span className="sr-only">Timeline</span>
      <input
        type="range"
        aria-label="Timeline"
        min="0"
        max={RECORDING_TIMELINE_THEME.totalMinutes}
        step="1"
        value={Math.min(
          RECORDING_TIMELINE_THEME.totalMinutes,
          Math.max(0, currentMinute),
        )}
        onChange={(event) => onSeek(Number(event.target.value))}
      />
    </label>
  );
}
