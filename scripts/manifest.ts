import { readFile, writeFile } from "node:fs/promises";
import type { DatasetManifest, FlightDayDataset } from "../src/types/flights";

const MANIFEST_PATH = "public/data/manifest.json";

function dateLabel(value: string): string {
  if (value === "mock") return "Representative day";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export async function updateManifest(
  dataset: FlightDayDataset,
  values: Array<{ value: string; file: string }>,
  options: { makeDefault?: boolean } = {},
): Promise<void> {
  let manifest: DatasetManifest = { airports: [] };
  try {
    manifest = JSON.parse(
      await readFile(MANIFEST_PATH, "utf8"),
    ) as DatasetManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const existing = manifest.airports.find(
    (airport) => airport.iataCode === dataset.airport.iataCode,
  );
  const dates = [...(existing?.dates ?? [])];
  for (const value of values) {
    const entry = { ...value, label: dateLabel(value.value) };
    const index = dates.findIndex((date) => date.value === value.value);
    if (index >= 0) dates[index] = entry;
    else dates.push(entry);
  }
  dates.sort((a, b) => {
    if (a.value === "mock") return -1;
    if (b.value === "mock") return 1;
    return b.value.localeCompare(a.value);
  });

  const airportEntry = {
    iataCode: dataset.airport.iataCode,
    name: dataset.airport.name,
    dates,
  };
  const airportIndex = manifest.airports.findIndex(
    (airport) => airport.iataCode === dataset.airport.iataCode,
  );
  if (airportIndex >= 0) manifest.airports[airportIndex] = airportEntry;
  else manifest.airports.push(airportEntry);
  manifest.airports.sort((a, b) => a.iataCode.localeCompare(b.iataCode));
  manifest.defaultAirport =
    options.makeDefault || !manifest.defaultAirport
      ? dataset.airport.iataCode
      : manifest.defaultAirport;

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest));
}
