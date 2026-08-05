export type PacingMode = "linear" | "activity";

export interface RecordingOptions {
  airport: string;
  date: string;
  speed: number;
  autoplay: boolean;
  loop: boolean;
  showHook: boolean;
  pacing: PacingMode;
  showSafeAreas: boolean;
  showDebug: boolean;
}

export const RECORDING_DEFAULTS: RecordingOptions = {
  airport: "DTW",
  date: "mock",
  speed: 60,
  autoplay: false,
  loop: true,
  showHook: false,
  pacing: "linear",
  showSafeAreas: false,
  showDebug: false,
};

const SUPPORTED_SPEEDS = new Set([15, 30, 60, 90, 120]);

function booleanParam(
  params: URLSearchParams,
  name: string,
  fallback: boolean,
): boolean {
  const value = params.get(name)?.toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

export function parseRecordingOptions(
  input: string | URLSearchParams,
): RecordingOptions {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const requestedAirport = (params.get("airport") || "").toUpperCase();
  const requestedSpeed = Number(params.get("speed"));
  const requestedPacing = params.get("pacing");
  return {
    airport: /^[A-Z]{3}$/.test(requestedAirport)
      ? requestedAirport
      : RECORDING_DEFAULTS.airport,
    date: params.get("date")?.trim() || RECORDING_DEFAULTS.date,
    speed: SUPPORTED_SPEEDS.has(requestedSpeed)
      ? requestedSpeed
      : RECORDING_DEFAULTS.speed,
    autoplay: booleanParam(params, "autoplay", RECORDING_DEFAULTS.autoplay),
    loop: booleanParam(params, "loop", RECORDING_DEFAULTS.loop),
    showHook: booleanParam(params, "showHook", RECORDING_DEFAULTS.showHook),
    pacing:
      requestedPacing === "activity" || requestedPacing === "linear"
        ? requestedPacing
        : RECORDING_DEFAULTS.pacing,
    showSafeAreas: booleanParam(
      params,
      "showSafeAreas",
      RECORDING_DEFAULTS.showSafeAreas,
    ),
    showDebug: booleanParam(params, "showDebug", RECORDING_DEFAULTS.showDebug),
  };
}
