import type { DatasetManifest } from "../types/flights";

type Props = {
  manifest: DatasetManifest;
  airport: string;
  date: string;
  currentMinute: number;
  isPlaying: boolean;
  speed: number;
  showCompletedRoutes: boolean;
  showAirportMarkers: boolean;
  showActiveCount: boolean;
  showDebug: boolean;
  onAirportChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onPlayPause: () => void;
  onRestart: () => void;
  onSeek: (value: number) => void;
  onSpeedChange: (value: number) => void;
  onToggle: (key: "completed" | "airports" | "active" | "debug") => void;
};

export function Controls(props: Props) {
  const airport =
    props.manifest.airports.find((item) => item.iataCode === props.airport) ??
    props.manifest.airports[0];
  return (
    <section
      className="controls"
      aria-label="Playback and visualization controls"
    >
      <div className="control-row selectors">
        <label>
          Airport
          <select
            value={props.airport}
            onChange={(event) => props.onAirportChange(event.target.value)}
          >
            {props.manifest.airports.map((item) => (
              <option key={item.iataCode} value={item.iataCode}>
                {item.iataCode} — {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <select
            value={props.date}
            onChange={(event) => props.onDateChange(event.target.value)}
          >
            {airport.dates.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Speed
          <select
            value={props.speed}
            onChange={(event) =>
              props.onSpeedChange(Number(event.target.value))
            }
          >
            {[15, 30, 60, 120].map((value) => (
              <option key={value} value={value}>
                {value} min/sec
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="timeline-row">
        <button
          className="play-button"
          type="button"
          onClick={props.onPlayPause}
          aria-label={props.isPlaying ? "Pause animation" : "Play animation"}
        >
          {props.isPlaying ? "Pause" : "Play"}
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={props.onRestart}
        >
          Restart
        </button>
        <label className="timeline-label">
          <span className="sr-only">Timeline</span>
          <input
            type="range"
            min="0"
            max="1440"
            step="1"
            value={Math.min(1440, props.currentMinute)}
            onChange={(event) => props.onSeek(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="toggles">
        <Toggle
          checked={props.showCompletedRoutes}
          label="Completed routes"
          onChange={() => props.onToggle("completed")}
        />
        <Toggle
          checked={props.showAirportMarkers}
          label="Airport markers"
          onChange={() => props.onToggle("airports")}
        />
        <Toggle
          checked={props.showActiveCount}
          label="Active count"
          onChange={() => props.onToggle("active")}
        />
        <Toggle
          checked={props.showDebug}
          label="Debug"
          onChange={() => props.onToggle("debug")}
        />
      </div>
    </section>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span aria-hidden="true" />
      {label}
    </label>
  );
}
