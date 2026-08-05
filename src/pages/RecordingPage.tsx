import { useCallback, useEffect, useMemo, useState } from "react";
import { DebugOverlay } from "../components/DebugOverlay";
import { FlightMap } from "../components/FlightMap";
import { StatusView } from "../components/StatusView";
import { useFlightData } from "../hooks/useFlightData";
import { useFps } from "../hooks/useFps";
import { useRecordingPlayback } from "../hooks/useRecordingPlayback";
import { getAirborneCopy, getHookCopy, getRecordingCopy } from "../lib/copy";
import { parseRecordingOptions } from "../lib/recordingOptions";
import {
  createFlightCountIndex,
  getAirborneCountFromIndex,
  getArrivedCountFromIndex,
  getDepartedCountFromIndex,
} from "../lib/stats";
import { formatClock } from "../lib/time";

export function RecordingPage() {
  const options = useMemo(
    () => parseRecordingOptions(window.location.search),
    [],
  );
  const [zoom, setZoom] = useState(2.6);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(!document.fonts);
  const handleMapReady = useCallback(() => setMapReady(true), []);
  const { dataset, airportCode, file, loading, error } = useFlightData(
    options.airport,
    options.date,
  );
  const fps = useFps();

  useEffect(() => {
    let cancelled = false;
    if (!document.fonts) return;
    void document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = Boolean(dataset) && mapReady && fontsReady;
  const playback = useRecordingPlayback({
    ready,
    autoplay: options.autoplay,
    loop: options.loop,
    showHook: options.showHook,
    pacing: options.pacing,
    speed: options.speed,
  });
  const countIndex = useMemo(
    () => createFlightCountIndex(dataset?.flights ?? []),
    [dataset],
  );
  const counts = useMemo(
    () => ({
      active: getAirborneCountFromIndex(countIndex, playback.currentMinute),
      arrived: getArrivedCountFromIndex(countIndex, playback.currentMinute),
      departed: getDepartedCountFromIndex(countIndex, playback.currentMinute),
    }),
    [countIndex, playback.currentMinute],
  );

  if (loading)
    return (
      <StatusView
        title="Preparing the recording"
        detail="Composing a full day of flight activity…"
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

  const copy = getRecordingCopy(dataset.metadata);
  const hookCopy = getHookCopy(dataset.metadata);
  const isHook = playback.phase === "hook";
  const isComplete = playback.phase === "complete";
  const showFullNetwork = isHook || isComplete;
  const showTelemetry = playback.phase === "playing" || isComplete;
  const displayedClockMinute = isComplete ? 1439 : playback.currentMinute;

  return (
    <main className="recording-stage">
      <section
        className={`recording-canvas phase-${playback.phase}`}
        aria-label={`Vertical ${airportCode} flight activity recording composition`}
        aria-busy={!ready}
      >
        <header className="recording-header" aria-hidden={isHook}>
          <div className="recording-index">
            <span>{airportCode}</span>
          </div>
          <p>{copy.eyebrow}</p>
          {copy.dateLine && (
            <strong className="recording-date">{copy.dateLine}</strong>
          )}
          <h1>
            {copy.headline}
            <br />
            <em>{copy.headlineEmphasis}</em>
          </h1>
        </header>

        <div className="recording-time" aria-hidden={!showTelemetry}>
          <strong>{formatClock(displayedClockMinute)}</strong>
          <span>
            <i /> <b>{getAirborneCopy(counts.active)}</b>
          </span>
        </div>

        <div className="recording-map">
          <FlightMap
            compact
            dataset={dataset}
            currentMinute={playback.currentMinute}
            showCompletedRoutes
            showAirportMarkers={false}
            showFullNetwork={showFullNetwork}
            showActiveFlights={playback.phase === "playing"}
            onZoomChange={setZoom}
            onMapError={setMapError}
            onReady={handleMapReady}
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

        <footer className="recording-footer" aria-hidden={isHook}>
          <div>
            <strong>{counts.arrived}</strong>
            <span>Arrived</span>
          </div>
          <div className="footer-rule" />
          <div>
            <strong>{counts.departed}</strong>
            <span>Departed</span>
          </div>
        </footer>

        {isHook && (
          <div className="recording-hook">
            {hookCopy.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        )}

        <div className="recording-progress" aria-hidden="true">
          <span
            style={{ width: `${(playback.currentMinute / 1440) * 100}%` }}
          />
        </div>

        <nav
          className="recording-controls"
          aria-label="Recording playback controls"
        >
          <button
            type="button"
            className="recording-control-primary"
            onClick={playback.play}
            disabled={!ready || playback.isPlaying}
          >
            Start
          </button>
          <button
            type="button"
            onClick={playback.pause}
            disabled={!playback.isPlaying}
          >
            Pause
          </button>
          <button type="button" onClick={playback.reset} disabled={!ready}>
            Reset
          </button>
        </nav>

        {!ready && (
          <div className="recording-ready-cover" role="status">
            Preparing map and typography…
          </div>
        )}

        {options.showSafeAreas && (
          <div className="recording-safe-areas" aria-hidden="true">
            <span className="safe-top" />
            <span className="safe-right" />
            <span className="safe-bottom" />
            <span className="safe-left" />
          </div>
        )}

        {options.showDebug && (
          <DebugOverlay
            minute={playback.currentMinute}
            active={counts.active}
            arrived={counts.arrived}
            departed={counts.departed}
            paths={dataset.totalFlights}
            file={file}
            fps={fps}
            zoom={zoom}
            speed={options.speed}
            phase={playback.phase}
            pacing={options.pacing}
            elapsed={playback.elapsedPlaybackSeconds}
            expectedDuration={playback.expectedPlaybackSeconds}
          />
        )}

        <p className="sr-only" aria-live="polite">
          Loaded {dataset.totalFlights} flights at {dataset.airport.name}:{" "}
          {dataset.totalArrivals} inbound and {dataset.totalDepartures}{" "}
          outbound.
        </p>
      </section>
    </main>
  );
}
