import { describe, expect, it } from "vitest";
import {
  CLASS_COMMENT_MAX_LENGTH,
  CLASS_NAME_MAX_LENGTH,
  classDraftSchema,
  type ClassFormInput,
} from "./classSchema";

/** A draft that passes every rule, used as the baseline for each case. */
const VALID_INPUT: ClassFormInput = {
  date: "2026-08-28",
  code: "DEV-101",
  name: "Fundamentos de React",
  teacher: "Yokasta Reyes",
  link: "https://meet.talendig.do/rec/dev-101",
  comment: "Componentes y estado local.",
};

/**
 * Parses a draft with the given overrides.
 *
 * @param overrides - Fields to change on the valid baseline.
 * @returns The Zod parse result.
 */
function parse(overrides: Partial<ClassFormInput> = {}) {
  return classDraftSchema.safeParse({ ...VALID_INPUT, ...overrides });
}

/**
 * Reads the first error message for a field.
 *
 * @param result - A failed parse result.
 * @param field - The field to read.
 * @returns The message, or `undefined` when the field has no error.
 */
function messageFor(
  result: ReturnType<typeof parse>,
  field: keyof ClassFormInput,
): string | undefined {
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("classDraftSchema", () => {
  it("accepts a well-formed draft", () => {
    expect(parse().success).toBe(true);
  });

  describe("code", () => {
    it("normalises to uppercase, so `dev-101` is not a rejection", () => {
      const result = parse({ code: "dev-101" });

      expect(result.success).toBe(true);
      expect(result.success && result.data.code).toBe("DEV-101");
    });

    it("trims surrounding whitespace before validating", () => {
      const result = parse({ code: "  ux-140  " });

      expect(result.success && result.data.code).toBe("UX-140");
    });

    it("rejects a code without the hyphen", () => {
      expect(messageFor(parse({ code: "dev101" }), "code")).toContain(
        "LETRAS-NÚMEROS",
      );
    });

    it("rejects a code with no numeric part", () => {
      expect(parse({ code: "DEV-" }).success).toBe(false);
    });

    it("rejects an empty code", () => {
      expect(parse({ code: "" }).success).toBe(false);
    });
  });

  describe("link", () => {
    it("rejects a bare host with no scheme", () => {
      expect(messageFor(parse({ link: "meet.talendig" }), "link")).toContain(
        "https://",
      );
    });

    it("rejects http, because a recording link must not downgrade", () => {
      expect(parse({ link: "http://meet.talendig.do/rec" }).success).toBe(false);
    });

    it("accepts an absolute https url", () => {
      expect(parse({ link: "https://drive.google.com/file/d/abc" }).success).toBe(
        true,
      );
    });

    it("rejects an empty link", () => {
      expect(parse({ link: "" }).success).toBe(false);
    });
  });

  describe("date", () => {
    it("rejects a date in the future", () => {
      const result = parse({ date: "2099-01-01" });

      expect(messageFor(result, "date")).toContain("posterior a hoy");
    });

    it("accepts today", () => {
      const today = new Date();
      const iso = [
        String(today.getFullYear()),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");

      expect(parse({ date: iso }).success).toBe(true);
    });

    it("rejects an empty date", () => {
      expect(parse({ date: "" }).success).toBe(false);
    });
  });

  describe("name and teacher", () => {
    it("trims the name before checking that it is present", () => {
      const result = parse({ name: "  Introducción a Python  " });

      expect(result.success && result.data.name).toBe("Introducción a Python");
    });

    it("rejects a name that is only whitespace", () => {
      expect(parse({ name: "   " }).success).toBe(false);
    });

    it("rejects a name past the maximum length", () => {
      expect(parse({ name: "a".repeat(CLASS_NAME_MAX_LENGTH + 1) }).success).toBe(
        false,
      );
    });

    it("accepts a name at exactly the maximum length", () => {
      expect(parse({ name: "a".repeat(CLASS_NAME_MAX_LENGTH) }).success).toBe(
        true,
      );
    });

    it("rejects a teacher that is only whitespace", () => {
      expect(parse({ teacher: "  " }).success).toBe(false);
    });
  });

  describe("comment", () => {
    it("is optional and defaults to an empty string", () => {
      const result = classDraftSchema.safeParse({
        ...VALID_INPUT,
        comment: undefined,
      });

      expect(result.success && result.data.comment).toBe("");
    });

    it("rejects a comment past the maximum length", () => {
      expect(
        parse({ comment: "a".repeat(CLASS_COMMENT_MAX_LENGTH + 1) }).success,
      ).toBe(false);
    });

    it("accepts a comment at exactly the maximum length", () => {
      expect(
        parse({ comment: "a".repeat(CLASS_COMMENT_MAX_LENGTH) }).success,
      ).toBe(true);
    });
  });

  it("reports every invalid field at once, so the footer count is accurate", () => {
    const result = parse({ code: "dev101", link: "meet.talendig" });

    expect(result.success).toBe(false);
    expect(result.success ? [] : result.error.issues).toHaveLength(2);
  });
});
