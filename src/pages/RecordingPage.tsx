import { useMemo, useState } from "react";
import { DebugOverlay } from "../components/DebugOverlay";
import { FlightMap } from "../components/FlightMap";
import { StatusView } from "../components/StatusView";
import { useFlightData } from "../hooks/useFlightData";
import { useFps } from "../hooks/useFps";
import { usePlayback } from "../hooks/usePlayback";
import { calculateStats } from "../lib/stats";
import { formatClock } from "../lib/time";

function booleanParam(
  params: URLSearchParams,
  name: string,
  fallback: boolean,
): boolean {
  const value = params.get(name);
  if (value === null) return fallback;
  return value !== "false";
}

export function RecordingPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const airport = (params.get("airport") || "ATL").toUpperCase();
  const date = params.get("date") || "mock";
  const requestedSpeed = Number(params.get("speed") || 60);
  const speed = [15, 30, 60, 120].includes(requestedSpeed)
    ? requestedSpeed
    : 60;
  const autoplay = booleanParam(params, "autoplay", true);
  const loop = booleanParam(params, "loop", true);
  const showDebug = booleanParam(params, "showDebug", false);
  const [zoom, setZoom] = useState(2.6);
  const [mapError, setMapError] = useState<string | null>(null);
  const playback = usePlayback({
    initialSpeed: speed,
    autoPlay: autoplay,
    loop,
    autoPlayDelay: 1000,
  });
  const { dataset, file, loading, error } = useFlightData(airport, date);
  const fps = useFps();
  const stats = useMemo(
    () => calculateStats(dataset?.flights ?? [], playback.currentMinute),
    [dataset, playback.currentMinute],
  );

  if (![15, 30, 60, 120].includes(requestedSpeed))
    return (
      <StatusView
        error
        title="Invalid recording speed"
        detail="Use 15, 30, 60, or 120 simulated minutes per second."
      />
    );
  if (loading)
    return (
      <StatusView
        title="Preparing the recording"
        detail="Composing a full day of ATL flight activity…"
      />
    );
  if (error || !dataset)
    return (
      <StatusView
        error
        title="Recording unavailable"
        detail={error || "The flight dataset could not be loaded."}
      />
    );

  const finished = playback.currentMinute >= 1439;
  return (
    <main className="recording-stage">
      <section
        className="recording-canvas"
        aria-label="Vertical ATL flight activity recording composition"
      >
        <header className="recording-header">
          <div className="recording-index">
            <span>ATL</span>
            <small>
              33.6407° N<br />
              84.4277° W
            </small>
          </div>
          <p>
            {finished
              ? `${dataset.totalFlights} flights in one day`
              : "Every flight at ATL"}
          </p>
          <h1>
            Over
            <br />
            <em>24 hours</em>
          </h1>
        </header>

        <div className="recording-time">
          <strong>{formatClock(playback.currentMinute)}</strong>
          <span>
            <i /> {stats.active} flights airborne
          </span>
        </div>

        <div className="recording-map">
          <FlightMap
            compact
            dataset={dataset}
            currentMinute={playback.currentMinute}
            showCompletedRoutes
            showAirportMarkers={false}
            onZoomChange={setZoom}
            onMapError={setMapError}
          />
          <div className="recording-map-label west">PACIFIC</div>
          <div className="recording-map-label east">ATLANTIC</div>
          <div className="recording-key">
            <span className="arrival-dot" />
            Inbound <span className="departure-dot" />
            Outbound
          </div>
          {mapError && <div className="map-error">Basemap unavailable</div>}
        </div>

        <footer className="recording-footer">
          <div>
            <strong>{dataset.totalArrivals}</strong>
            <span>Arrivals</span>
          </div>
          <div className="footer-rule" />
          <div>
            <strong>{dataset.totalDepartures}</strong>
            <span>Departures</span>
          </div>
          <p>
            Representative domestic flight activity · Calculated great-circle
            routes
          </p>
        </footer>
        <div className="recording-progress">
          <span style={{ width: `${playback.progress * 100}%` }} />
        </div>
        {showDebug && (
          <DebugOverlay
            minute={playback.currentMinute}
            active={stats.active}
            paths={dataset.totalFlights}
            file={file}
            fps={fps}
            zoom={zoom}
            speed={playback.speed}
          />
        )}
      </section>
    </main>
  );
}
