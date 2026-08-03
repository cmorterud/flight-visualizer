import type { AirportSummary } from "../src/types/flights";

export type AirportCatalogEntry = AirportSummary & { timezone?: string };

// Add an airport here to make it available to the mock-data generator. The
// real-data preprocessor reads its airport catalog from OurAirports CSV.
export const AIRPORTS: Record<string, AirportCatalogEntry> = {
  ATL: {
    iataCode: "ATL",
    name: "Hartsfield–Jackson Atlanta International",
    municipality: "Atlanta",
    coordinate: [-84.4277, 33.6407],
    timezone: "America/New_York",
  },
  JFK: {
    iataCode: "JFK",
    name: "John F. Kennedy International",
    municipality: "New York",
    coordinate: [-73.7781, 40.6413],
  },
  LAX: {
    iataCode: "LAX",
    name: "Los Angeles International",
    municipality: "Los Angeles",
    coordinate: [-118.4085, 33.9416],
  },
  ORD: {
    iataCode: "ORD",
    name: "O'Hare International",
    municipality: "Chicago",
    coordinate: [-87.9073, 41.9742],
  },
  DFW: {
    iataCode: "DFW",
    name: "Dallas Fort Worth International",
    municipality: "Dallas",
    coordinate: [-97.0403, 32.8998],
  },
  DEN: {
    iataCode: "DEN",
    name: "Denver International",
    municipality: "Denver",
    coordinate: [-104.6737, 39.8561],
  },
  DTW: {
    iataCode: "DTW",
    name: "Detroit Metropolitan",
    municipality: "Detroit",
    coordinate: [-83.3534, 42.2162],
    timezone: "America/Detroit",
  },
  MIA: {
    iataCode: "MIA",
    name: "Miami International",
    municipality: "Miami",
    coordinate: [-80.287, 25.7959],
  },
  SEA: {
    iataCode: "SEA",
    name: "Seattle–Tacoma International",
    municipality: "Seattle",
    coordinate: [-122.3088, 47.4502],
  },
  SFO: {
    iataCode: "SFO",
    name: "San Francisco International",
    municipality: "San Francisco",
    coordinate: [-122.379, 37.6213],
  },
  BOS: {
    iataCode: "BOS",
    name: "Boston Logan International",
    municipality: "Boston",
    coordinate: [-71.0096, 42.3656],
  },
  MSP: {
    iataCode: "MSP",
    name: "Minneapolis–Saint Paul International",
    municipality: "Minneapolis",
    coordinate: [-93.2223, 44.8848],
  },
  CLT: {
    iataCode: "CLT",
    name: "Charlotte Douglas International",
    municipality: "Charlotte",
    coordinate: [-80.9431, 35.214],
  },
  IAH: {
    iataCode: "IAH",
    name: "George Bush Intercontinental",
    municipality: "Houston",
    coordinate: [-95.3414, 29.9902],
  },
  PHX: {
    iataCode: "PHX",
    name: "Phoenix Sky Harbor International",
    municipality: "Phoenix",
    coordinate: [-112.0116, 33.4342],
  },
  LAS: {
    iataCode: "LAS",
    name: "Harry Reid International",
    municipality: "Las Vegas",
    coordinate: [-115.1523, 36.084],
  },
  DCA: {
    iataCode: "DCA",
    name: "Ronald Reagan Washington National",
    municipality: "Washington",
    coordinate: [-77.0377, 38.8512],
  },
  BNA: {
    iataCode: "BNA",
    name: "Nashville International",
    municipality: "Nashville",
    coordinate: [-86.6774, 36.1263],
  },
  MCO: {
    iataCode: "MCO",
    name: "Orlando International",
    municipality: "Orlando",
    coordinate: [-81.3081, 28.4312],
  },
  MSY: {
    iataCode: "MSY",
    name: "Louis Armstrong New Orleans International",
    municipality: "New Orleans",
    coordinate: [-90.258, 29.9934],
  },
};
