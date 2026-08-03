import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type {
  ErrorEvent,
  Map as MapLibreMap,
  StyleSpecification,
} from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { TripsLayer } from "@deck.gl/geo-layers";
import { PathLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { interpolatePosition } from "../lib/geo";
import { isFlightActive } from "../lib/stats";
import { DECK_COLORS } from "../data/theme";
import type {
  Coordinate,
  FlightDayDataset,
  ProcessedFlight,
} from "../types/flights";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [
    {
      id: "carto-dark",
      type: "raster",
      source: "carto",
      paint: { "raster-opacity": 0.72 },
    },
  ],
};

type Props = {
  dataset: FlightDayDataset;
  currentMinute: number;
  showCompletedRoutes: boolean;
  showAirportMarkers: boolean;
  compact?: boolean;
  onZoomChange?: (zoom: number) => void;
  onMapError?: (message: string) => void;
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
  onZoomChange,
  onMapError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [ready, setReady] = useState(false);

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
        ? trips.filter((flight) => flight.endMinute <= completedBucket * 5)
        : [],
    [completedBucket, showCompletedRoutes, trips],
  );
  const activeHeads = useMemo(
    () =>
      dataset.flights
        .filter((flight) => isFlightActive(flight, currentMinute))
        .map((flight) => ({
          flight,
          position: interpolatePosition(flight.path, currentMinute),
        })),
    [currentMinute, dataset.flights],
  );
  const airportPoints = useMemo(
    () => Object.values(dataset.airports),
    [dataset.airports],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [-96.4, 38.1],
        zoom: compact ? 2.6 : 3.2,
        minZoom: 2,
        maxZoom: 7,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
      map.addControl(overlay as unknown as maplibregl.IControl);
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right",
      );
      map.on("load", () => setReady(true));
      map.on("zoom", () => onZoomChange?.(map.getZoom()));
      map.on("error", (event: ErrorEvent) => {
        if (!map.loaded())
          onMapError?.(event.error?.message || "The map could not initialize.");
      });
      mapRef.current = map;
      overlayRef.current = overlay;
      return () => {
        overlay.finalize();
        map.remove();
        mapRef.current = null;
        overlayRef.current = null;
      };
    } catch (error) {
      onMapError?.((error as Error).message);
    }
  }, [compact, onMapError, onZoomChange]);

  useEffect(() => {
    if (!overlayRef.current) return;
    const trailLength = compact ? 85 : 72;
    overlayRef.current.setProps({
      layers: [
        showCompletedRoutes &&
          new PathLayer<TripDatum>({
            id: "completed-routes",
            data: completed,
            getPath: (flight) => flight.coordinates,
            getColor: DECK_COLORS.completed,
            getWidth: compact ? 1.4 : 1,
            widthMinPixels: 0.6,
            widthMaxPixels: 1.5,
            opacity: 0.42,
            pickable: false,
          }),
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
          widthMinPixels: compact ? 1.6 : 1.3,
          widthMaxPixels: 3,
          opacity: 0.78,
          capRounded: true,
          jointRounded: true,
          pickable: false,
        }),
        new ScatterplotLayer({
          id: "active-heads",
          data: activeHeads,
          getPosition: (item) => item.position,
          getFillColor: (item) =>
            item.flight.direction === "arrival"
              ? DECK_COLORS.arrival
              : DECK_COLORS.departure,
          getRadius: compact ? 10500 : 7600,
          radiusMinPixels: compact ? 2.2 : 2,
          radiusMaxPixels: 5,
          stroked: false,
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
        new ScatterplotLayer({
          id: "atl-pulse",
          data: [dataset.airport],
          getPosition: (airport) => airport.coordinate,
          getRadius: 29000 + Math.sin(currentMinute * 0.2) * 9000,
          radiusMinPixels: 9,
          radiusMaxPixels: 22,
          filled: false,
          stroked: true,
          getLineColor: [247, 233, 185, 100],
          lineWidthMinPixels: 1,
          pickable: false,
        }),
        new ScatterplotLayer({
          id: "atl-marker",
          data: [dataset.airport],
          getPosition: (airport) => airport.coordinate,
          getRadius: 12500,
          radiusMinPixels: 4,
          radiusMaxPixels: 7,
          getFillColor: DECK_COLORS.airport,
          pickable: false,
        }),
        new TextLayer({
          id: "atl-label",
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
