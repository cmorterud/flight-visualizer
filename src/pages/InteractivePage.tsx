import { useMemo, useState } from "react";
import { Controls } from "../components/Controls";
import { DebugOverlay } from "../components/DebugOverlay";
import { FlightMap } from "../components/FlightMap";
import { FlightStatsPanel } from "../components/FlightStats";
import { StatusView } from "../components/StatusView";
import { useFlightData } from "../hooks/useFlightData";
import { useFps } from "../hooks/useFps";
import { usePlayback } from "../hooks/usePlayback";
import { calculateStats } from "../lib/stats";
import { formatDateLabel } from "../lib/time";

export function InteractivePage() {
  const [airport, setAirport] = useState("ATL");
  const [date, setDate] = useState("mock");
  const [showCompletedRoutes, setShowCompletedRoutes] = useState(true);
  const [showAirportMarkers, setShowAirportMarkers] = useState(false);
  const [showActiveCount, setShowActiveCount] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [zoom, setZoom] = useState(3.2);
  const [mapError, setMapError] = useState<string | null>(null);
  const prefersReducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const playback = usePlayback({
    initialSpeed: 60,
    autoPlay: !prefersReducedMotion,
    autoPlayDelay: 650,
  });
  const { manifest, dataset, file, loading, error } = useFlightData(
    airport,
    date,
  );
  const fps = useFps();
  const stats = useMemo(
    () => calculateStats(dataset?.flights ?? [], playback.currentMinute),
    [dataset, playback.currentMinute],
  );

  if (loading)
    return (
      <StatusView
        title="Preparing the flight day"
        detail="Loading routes, times, and airport coordinates…"
      />
    );
  if (error || !manifest || !dataset)
    return (
      <StatusView
        error
        title="Flight data unavailable"
        detail={error || "No usable flights were found."}
      />
    );
  if (dataset.totalFlights === 0)
    return (
      <StatusView
        error
        title="No flights to show"
        detail="This airport and date combination contains no active flights."
      />
    );

  const handleAirportChange = (value: string) => {
    setAirport(value);
    const next = manifest.airports.find((item) => item.iataCode === value);
    if (next?.dates[0]) setDate(next.dates[0].value);
    playback.pause();
    playback.seek(0);
  };

  return (
    <main className="interactive-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="ATL 24 home">
          <span className="brand-mark">A</span>
          <span>ATL / 24</span>
        </a>
        <a
          className="recording-link"
          href={`${import.meta.env.BASE_URL}recording?airport=ATL&date=mock&speed=60`}
        >
          Open recording view <span>↗</span>
        </a>
      </header>

      <section className="hero-copy">
        <div>
          <p className="eyebrow">A day in motion · {formatDateLabel(date)}</p>
          <h1>
            Every flight.
            <br />
            <em>One pulse.</em>
          </h1>
        </div>
        <p className="intro">
          Watch a full day of arrivals and departures radiate through the
          world’s busiest airport.
        </p>
      </section>

      <div className="interactive-map-frame">
        <FlightMap
          dataset={dataset}
          currentMinute={playback.currentMinute}
          showCompletedRoutes={showCompletedRoutes}
          showAirportMarkers={showAirportMarkers}
          onZoomChange={setZoom}
          onMapError={setMapError}
        />
        <div className="map-key">
          <span className="arrival-dot" />
          Arrivals <span className="departure-dot" />
          Departures
        </div>
        {showActiveCount && (
          <div className="active-pill">
            <strong>{stats.active}</strong>
            <span>airborne</span>
          </div>
        )}
        {mapError && (
          <div className="map-error">
            Map background unavailable. Flight paths are still being rendered.
          </div>
        )}
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
      </div>

      <FlightStatsPanel
        dataset={dataset}
        stats={stats}
        currentMinute={playback.currentMinute}
      />
      <Controls
        manifest={manifest}
        airport={airport}
        date={date}
        currentMinute={playback.currentMinute}
        isPlaying={playback.isPlaying}
        speed={playback.speed}
        showCompletedRoutes={showCompletedRoutes}
        showAirportMarkers={showAirportMarkers}
        showActiveCount={showActiveCount}
        showDebug={showDebug}
        onAirportChange={handleAirportChange}
        onDateChange={(value) => {
          setDate(value);
          playback.seek(0);
        }}
        onPlayPause={() =>
          playback.isPlaying ? playback.pause() : playback.play()
        }
        onRestart={playback.restart}
        onSeek={playback.seek}
        onSpeedChange={playback.setSpeed}
        onToggle={(key) => {
          if (key === "completed") setShowCompletedRoutes((value) => !value);
          if (key === "airports") setShowAirportMarkers((value) => !value);
          if (key === "active") setShowActiveCount((value) => !value);
          if (key === "debug") setShowDebug((value) => !value);
        }}
      />
      <p className="sr-only" aria-live="polite">
        Loaded {dataset.totalFlights} flights at {dataset.airport.name}:{" "}
        {dataset.totalArrivals} arrivals and {dataset.totalDepartures}{" "}
        departures.
      </p>
      <footer>
        <span>Calculated great-circle routes · Not live radar tracks</span>
        <span>Mock flight activity for visualization</span>
      </footer>
    </main>
  );
}
