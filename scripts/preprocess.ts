import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { buildDataset, parseAirports } from "../src/lib/preprocess";
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

const args = argsToRecord(process.argv.slice(2));
for (const key of ["flights", "airports", "airport", "date"]) {
  if (!args[key]) {
    throw new Error(
      "Usage: npm run preprocess -- --flights ./raw/flights.csv --airports ./raw/airports.csv --airport ATL --date 2026-05-15",
    );
  }
}

const flightCsv = await readFile(args.flights, "utf8");
const airportCsv = await readFile(args.airports, "utf8");
const flightRows = parse(flightCsv, {
  columns: true,
  skip_empty_lines: true,
  bom: true,
  relax_column_count: true,
}) as Record<string, string>[];
const airportRows = parse(airportCsv, {
  columns: true,
  skip_empty_lines: true,
  bom: true,
  relax_column_count: true,
}) as Record<string, string>[];
const airportCode = args.airport.toUpperCase();
const dataset = buildDataset(
  flightRows,
  parseAirports(airportRows),
  airportCode,
  args.date,
  args.timezone || "America/New_York",
);
const directory = `public/data/${airportCode}`;
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/${args.date}.json`, JSON.stringify(dataset));
await updateManifest(dataset, [
  {
    value: args.date,
    file: `data/${airportCode}/${args.date}.json`,
  },
]);
console.log(
  `Wrote ${dataset.totalFlights} flights to ${directory}/${args.date}.json`,
);
