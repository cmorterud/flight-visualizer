import { mkdir, writeFile } from "node:fs/promises";
import { greatCirclePath, distanceMiles } from "../src/lib/geo";
import type { FlightDayDataset, ProcessedFlight } from "../src/types/flights";
import { AIRPORTS } from "./airports";
import { updateManifest } from "./manifest";

function argsToRecord(values: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index]?.replace(/^--/, "");
    const value = values[index + 1];
    if (key && value) result[key] = value;
  }
  return result;
}

function seededRandom(key: string): () => number {
  let seed = 2166136261;
  for (const character of key) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const args = argsToRecord(process.argv.slice(2));
const selectedCode = (args.airport || "ATL").toUpperCase();
const date = args.date || "2026-05-15";
const flightCount = Number(args.count || 240);
const selectedAirport = AIRPORTS[selectedCode];

if (!selectedAirport) {
  throw new Error(
    `Unknown mock airport ${selectedCode}. Add it to scripts/airports.ts first.`,
  );
}
if (!Number.isInteger(flightCount) || flightCount < 150) {
  throw new Error("--count must be an integer of at least 150 flights.");
}

const random = seededRandom(`${selectedCode}-${date}-${flightCount}`);
const destinations = Object.keys(AIRPORTS).filter(
  (code) => code !== selectedCode,
);
const carriers = ["DL", "WN", "AA", "UA", "NK", "F9"];
const waveCenters = [390, 520, 710, 930, 1110, 1300];
const flights: ProcessedFlight[] = [];

for (let index = 0; index < flightCount; index += 1) {
  const direction = index % 2 === 0 ? "departure" : "arrival";
  const otherCode = destinations[Math.floor(random() * destinations.length)];
  const otherAirport = AIRPORTS[otherCode];
  const wave = waveCenters[index % waveCenters.length];
  const endpointMinute = Math.round(
    wave + (random() - 0.5) * 150 + Math.floor(index / waveCenters.length) * 4,
  );
  const miles = Math.round(
    distanceMiles(selectedAirport.coordinate, otherAirport.coordinate),
  );
  const duration = Math.round(42 + miles / 8.8 + random() * 22);
  const startMinute =
    direction === "departure" ? endpointMinute : endpointMinute - duration;
  const endMinute =
    direction === "departure" ? endpointMinute + duration : endpointMinute;
  const origin = direction === "departure" ? selectedCode : otherCode;
  const destination = direction === "departure" ? otherCode : selectedCode;
  const airline = carriers[Math.floor(random() * carriers.length)];
  flights.push({
    id: `${airline}${1000 + index}-${origin}-${destination}`,
    flightDate: date,
    airline,
    flightNumber: String(1000 + index),
    origin,
    destination,
    direction,
    startMinute,
    endMinute,
    durationMinutes: duration,
    distanceMiles: miles,
    path: greatCirclePath(
      AIRPORTS[origin].coordinate,
      AIRPORTS[destination].coordinate,
      startMinute,
      endMinute,
      miles > 1800 ? 60 : 48,
    ),
  });
}

flights.sort((a, b) => a.startMinute - b.startMinute);
const dataset: FlightDayDataset = {
  airport: selectedAirport,
  date,
  timezone: selectedAirport.timezone || "America/New_York",
  generatedAt: `${date}T00:00:00.000Z`,
  totalFlights: flights.length,
  totalArrivals: flights.filter((flight) => flight.direction === "arrival")
    .length,
  totalDepartures: flights.filter((flight) => flight.direction === "departure")
    .length,
  airports: AIRPORTS,
  flights,
};

const directory = `public/data/${selectedCode}`;
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/mock.json`, JSON.stringify(dataset));
await writeFile(`${directory}/${date}.json`, JSON.stringify(dataset));
await updateManifest(
  dataset,
  [
    { value: "mock", file: `data/${selectedCode}/mock.json` },
    { value: date, file: `data/${selectedCode}/${date}.json` },
  ],
  { makeDefault: args.default === "true" },
);

console.log(
  `Generated ${flightCount} deterministic ${selectedCode} flights for ${date}.`,
);
