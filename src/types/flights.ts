export type Coordinate = [longitude: number, latitude: number];

export type FlightDirection = "arrival" | "departure";

export interface FlightPathPoint {
  coordinate: Coordinate;
  timestamp: number;
}

export interface ProcessedFlight {
  id: string;
  flightDate: string;
  airline: string;
  flightNumber?: string;
  origin: string;
  destination: string;
  direction: FlightDirection;
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
  distanceMiles?: number;
  path: FlightPathPoint[];
}

export interface AirportSummary {
  iataCode: string;
  name: string;
  municipality?: string;
  coordinate: Coordinate;
}

export interface FlightDayDataset {
  airport: AirportSummary;
  date: string;
  timezone: string;
  generatedAt: string;
  totalFlights: number;
  totalArrivals: number;
  totalDepartures: number;
  airports: Record<string, AirportSummary>;
  flights: ProcessedFlight[];
}

export interface DatasetManifest {
  airports: Array<{
    iataCode: string;
    name: string;
    dates: Array<{ value: string; label: string; file: string }>;
  }>;
}

export interface FlightStats {
  active: number;
  completedArrivals: number;
  completedDepartures: number;
}
