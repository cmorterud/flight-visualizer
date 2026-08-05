import { describe, expect, it } from "vitest";
import { filterFlightRows, isTruthyFlag } from "./preprocess";

describe("source dataset filtering", () => {
  it("filters flights to one selected airport and date", () => {
    const rows = [
      { FlightDate: "2026-05-15", Origin: "ATL", Dest: "JFK" },
      { FlightDate: "2026-05-15", Origin: "MIA", Dest: "ATL" },
      { FlightDate: "2026-05-16", Origin: "ATL", Dest: "LAX" },
      { FlightDate: "2026-05-15", Origin: "MIA", Dest: "JFK" },
    ];
    expect(filterFlightRows(rows, "ATL", "2026-05-15")).toHaveLength(2);
  });

  it("recognizes numeric BTS cancellation and diversion flags", () => {
    expect(isTruthyFlag("1")).toBe(true);
    expect(isTruthyFlag("1.00")).toBe(true);
    expect(isTruthyFlag("0.00")).toBe(false);
  });
});
