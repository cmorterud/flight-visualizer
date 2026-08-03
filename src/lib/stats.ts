import type { FlightStats, ProcessedFlight } from "../types/flights";

export function isFlightActive(
  flight: ProcessedFlight,
  minute: number,
): boolean {
  return flight.startMinute <= minute && flight.endMinute > minute;
}

export function calculateStats(
  flights: ProcessedFlight[],
  minute: number,
): FlightStats {
  let active = 0;
  let completedArrivals = 0;
  let completedDepartures = 0;
  for (const flight of flights) {
    if (isFlightActive(flight, minute)) active += 1;
    if (flight.endMinute <= minute) {
      if (flight.direction === "arrival") completedArrivals += 1;
      else completedDepartures += 1;
    }
  }
  return { active, completedArrivals, completedDepartures };
}
