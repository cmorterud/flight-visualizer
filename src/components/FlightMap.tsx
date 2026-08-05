import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { ErrorEvent, Map as MapLibreMap } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { TripsLayer } from "@deck.gl/geo-layers";
import { PathLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { interpolatePosition } from "../lib/geo";
import { isFlightActive } from "../lib/stats";
import { createDarkMapStyle } from "../data/mapStyle";
import { DECK_COLORS, FLIGHT_VISUAL_THEME } from "../data/theme";
import type {
  Coordinate,
  FlightDayDataset,
  ProcessedFlight,
} from "../types/flights";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  dataset: FlightDayDataset;
  currentMinute: number;
  showCompletedRoutes: boolean;
  showAirportMarkers: boolean;
  compact?: boolean;
  showFullNetwork?: boolean;
  showActiveFlights?: boolean;
  onZoomChange?: (zoom: number) => void;
  onMapError?: (message: string) => void;
  onReady?: () => void;
};

type TripDatum = ProcessedFlight & {
  coordinates: Coordinate[];
  timestamps: number[];
};

export function FlightMap({
  dataset,
  currentMinute,
  showCompletedRoutes,
  showAirportMarkers,
  compact = false,
  showFullNetwork = false,
  showActiveFlights = true,
  onZoomChange,
  onMapError,
  onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [ready, setReady] = useState(false);
  const [pulse, setPulse] = useState<{
    startedAt: number;
    kind: "arrival" | "departure" | "mixed";
  } | null>(null);
  const previousMinuteRef = useRef(currentMinute);
  const lastPulseAtRef = useRef(-Infinity);

  const trips = useMemo<TripDatum[]>(
    () =>
      dataset.flights.map((flight) => ({
        ...flight,
        coordinates: flight.path.map((point) => point.coordinate),
        timestamps: flight.path.map((point) => point.timestamp),
      })),
    [dataset],
  );
  const completedBucket = Math.floor(currentMinute / 5);
  const completed = useMemo(
    () =>
      showCompletedRoutes
        ? showFullNetwork
          ? trips
          : trips.filter((flight) => flight.endMinute <= completedBucket * 5)
        : [],
    [completedBucket, showCompletedRoutes, showFullNetwork, trips],
  );
  const activeHeads = useMemo(
    () =>
      showActiveFlights
        ? dataset.flights
            .filter((flight) => isFlightActive(flight, currentMinute))
            .map((flight) => ({
              flight,
              position: interpolatePosition(flight.path, currentMinute),
            }))
        : [],
    [currentMinute, dataset.flights, showActiveFlights],
  );
  const airportPoints = useMemo(
    () => Object.values(dataset.airports),
    [dataset.airports],
  );
  const airportEvents = useMemo(() => {
    const arrivals: number[] = [];
    const departures: number[] = [];
    for (const flight of dataset.flights) {
      if (flight.direction === "arrival") arrivals.push(flight.endMinute);
      else departures.push(flight.startMinute);
    }
    const ascending = (a: number, b: number) => a - b;
    return {
      arrivals: arrivals.sort(ascending),
      departures: departures.sort(ascending),
    };
  }, [dataset.flights]);

  useEffect(() => {
    const previous = previousMinuteRef.current;
    previousMinuteRef.current = currentMinute;
    if (!showActiveFlights || currentMinute <= previous) return;
    const hasEvent = (values: number[]) => {
      let low = 0;
      let high = values.length;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (values[middle] <= previous) low = middle + 1;
        else high = middle;
      }
      return low < values.length && values[low] <= currentMinute;
    };
    const arrival = hasEvent(airportEvents.arrivals);
    const departure = hasEvent(airportEvents.departures);
    if (!arrival && !departure) return;
    const now = performance.now();
    if (now - lastPulseAtRef.current < FLIGHT_VISUAL_THEME.pulseBatchWindowMs)
      return;
    lastPulseAtRef.current = now;
    setPulse({
      startedAt: now,
      kind: arrival && departure ? "mixed" : arrival ? "arrival" : "departure",
    });
  }, [airportEvents, currentMinute, showActiveFlights]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: createDarkMapStyle(),
        center: [-96.4, 38.1],
        zoom: compact ? 2.6 : 3.2,
        minZoom: 2,
        maxZoom: 7,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
      let readyFrame = 0;
      let readySignaled = false;
      const signalReady = () => {
        if (readySignaled) return;
        readySignaled = true;
        setReady(true);
        onReady?.();
      };
      map.addControl(overlay as unknown as maplibregl.IControl);
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right",
      );
      map.on("style.load", () => {
        readyFrame = requestAnimationFrame(signalReady);
      });
      map.on("zoom", () => onZoomChange?.(map.getZoom()));
      map.on("error", (event: ErrorEvent) => {
        if (!map.loaded())
          onMapError?.(event.error?.message || "The map could not initialize.");
      });
      mapRef.current = map;
      overlayRef.current = overlay;
      readyFrame = requestAnimationFrame(() => {
        readyFrame = requestAnimationFrame(signalReady);
      });
      return () => {
        cancelAnimationFrame(readyFrame);
        overlay.finalize();
        map.remove();
        mapRef.current = null;
        overlayRef.current = null;
      };
    } catch (error) {
      onMapError?.((error as Error).message);
    }
  }, [compact, onMapError, onReady, onZoomChange]);

  useEffect(() => {
    if (!overlayRef.current) return;
    const trailLength = compact ? 85 : 72;
    const pulseProgress = pulse
      ? Math.min(
          1,
          (performance.now() - pulse.startedAt) /
            FLIGHT_VISUAL_THEME.pulseDurationMs,
        )
      : 1;
    const pulseColor: [number, number, number, number] =
      pulse?.kind === "arrival"
        ? [107, 229, 255, Math.round(125 * (1 - pulseProgress))]
        : pulse?.kind === "departure"
          ? [255, 157, 100, Math.round(125 * (1 - pulseProgress))]
          : [247, 233, 185, Math.round(105 * (1 - pulseProgress))];
    overlayRef.current.setProps({
      layers: [
        showCompletedRoutes &&
          new PathLayer<TripDatum>({
            id: "completed-routes",
            data: completed,
            getPath: (flight) => flight.coordinates,
            getColor: DECK_COLORS.completed,
            getWidth: FLIGHT_VISUAL_THEME.completedRouteWidthPixels,
            widthMinPixels: 0.6,
            widthMaxPixels: 1.5,
            opacity: FLIGHT_VISUAL_THEME.completedRouteOpacity,
            pickable: false,
          }),
        showActiveFlights &&
          new TripsLayer<TripDatum>({
            id: "active-trips",
            data: trips,
            getPath: (flight) => flight.coordinates,
            getTimestamps: (flight) => flight.timestamps,
            getColor: (flight) =>
              flight.direction === "arrival"
                ? DECK_COLORS.arrival
                : DECK_COLORS.departure,
            currentTime: currentMinute,
            trailLength,
            widthMinPixels: compact
              ? FLIGHT_VISUAL_THEME.activeTrailWidthPixels
              : 1.3,
            widthMaxPixels: 3,
            opacity: FLIGHT_VISUAL_THEME.activeTrailOpacity,
            capRounded: true,
            jointRounded: true,
            pickable: false,
          }),
        showActiveFlights &&
          new ScatterplotLayer({
            id: "active-heads",
            data: activeHeads,
            getPosition: (item) => item.position,
            getFillColor: (item) =>
              item.flight.direction === "arrival"
                ? DECK_COLORS.arrival
                : DECK_COLORS.departure,
            getRadius: compact ? 10500 : 7600,
            radiusMinPixels: compact
              ? FLIGHT_VISUAL_THEME.activeHeadRadiusPixels
              : 2.5,
            radiusMaxPixels: 5,
            stroked: false,
            opacity: FLIGHT_VISUAL_THEME.activeHeadOpacity,
            pickable: false,
          }),
        showAirportMarkers &&
          new ScatterplotLayer({
            id: "airport-markers",
            data: airportPoints.filter(
              (airport) => airport.iataCode !== dataset.airport.iataCode,
            ),
            getPosition: (airport) => airport.coordinate,
            getRadius: 8000,
            radiusMinPixels: 1.2,
            radiusMaxPixels: 2.2,
            getFillColor: [148, 164, 188, 105],
            pickable: false,
          }),
        showActiveFlights &&
          pulseProgress < 1 &&
          new ScatterplotLayer({
            id: "airport-event-pulse",
            data: [dataset.airport],
            getPosition: (airport) => airport.coordinate,
            getRadius: 18000 + pulseProgress * 17000,
            radiusMinPixels: 6,
            radiusMaxPixels: 14,
            filled: false,
            stroked: true,
            getLineColor: pulseColor,
            lineWidthMinPixels: 1,
            pickable: false,
          }),
        new ScatterplotLayer({
          id: "airport-marker",
          data: [dataset.airport],
          getPosition: (airport) => airport.coordinate,
          getRadius: 12500,
          radiusMinPixels: 4,
          radiusMaxPixels: 7,
          getFillColor: DECK_COLORS.airport,
          pickable: false,
        }),
        new TextLayer({
          id: "airport-label",
          data: [dataset.airport],
          getPosition: (airport) => airport.coordinate,
          getText: (airport) => airport.iataCode,
          getColor: [247, 233, 185, 255],
          getSize: compact ? 15 : 13,
          getPixelOffset: [0, -17],
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontWeight: 700,
          fontSettings: { sdf: true },
          outlineColor: [7, 11, 19, 255],
          outlineWidth: 4,
          pickable: false,
        }),
      ].filter(Boolean),
    });
  }, [
    activeHeads,
    airportPoints,
    compact,
    completed,
    currentMinute,
    dataset.airport,
    pulse,
    showActiveFlights,
    showFullNetwork,
    showAirportMarkers,
    showCompletedRoutes,
    trips,
  ]);

  return (
    <div className="map-shell">
      <div
        ref={containerRef}
        className="map-canvas"
        aria-label={`Animated flight map centered on ${dataset.airport.iataCode}`}
      />
      {!ready && (
        <div className="map-loading">
          <span />
          Preparing flight map…
        </div>
      )}
      <div className="map-vignette" aria-hidden="true" />
    </div>
  );
}
