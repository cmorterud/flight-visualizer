import { mkdir, writeFile } from "node:fs/promises";
import { greatCirclePath, distanceMiles } from "../src/lib/geo";
import type { FlightDayDataset, ProcessedFlight } from "../src/types/flights";
import { AIRPORTS } from "./airports";

let seed = 240515;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const destinations = Object.keys(AIRPORTS).filter((code) => code !== "ATL");
const carriers = ["DL", "WN", "AA", "UA", "NK", "F9"];
const waveCenters = [390, 520, 710, 930, 1110, 1300];
const flightCount = 240;
const flights: ProcessedFlight[] = [];

for (let index = 0; index < flightCount; index += 1) {
  const direction = index % 2 === 0 ? "departure" : "arrival";
  const destinationCode =
    destinations[Math.floor(random() * destinations.length)];
  const destination = AIRPORTS[destinationCode];
  const wave = waveCenters[index % waveCenters.length];
  const endpointMinute = Math.round(
    wave + (random() - 0.5) * 150 + Math.floor(index / waveCenters.length) * 4,
  );
  const miles = Math.round(
    distanceMiles(AIRPORTS.ATL.coordinate, destination.coordinate),
  );
  const duration = Math.round(42 + miles / 8.8 + random() * 22);
  const startMinute =
    direction === "departure" ? endpointMinute : endpointMinute - duration;
  const endMinute =
    direction === "departure" ? endpointMinute + duration : endpointMinute;
  const origin = direction === "departure" ? "ATL" : destinationCode;
  const arrival = direction === "departure" ? destinationCode : "ATL";
  const airline = carriers[Math.floor(random() * carriers.length)];
  flights.push({
    id: `${airline}${1000 + index}-${origin}-${arrival}`,
    flightDate: "2026-05-15",
    airline,
    flightNumber: String(1000 + index),
    origin,
    destination: arrival,
    direction,
    startMinute,
    endMinute,
    durationMinutes: duration,
    distanceMiles: miles,
    path: greatCirclePath(
      AIRPORTS[origin].coordinate,
      AIRPORTS[arrival].coordinate,
      startMinute,
      endMinute,
      miles > 1800 ? 60 : 48,
    ),
  });
}

flights.sort((a, b) => a.startMinute - b.startMinute);
const dataset: FlightDayDataset = {
  airport: AIRPORTS.ATL,
  date: "2026-05-15",
  timezone: "America/New_York",
  generatedAt: "2026-05-15T00:00:00.000Z",
  totalFlights: flights.length,
  totalArrivals: flights.filter((flight) => flight.direction === "arrival")
    .length,
  totalDepartures: flights.filter((flight) => flight.direction === "departure")
    .length,
  airports: AIRPORTS,
  flights,
};

await mkdir("public/data/ATL", { recursive: true });
await writeFile("public/data/ATL/mock.json", JSON.stringify(dataset));
await writeFile("public/data/ATL/2026-05-15.json", JSON.stringify(dataset));
await writeFile(
  "public/data/manifest.json",
  JSON.stringify({
    airports: [
      {
        iataCode: "ATL",
        name: AIRPORTS.ATL.name,
        dates: [
          {
            value: "mock",
            label: "Representative day",
            file: "/data/ATL/mock.json",
          },
          {
            value: "2026-05-15",
            label: "May 15, 2026",
            file: "/data/ATL/2026-05-15.json",
          },
        ],
      },
    ],
  }),
);

console.log(`Generated ${flightCount} deterministic ATL flights.`);
