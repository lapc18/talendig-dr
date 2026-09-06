import { describe, expect, it } from "vitest";
import { EMPTY_CLASS_FILTERS, countActiveFilters } from "./types";

describe("countActiveFilters", () => {
  it("counts nothing when no filter is applied", () => {
    expect(countActiveFilters(EMPTY_CLASS_FILTERS)).toBe(0);
  });

  it("ignores the search term, which the interface presents as a search box", () => {
    expect(
      countActiveFilters({ ...EMPTY_CLASS_FILTERS, searchTerm: "react" }),
    ).toBe(0);
  });

  it("counts a date range once, whichever bound is set", () => {
    expect(
      countActiveFilters({ ...EMPTY_CLASS_FILTERS, fromDate: "2026-08-01" }),
    ).toBe(1);
    expect(
      countActiveFilters({ ...EMPTY_CLASS_FILTERS, toDate: "2026-08-31" }),
    ).toBe(1);
    expect(
      countActiveFilters({
        ...EMPTY_CLASS_FILTERS,
        fromDate: "2026-08-01",
        toDate: "2026-08-31",
      }),
    ).toBe(1);
  });

  it("counts the teacher and the code separately", () => {
    expect(
      countActiveFilters({
        ...EMPTY_CLASS_FILTERS,
        teacher: "Yokasta Reyes",
        code: "DEV-101",
      }),
    ).toBe(2);
  });

  it("reaches three when every filter is applied", () => {
    expect(
      countActiveFilters({
        searchTerm: "react",
        fromDate: "2026-08-01",
        toDate: "2026-08-31",
        teacher: "Yokasta Reyes",
        code: "DEV-101",
      }),
    ).toBe(3);
  });
});
