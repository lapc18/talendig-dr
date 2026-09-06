import { describe, expect, it } from "vitest";
import {
  formatLongDate,
  formatShortDate,
  formatTimeOfDay,
  parseIsoDate,
  todayIsoDate,
} from "./date";

describe("parseIsoDate", () => {
  it("parses a calendar day to local midnight, never shifting the day", () => {
    const parsed = parseIsoDate("2026-08-28");

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(7);
    expect(parsed?.getDate()).toBe(28);
    expect(parsed?.getHours()).toBe(0);
  });

  it("returns null for a value that is not a calendar day", () => {
    expect(parseIsoDate("")).toBeNull();
    expect(parseIsoDate("28/08/2026")).toBeNull();
    expect(parseIsoDate("no es fecha")).toBeNull();
  });

  it("returns null for a day that does not exist", () => {
    expect(parseIsoDate("2026-02-31")).toBeNull();
  });
});

describe("formatShortDate", () => {
  it("formats in Spanish, e.g. `28 ago 2026`", () => {
    expect(formatShortDate("2026-08-28")).toBe("28 ago 2026");
  });

  it("keeps the stored day for a date that would roll back in UTC", () => {
    // The whole reason dates are stored as strings: `new Date("2026-01-01")`
    // is UTC midnight, which is 31 December in the Dominican Republic.
    expect(formatShortDate("2026-01-01")).toBe("01 ene 2026");
  });

  it("falls back to the raw value rather than rendering `Invalid Date`", () => {
    expect(formatShortDate("28/08/2026")).toBe("28/08/2026");
  });
});

describe("formatLongDate", () => {
  it("formats as Spanish prose", () => {
    expect(formatLongDate("2026-08-28")).toBe("28 de agosto de 2026");
  });

  it("falls back to the raw value for an unparseable day", () => {
    expect(formatLongDate("ayer")).toBe("ayer");
  });
});

describe("todayIsoDate", () => {
  it("returns today in `yyyy-MM-dd` form", () => {
    expect(todayIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("round-trips through the parser", () => {
    const today = todayIsoDate();
    const parsed = parseIsoDate(today);

    expect(parsed?.getDate()).toBe(new Date().getDate());
  });
});

describe("formatTimeOfDay", () => {
  it("uses the Dominican day period, not `PM`", () => {
    const afternoon = new Date(2026, 8, 6, 13, 58);

    expect(formatTimeOfDay(afternoon)).toBe("1:58 p. m.");
  });

  it("formats the morning the same way", () => {
    expect(formatTimeOfDay(new Date(2026, 8, 6, 9, 15))).toBe("9:15 a. m.");
  });
});
