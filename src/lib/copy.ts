import type { DatasetMetadata } from "../types/flights";

export interface RecordingCopy {
  eyebrow: string;
  dateLine?: string;
  headline: string;
  headlineEmphasis: string;
}

function airport(metadata: DatasetMetadata): string {
  return metadata.airportCode.trim().toUpperCase();
}

function dateLabel(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function coverageLabel(metadata: DatasetMetadata): string {
  if (metadata.coverage === "domestic") return "DOMESTIC FLIGHTS";
  if (metadata.coverage === "international") return "INTERNATIONAL FLIGHTS";
  if (metadata.coverage === "all-reported") return "REPORTED FLIGHTS";
  return "FLIGHT ACTIVITY";
}

export function canClaimEveryDomesticFlight(
  metadata: DatasetMetadata,
): boolean {
  return (
    metadata.kind === "historical" &&
    metadata.coverage === "domestic" &&
    metadata.isCompleteDataset === true
  );
}

export function getRecordingCopy(metadata: DatasetMetadata): RecordingCopy {
  if (metadata.kind !== "historical") {
    return {
      eyebrow: `FLIGHT ACTIVITY AT ${airport(metadata)}`,
      headline: "OVER",
      headlineEmphasis: "24 hours",
    };
  }

  const prefix = canClaimEveryDomesticFlight(metadata)
    ? "EVERY DOMESTIC FLIGHT"
    : coverageLabel(metadata);
  return {
    eyebrow: `${prefix} AT ${airport(metadata)}`,
    dateLine: dateLabel(metadata.date)?.toUpperCase(),
    headline: "OVER",
    headlineEmphasis: "24 hours",
  };
}

export function getRecordingEyebrow(metadata: DatasetMetadata): string {
  return getRecordingCopy(metadata).eyebrow;
}

export function getRecordingHeadline(metadata: DatasetMetadata): string {
  const copy = getRecordingCopy(metadata);
  return [copy.dateLine, copy.headline, copy.headlineEmphasis]
    .filter(Boolean)
    .join("\n");
}

export function getHookCopy(metadata: DatasetMetadata): string[] {
  return ["WHAT 24 HOURS OF", `FLIGHTS AT ${airport(metadata)}`, "LOOKS LIKE"];
}

export function getRecordingFinalSummary(
  metadata: DatasetMetadata,
  totalFlights: number,
): { totalLine: string; periodLine: string; cta: string } {
  const formattedTotal = totalFlights.toLocaleString("en-US");
  if (metadata.kind === "historical") {
    const coverage =
      metadata.coverage === "domestic"
        ? " DOMESTIC"
        : metadata.coverage === "international"
          ? " INTERNATIONAL"
          : "";
    return {
      totalLine: `${formattedTotal}${coverage} FLIGHTS`,
      periodLine: dateLabel(metadata.date)
        ? `ON ${dateLabel(metadata.date)!.toUpperCase()}`
        : "OVER 24 HOURS",
      cta: "WHICH AIRPORT NEXT?",
    };
  }
  return {
    totalLine: `${formattedTotal} FLIGHTS`,
    periodLine: "OVER 24 HOURS",
    cta: "WHICH AIRPORT NEXT?",
  };
}

export function getDatasetDisclosure(metadata: DatasetMetadata): string {
  const code = airport(metadata);
  const routeDisclosure = metadata.routesAreCalculated
    ? "Routes are calculated great-circle paths rather than exact radar tracks."
    : "";
  if (metadata.kind === "historical") {
    const coverage =
      metadata.coverage === "domestic"
        ? "Domestic flights"
        : metadata.coverage === "international"
          ? "International flights"
          : "Reported flights";
    const date = dateLabel(metadata.date);
    return `${coverage} arriving at and departing from ${code}${date ? ` on ${date}` : ""}. ${routeDisclosure}`.trim();
  }
  const coverage =
    metadata.coverage === "international"
      ? "international"
      : metadata.coverage === "all-reported"
        ? "reported"
        : "domestic";
  return `A visualization of representative ${coverage} flight activity at ${code} over 24 hours. ${routeDisclosure}`.trim();
}

export function getAirborneCopy(count: number): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? "FLIGHT" : "FLIGHTS"} AIRBORNE`;
}
