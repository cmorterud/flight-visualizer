import { greatCirclePath } from "./geo";
import { resolveFlightTimes } from "./time";
import type {
  AirportSummary,
  FlightDayDataset,
  ProcessedFlight,
} from "../types/flights";

export const FLIGHT_FIELDS = {
  date: ["FlightDate", "FL_DATE"],
  airline: ["Reporting_Airline", "OP_UNIQUE_CARRIER", "Carrier"],
  number: ["Flight_Number_Reporting_Airline", "OP_CARRIER_FL_NUM", "FlightNum"],
  origin: ["Origin", "ORIGIN"],
  destination: ["Dest", "DEST"],
  scheduledDeparture: ["CRSDepTime", "CRS_DEP_TIME"],
  actualDeparture: ["DepTime", "DEP_TIME"],
  scheduledArrival: ["CRSArrTime", "CRS_ARR_TIME"],
  actualArrival: ["ArrTime", "ARR_TIME"],
  scheduledElapsed: ["CRSElapsedTime", "CRS_ELAPSED_TIME"],
  actualElapsed: ["ActualElapsedTime", "ACTUAL_ELAPSED_TIME"],
  cancelled: ["Cancelled", "CANCELLED"],
  diverted: ["Diverted", "DIVERTED"],
  distance: ["Distance", "DISTANCE"],
} as const;

export const AIRPORT_FIELDS = {
  ident: ["ident"],
  iata: ["iata_code", "iata"],
  name: ["name"],
  latitude: ["latitude_deg", "latitude"],
  longitude: ["longitude_deg", "longitude"],
  municipality: ["municipality", "city"],
  country: ["iso_country", "country"],
  type: ["type"],
} as const;

type Row = Record<string, string>;

function get(row: Row, candidates: readonly string[]): string {
  for (const candidate of candidates) {
    if (row[candidate] !== undefined) return String(row[candidate]).trim();
  }
  return "";
}

function isTruthyFlag(value: string): boolean {
  return (
    value === "1" ||
    value.toLowerCase() === "true" ||
    value.toLowerCase() === "yes"
  );
}

export function parseAirports(rows: Row[]): Record<string, AirportSummary> {
  const airports: Record<string, AirportSummary> = {};
  for (const row of rows) {
    const iataCode = get(row, AIRPORT_FIELDS.iata).toUpperCase();
    const latitude = Number(get(row, AIRPORT_FIELDS.latitude));
    const longitude = Number(get(row, AIRPORT_FIELDS.longitude));
    if (
      !/^[A-Z]{3}$/.test(iataCode) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    )
      continue;
    airports[iataCode] = {
      iataCode,
      name: get(row, AIRPORT_FIELDS.name) || iataCode,
      municipality: get(row, AIRPORT_FIELDS.municipality) || undefined,
      coordinate: [longitude, latitude],
    };
  }
  return airports;
}

export function filterFlightRows(
  rows: Row[],
  airport: string,
  date: string,
): Row[] {
  return rows.filter((row) => {
    const origin = get(row, FLIGHT_FIELDS.origin).toUpperCase();
    const destination = get(row, FLIGHT_FIELDS.destination).toUpperCase();
    return (
      get(row, FLIGHT_FIELDS.date) === date &&
      (origin === airport || destination === airport)
    );
  });
}

export function buildDataset(
  flightRows: Row[],
  airports: Record<string, AirportSummary>,
  selectedAirport: string,
  date: string,
  timezone = "America/New_York",
): FlightDayDataset {
  const airport = airports[selectedAirport];
  if (!airport)
    throw new Error(
      `Airport ${selectedAirport} does not have valid coordinates.`,
    );

  const flights: ProcessedFlight[] = [];
  const usedAirports: Record<string, AirportSummary> = {
    [selectedAirport]: airport,
  };
  for (const [index, row] of filterFlightRows(
    flightRows,
    selectedAirport,
    date,
  ).entries()) {
    if (
      isTruthyFlag(get(row, FLIGHT_FIELDS.cancelled)) ||
      isTruthyFlag(get(row, FLIGHT_FIELDS.diverted))
    )
      continue;
    const origin = get(row, FLIGHT_FIELDS.origin).toUpperCase();
    const destination = get(row, FLIGHT_FIELDS.destination).toUpperCase();
    const originAirport = airports[origin];
    const destinationAirport = airports[destination];
    if (!originAirport || !destinationAirport) continue;
    const direction = origin === selectedAirport ? "departure" : "arrival";
    const times = resolveFlightTimes({
      direction,
      actualDeparture: get(row, FLIGHT_FIELDS.actualDeparture),
      scheduledDeparture: get(row, FLIGHT_FIELDS.scheduledDeparture),
      actualArrival: get(row, FLIGHT_FIELDS.actualArrival),
      scheduledArrival: get(row, FLIGHT_FIELDS.scheduledArrival),
      actualElapsed: get(row, FLIGHT_FIELDS.actualElapsed),
      scheduledElapsed: get(row, FLIGHT_FIELDS.scheduledElapsed),
    });
    if (!times || times.endMinute <= 0 || times.startMinute >= 1440) continue;
    const airline = get(row, FLIGHT_FIELDS.airline) || "--";
    const flightNumber = get(row, FLIGHT_FIELDS.number) || undefined;
    const durationMinutes = times.endMinute - times.startMinute;
    usedAirports[origin] = originAirport;
    usedAirports[destination] = destinationAirport;
    flights.push({
      id: `${airline}${flightNumber || index}-${date}-${origin}-${destination}`,
      flightDate: date,
      airline,
      flightNumber,
      origin,
      destination,
      direction,
      startMinute: times.startMinute,
      endMinute: times.endMinute,
      durationMinutes,
      distanceMiles: Number(get(row, FLIGHT_FIELDS.distance)) || undefined,
      path: greatCirclePath(
        originAirport.coordinate,
        destinationAirport.coordinate,
        times.startMinute,
        times.endMinute,
      ),
    });
  }

  const totalArrivals = flights.filter(
    (flight) => flight.direction === "arrival",
  ).length;
  return {
    airport,
    date,
    timezone,
    generatedAt: new Date().toISOString(),
    totalFlights: flights.length,
    totalArrivals,
    totalDepartures: flights.length - totalArrivals,
    airports: usedAirports,
    flights,
  };
}
