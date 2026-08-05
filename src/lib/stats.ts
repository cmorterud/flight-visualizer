import type { FlightStats, ProcessedFlight } from "../types/flights";

export interface FlightCountIndex {
  arrivalMinutes: number[];
  departureMinutes: number[];
  startMinutes: number[];
  endMinutes: number[];
}

function upperBound(values: number[], target: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle] <= target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function displayedDayMinute(value: number): number {
  return Math.max(0, Math.min(1440, value));
}

export function createFlightCountIndex(
  flights: ProcessedFlight[],
): FlightCountIndex {
  const arrivals: number[] = [];
  const departures: number[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  for (const flight of flights) {
    starts.push(flight.startMinute);
    ends.push(flight.endMinute);
    if (flight.direction === "arrival")
      arrivals.push(displayedDayMinute(flight.endMinute));
    else departures.push(displayedDayMinute(flight.startMinute));
  }
  const ascending = (a: number, b: number) => a - b;
  return {
    arrivalMinutes: arrivals.sort(ascending),
    departureMinutes: departures.sort(ascending),
    startMinutes: starts.sort(ascending),
    endMinutes: ends.sort(ascending),
  };
}

export function getArrivedCountFromIndex(
  index: FlightCountIndex,
  currentMinute: number,
): number {
  return upperBound(index.arrivalMinutes, currentMinute);
}

export function getDepartedCountFromIndex(
  index: FlightCountIndex,
  currentMinute: number,
): number {
  return upperBound(index.departureMinutes, currentMinute);
}

export function getAirborneCountFromIndex(
  index: FlightCountIndex,
  currentMinute: number,
): number {
  return Math.max(
    0,
    upperBound(index.startMinutes, currentMinute) -
      upperBound(index.endMinutes, currentMinute),
  );
}

export function getArrivedCount(
  flights: ProcessedFlight[],
  currentMinute: number,
): number {
  return getArrivedCountFromIndex(
    createFlightCountIndex(flights),
    currentMinute,
  );
}

export function getDepartedCount(
  flights: ProcessedFlight[],
  currentMinute: number,
): number {
  return getDepartedCountFromIndex(
    createFlightCountIndex(flights),
    currentMinute,
  );
}

export function getAirborneCount(
  flights: ProcessedFlight[],
  currentMinute: number,
): number {
  return getAirborneCountFromIndex(
    createFlightCountIndex(flights),
    currentMinute,
  );
}

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
    if (flight.direction === "arrival" && flight.endMinute <= minute)
      completedArrivals += 1;
    if (flight.direction === "departure" && flight.startMinute <= minute)
      completedDepartures += 1;
  }
  return { active, completedArrivals, completedDepartures };
}
