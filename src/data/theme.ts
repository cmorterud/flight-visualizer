export const THEME = {
  background: "#070b13",
  panel: "#0b111d",
  ink: "#f2f4ed",
  muted: "#8c97a8",
  grid: "#1a2637",
  arrival: "#6be5ff",
  departure: "#ff9d64",
  airport: "#f7e9b9",
  completed: "#8390a6",
} as const;

export const DECK_COLORS = {
  arrival: [107, 229, 255, 255] as [number, number, number, number],
  departure: [255, 157, 100, 255] as [number, number, number, number],
  airport: [247, 233, 185, 255] as [number, number, number, number],
  completed: [116, 134, 160, 255] as [number, number, number, number],
};

export const FLIGHT_VISUAL_THEME = {
  activeHeadOpacity: 1,
  activeTrailOpacity: 0.72,
  completedRouteOpacity: 0.14,
  activeHeadRadiusPixels: 4,
  activeTrailWidthPixels: 2,
  completedRouteWidthPixels: 1.2,
  basemapOpacity: 0.79,
  pulseDurationMs: 520,
  pulseBatchWindowMs: 250,
} as const;
