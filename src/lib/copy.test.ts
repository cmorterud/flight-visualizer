import { describe, expect, it } from "vitest";
import {
  canClaimEveryDomesticFlight,
  getAirborneCopy,
  getDatasetDisclosure,
  getHookCopy,
  getRecordingCopy,
  getRecordingFinalSummary,
} from "./copy";
import type { DatasetMetadata } from "../types/flights";

const representative: DatasetMetadata = {
  kind: "representative",
  airportCode: "DTW",
  coverage: "domestic",
  routesAreCalculated: true,
};

describe("truthful dataset copy", () => {
  it.each(["mock", "representative"] as const)(
    "%s data never claims every flight",
    (kind) => {
      const copy = getRecordingCopy({ ...representative, kind });
      expect(copy.eyebrow).toBe("FLIGHT ACTIVITY AT DTW");
      expect(copy.eyebrow).not.toContain("EVERY");
    },
  );

  it("formats historical domestic titles with a date", () => {
    const copy = getRecordingCopy({
      ...representative,
      kind: "historical",
      date: "2026-07-15",
    });
    expect(copy).toMatchObject({
      eyebrow: "DOMESTIC FLIGHTS AT DTW",
      dateLine: "JULY 15",
      headline: "OVER",
      headlineEmphasis: "24 hours",
    });
  });

  it("only permits every-domestic copy for explicitly complete historical data", () => {
    const historical = {
      ...representative,
      kind: "historical" as const,
      date: "2026-07-15",
    };
    expect(canClaimEveryDomesticFlight(historical)).toBe(false);
    expect(
      canClaimEveryDomesticFlight({ ...historical, isCompleteDataset: true }),
    ).toBe(true);
    expect(
      getRecordingCopy({ ...historical, isCompleteDataset: true }).eyebrow,
    ).toBe("EVERY DOMESTIC FLIGHT AT DTW");
  });

  it("generates representative and historical final summaries", () => {
    expect(getRecordingFinalSummary(representative, 240)).toEqual({
      totalLine: "240 FLIGHTS",
      periodLine: "OVER 24 HOURS",
      cta: "WHICH AIRPORT NEXT?",
    });
    expect(
      getRecordingFinalSummary(
        { ...representative, kind: "historical", date: "2026-07-15" },
        1042,
      ),
    ).toEqual({
      totalLine: "1,042 DOMESTIC FLIGHTS",
      periodLine: "ON JULY 15",
      cta: "WHICH AIRPORT NEXT?",
    });
  });

  it("uses singular and plural airborne grammar", () => {
    expect(getAirborneCopy(1)).toBe("1 FLIGHT AIRBORNE");
    expect(getAirborneCopy(52)).toBe("52 FLIGHTS AIRBORNE");
  });

  it("generates dynamic hook and disclosure copy", () => {
    expect(getHookCopy({ ...representative, airportCode: "LAX" })).toContain(
      "FLIGHTS AT LAX",
    );
    expect(getDatasetDisclosure(representative)).toBe(
      "A visualization of representative domestic flight activity at DTW over 24 hours. Routes are calculated great-circle paths rather than exact radar tracks.",
    );
    expect(
      getDatasetDisclosure({
        ...representative,
        kind: "historical",
        date: "2026-07-15",
      }),
    ).toContain(
      "Domestic flights arriving at and departing from DTW on July 15.",
    );
  });
});
