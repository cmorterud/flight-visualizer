import { useEffect, useState } from "react";
import type { DatasetManifest, FlightDayDataset } from "../types/flights";

type LoadState = {
  manifest: DatasetManifest | null;
  dataset: FlightDayDataset | null;
  airportCode: string;
  date: string;
  file: string;
  loading: boolean;
  error: string | null;
};

function validateDataset(value: unknown): FlightDayDataset {
  const dataset = value as FlightDayDataset;
  if (!dataset?.airport?.coordinate || !Array.isArray(dataset.flights)) {
    throw new Error(
      "The flight file is missing required airport or flight data.",
    );
  }
  if (
    !dataset.flights.every(
      (flight) => Array.isArray(flight.path) && flight.path.length > 1,
    )
  ) {
    throw new Error("One or more flights has an invalid route path.");
  }
  return dataset;
}

export function useFlightData(airportCode: string, date: string): LoadState {
  const [state, setState] = useState<LoadState>({
    manifest: null,
    dataset: null,
    airportCode: "",
    date: "",
    file: "",
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const assetUrl = (path: string) =>
          `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
        const manifestResponse = await fetch(assetUrl("data/manifest.json"), {
          signal: controller.signal,
        });
        if (!manifestResponse.ok)
          throw new Error("Could not load the available flight dates.");
        const manifest = (await manifestResponse.json()) as DatasetManifest;
        if (!manifest.airports?.length)
          throw new Error("No airports are listed in the data manifest.");
        const requestedAirport = airportCode.trim().toUpperCase();
        const resolvedAirport =
          requestedAirport ||
          manifest.defaultAirport ||
          manifest.airports[0].iataCode;
        const airport = manifest.airports.find(
          (item) => item.iataCode === resolvedAirport,
        );
        if (!airport)
          throw new Error(
            `Airport “${resolvedAirport}” is not available in this build.`,
          );
        const resolvedDate = date.trim() || airport.dates[0]?.value;
        const dateEntry = airport.dates.find(
          (item) => item.value === resolvedDate,
        );
        if (!dateEntry)
          throw new Error(
            `Date “${resolvedDate}” is not available for ${resolvedAirport}.`,
          );
        const response = await fetch(assetUrl(dateEntry.file), {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            `Could not load ${resolvedAirport} flight activity for ${dateEntry.label}.`,
          );
        const dataset = validateDataset(await response.json());
        setState({
          manifest,
          dataset,
          airportCode: resolvedAirport,
          date: resolvedDate,
          file: dateEntry.file,
          loading: false,
          error: null,
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setState((current) => ({
          ...current,
          loading: false,
          error: (error as Error).message,
        }));
      }
    };
    void load();
    return () => controller.abort();
  }, [airportCode, date]);

  return state;
}
