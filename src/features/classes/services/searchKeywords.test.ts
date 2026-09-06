import { describe, expect, it } from "vitest";
import {
  buildSearchKeywords,
  normalizeForSearch,
  toSearchKeyword,
} from "./searchKeywords";
import type { ClassDraft } from "../types";

/**
 * Builds a draft for keyword generation.
 *
 * @param overrides - Fields to set.
 * @returns A complete draft.
 */
function draft(overrides: Partial<ClassDraft> = {}): ClassDraft {
  return {
    date: "2026-08-28",
    code: "DEV-101",
    name: "Fundamentos de React",
    teacher: "Rosángela Díaz",
    link: "https://meet.talendig.do/rec/dev-101",
    comment: "",
    ...overrides,
  };
}

describe("normalizeForSearch", () => {
  it("lowercases and strips diacritics so accented names stay findable", () => {
    expect(normalizeForSearch("Rosángela Díaz")).toBe("rosangela diaz");
    expect(normalizeForSearch("PROGRAMACIÓN")).toBe("programacion");
  });

  it("leaves unaccented text untouched apart from case", () => {
    expect(normalizeForSearch("React")).toBe("react");
  });
});

describe("buildSearchKeywords", () => {
  it("indexes prefixes of the class name, teacher and code", () => {
    const keywords = buildSearchKeywords(draft());

    expect(keywords).toContain("fun");
    expect(keywords).toContain("fundamentos");
    expect(keywords).toContain("rea");
    expect(keywords).toContain("react");
    expect(keywords).toContain("rosangela");
    expect(keywords).toContain("dev");
  });

  it("indexes the code without its hyphen so `dev101` finds `DEV-101`", () => {
    expect(buildSearchKeywords(draft())).toContain("dev101");
  });

  it("does not index prefixes shorter than three characters", () => {
    const keywords = buildSearchKeywords(draft({ name: "React" }));

    expect(keywords).not.toContain("r");
    expect(keywords).not.toContain("re");
    expect(keywords).toContain("rea");
  });

  it("keeps short tokens whole rather than dropping them", () => {
    expect(buildSearchKeywords(draft({ name: "UX" }))).toContain("ux");
  });

  it("returns each keyword once", () => {
    const keywords = buildSearchKeywords(
      draft({ name: "React React", teacher: "React" }),
    );

    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it("never emits an accented keyword, so reads match what is written", () => {
    const keywords = buildSearchKeywords(draft({ teacher: "Rosángela Díaz" }));

    expect(keywords.every((keyword) => !/[áéíóúñ]/.test(keyword))).toBe(true);
  });
});

describe("toSearchKeyword", () => {
  it("returns null when the term carries no searchable signal", () => {
    expect(toSearchKeyword("")).toBeNull();
    expect(toSearchKeyword("   ")).toBeNull();
    expect(toSearchKeyword("—  ·")).toBeNull();
  });

  it("picks the longest token, since it is the most selective", () => {
    expect(toSearchKeyword("de react")).toBe("react");
    expect(toSearchKeyword("fundamentos de")).toBe("fundamentos");
  });

  it("caps the keyword at the longest indexed prefix", () => {
    // The index stores prefixes up to 12 characters, so a longer term has to
    // be truncated to the same length or it could never match.
    expect(toSearchKeyword("internacionalizacion")).toBe("internaciona");
    expect(buildSearchKeywords(draft({ name: "internacionalizacion" }))).toContain(
      toSearchKeyword("internacionalizacion"),
    );
  });

  it("normalises the term the same way the index was built", () => {
    expect(toSearchKeyword("Rosángela")).toBe("rosangela");
  });

  it("produces a keyword the index actually contains", () => {
    const keywords = buildSearchKeywords(draft());
    const keyword = toSearchKeyword("Fundamentos");

    expect(keyword).not.toBeNull();
    expect(keywords).toContain(keyword);
  });
});
