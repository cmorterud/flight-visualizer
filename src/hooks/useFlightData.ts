import { useEffect, useState } from "react";
import type { DatasetManifest, FlightDayDataset } from "../types/flights";

type LoadState = {
  manifest: DatasetManifest | null;
  dataset: FlightDayDataset | null;
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
    file: "",
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const manifestResponse = await fetch("/data/manifest.json", {
          signal: controller.signal,
        });
        if (!manifestResponse.ok)
          throw new Error("Could not load the available flight dates.");
        const manifest = (await manifestResponse.json()) as DatasetManifest;
        const airport = manifest.airports.find(
          (item) => item.iataCode === airportCode,
        );
        if (!airport)
          throw new Error(
            `Airport “${airportCode}” is not available in this build.`,
          );
        const dateEntry = airport.dates.find((item) => item.value === date);
        if (!dateEntry)
          throw new Error(
            `Date “${date}” is not available for ${airportCode}.`,
          );
        const response = await fetch(dateEntry.file, {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            `Could not load ${airportCode} flight activity for ${dateEntry.label}.`,
          );
        const dataset = validateDataset(await response.json());
        setState({
          manifest,
          dataset,
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
