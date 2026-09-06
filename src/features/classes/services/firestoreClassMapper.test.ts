import { Timestamp } from "firebase/firestore";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { toClassRecord } from "./firestoreClassMapper";

/** A stored document that satisfies every rule. */
const VALID_DOCUMENT = {
  date: "2026-08-28",
  code: "DEV-101",
  name: "Fundamentos de React",
  teacher: "Yokasta Reyes",
  link: "https://meet.talendig.do/rec/dev-101",
  comment: "Componentes y estado local.",
  keywords: ["react", "dev-101"],
  createdAt: Timestamp.fromDate(new Date("2026-08-28T12:00:00Z")),
  updatedAt: Timestamp.fromDate(new Date("2026-08-29T09:30:00Z")),
  updatedBy: "yokasta.reyes",
};

/**
 * Builds a minimal snapshot stand-in carrying the fields the mapper reads.
 *
 * @param data - The stored document body.
 * @param id - The document id.
 * @returns A value shaped like the snapshot the mapper receives.
 */
function snapshot(
  data: Record<string, unknown>,
  id = "class-1",
): QueryDocumentSnapshot<DocumentData> {
  return { id, data: () => data } as unknown as QueryDocumentSnapshot<DocumentData>;
}

describe("toClassRecord", () => {
  it("maps a stored document onto the domain model", () => {
    const record = toClassRecord(snapshot(VALID_DOCUMENT));

    expect(record).toMatchObject({
      id: "class-1",
      date: "2026-08-28",
      code: "DEV-101",
      name: "Fundamentos de React",
      teacher: "Yokasta Reyes",
      updatedBy: "yokasta.reyes",
    });
  });

  it("converts timestamps to dates, so no Timestamp reaches a component", () => {
    const record = toClassRecord(snapshot(VALID_DOCUMENT));

    expect(record.createdAt).toBeInstanceOf(Date);
    expect(record.updatedAt).toBeInstanceOf(Date);
    expect(record.updatedAt.toISOString()).toBe("2026-08-29T09:30:00.000Z");
  });

  it("does not leak the write-side search index into the domain model", () => {
    expect(toClassRecord(snapshot(VALID_DOCUMENT))).not.toHaveProperty(
      "keywords",
    );
  });

  it("defaults an absent comment to an empty string", () => {
    const { comment, ...withoutComment } = VALID_DOCUMENT;
    void comment;

    expect(toClassRecord(snapshot(withoutComment)).comment).toBe("");
  });

  it("defaults an absent author rather than rendering undefined", () => {
    const { updatedBy, ...withoutAuthor } = VALID_DOCUMENT;
    void updatedBy;

    expect(toClassRecord(snapshot(withoutAuthor)).updatedBy).toBe("");
  });

  it("rejects a document missing a required field", () => {
    const { name, ...withoutName } = VALID_DOCUMENT;
    void name;

    expect(() => toClassRecord(snapshot(withoutName))).toThrow();
  });

  it("rejects a document whose field has the wrong type", () => {
    expect(() =>
      toClassRecord(snapshot({ ...VALID_DOCUMENT, date: 20260828 })),
    ).toThrow();
  });

  it("rejects a document whose timestamp was written as a string", () => {
    expect(() =>
      toClassRecord(snapshot({ ...VALID_DOCUMENT, updatedAt: "2026-08-29" })),
    ).toThrow();
  });
});
