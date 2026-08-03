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
  arrival: [107, 229, 255, 220] as [number, number, number, number],
  departure: [255, 157, 100, 220] as [number, number, number, number],
  airport: [247, 233, 185, 255] as [number, number, number, number],
  completed: [116, 134, 160, 30] as [number, number, number, number],
};
