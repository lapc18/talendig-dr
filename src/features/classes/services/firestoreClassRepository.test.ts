import { Timestamp } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_CLASS_FILTERS, type ClassQuery } from "../types";

/**
 * The constraints handed to `query()` on the most recent call, in order.
 * Each mocked constraint records what it was asked to express.
 */
let lastConstraints: Record<string, unknown>[] = [];

const getDocs = vi.fn();
const getCountFromServer = vi.fn();
const addDoc = vi.fn();
const updateDoc = vi.fn();
const deleteDoc = vi.fn();

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();

  return {
    ...actual,
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(() => ({ kind: "collection" })),
    doc: vi.fn((_collection: unknown, id: string) => ({ kind: "doc", id })),
    where: vi.fn((field: string, op: string, value: unknown) => ({
      kind: "where",
      field,
      op,
      value,
    })),
    orderBy: vi.fn((field: string, direction: string) => ({
      kind: "orderBy",
      field,
      direction,
    })),
    limit: vi.fn((count: number) => ({ kind: "limit", count })),
    startAfter: vi.fn((cursor: unknown) => ({ kind: "startAfter", cursor })),
    serverTimestamp: vi.fn(() => ({ kind: "serverTimestamp" })),
    query: vi.fn((_collection: unknown, ...constraints: Record<string, unknown>[]) => {
      lastConstraints = constraints;
      return { kind: "query", constraints };
    }),
    getDocs: (...args: unknown[]) => getDocs(...args),
    getCountFromServer: (...args: unknown[]) => getCountFromServer(...args),
    addDoc: (...args: unknown[]) => addDoc(...args),
    updateDoc: (...args: unknown[]) => updateDoc(...args),
    deleteDoc: (...args: unknown[]) => deleteDoc(...args),
  };
});

const { FirestoreClassRepository } = await import("./firestoreClassRepository");

/**
 * Builds a query request.
 *
 * @param overrides - Fields to override on the default request.
 * @returns The request.
 */
function request(overrides: Partial<ClassQuery> = {}): ClassQuery {
  return {
    filters: EMPTY_CLASS_FILTERS,
    sortOrder: "date-desc",
    pageSize: 8,
    cursor: null,
    ...overrides,
  };
}

/**
 * Finds the constraints of one kind from the last built query.
 *
 * @param kind - The constraint kind to collect.
 * @returns The matching constraints.
 */
function constraintsOfKind(kind: string): Record<string, unknown>[] {
  return lastConstraints.filter((constraint) => constraint.kind === kind);
}

/**
 * Builds a snapshot of N documents for `getDocs` to resolve with.
 *
 * @param count - How many documents the query should return.
 * @returns The snapshot stand-in.
 */
function docsSnapshot(count: number) {
  return {
    docs: Array.from({ length: count }, (_, index) => ({
      id: `class-${String(index)}`,
      data: () => ({
        date: "2026-08-28",
        code: "DEV-101",
        name: "Fundamentos de React",
        teacher: "Yokasta Reyes",
        link: "https://meet.talendig.do/rec/dev-101",
        comment: "",
        keywords: [],
        // Real Timestamps: the mapper parses documents strictly and rejects
        // anything that only looks like one.
        createdAt: Timestamp.fromDate(new Date("2026-08-28T12:00:00Z")),
        updatedAt: Timestamp.fromDate(new Date("2026-08-28T12:00:00Z")),
        updatedBy: "yokasta.reyes",
      }),
      get: (field: string) =>
        ({ teacher: "Yokasta Reyes", code: "DEV-101" })[field],
    })),
  };
}

describe("FirestoreClassRepository", () => {
  beforeEach(() => {
    lastConstraints = [];
    getDocs.mockReset().mockResolvedValue(docsSnapshot(0));
    getCountFromServer.mockReset().mockResolvedValue({ data: () => ({ count: 0 }) });
    addDoc.mockReset().mockResolvedValue({ id: "new-class" });
    updateDoc.mockReset().mockResolvedValue(undefined);
    deleteDoc.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  describe("query building", () => {
    it("sorts by date descending by default", async () => {
      await new FirestoreClassRepository().findPage(request());

      expect(constraintsOfKind("orderBy")).toEqual([
        { kind: "orderBy", field: "date", direction: "desc" },
      ]);
    });

    it("sorts ascending when asked", async () => {
      await new FirestoreClassRepository().findPage(
        request({ sortOrder: "date-asc" }),
      );

      expect(constraintsOfKind("orderBy")[0].direction).toBe("asc");
    });

    it("adds no filter constraints when nothing is filtered", async () => {
      await new FirestoreClassRepository().findPage(request());

      expect(constraintsOfKind("where")).toHaveLength(0);
    });

    it("pushes the search term into an indexed keyword match, not a client filter", async () => {
      await new FirestoreClassRepository().findPage(
        request({ filters: { ...EMPTY_CLASS_FILTERS, searchTerm: "React" } }),
      );

      expect(constraintsOfKind("where")).toContainEqual({
        kind: "where",
        field: "keywords",
        op: "array-contains",
        value: "react",
      });
    });

    it("ignores a search term that carries no signal", async () => {
      await new FirestoreClassRepository().findPage(
        request({ filters: { ...EMPTY_CLASS_FILTERS, searchTerm: "  " } }),
      );

      expect(constraintsOfKind("where")).toHaveLength(0);
    });

    it("filters the teacher and the code as server-side equality", async () => {
      await new FirestoreClassRepository().findPage(
        request({
          filters: {
            ...EMPTY_CLASS_FILTERS,
            teacher: "Yokasta Reyes",
            code: "DEV-101",
          },
        }),
      );

      expect(constraintsOfKind("where")).toEqual([
        { kind: "where", field: "teacher", op: "==", value: "Yokasta Reyes" },
        { kind: "where", field: "code", op: "==", value: "DEV-101" },
      ]);
    });

    it("expresses the date range as inclusive bounds", async () => {
      await new FirestoreClassRepository().findPage(
        request({
          filters: {
            ...EMPTY_CLASS_FILTERS,
            fromDate: "2026-08-01",
            toDate: "2026-08-31",
          },
        }),
      );

      expect(constraintsOfKind("where")).toEqual([
        { kind: "where", field: "date", op: ">=", value: "2026-08-01" },
        { kind: "where", field: "date", op: "<=", value: "2026-08-31" },
      ]);
    });

    it("requests one extra document, so the next page is known without a second read", async () => {
      await new FirestoreClassRepository().findPage(request({ pageSize: 8 }));

      expect(constraintsOfKind("limit")).toEqual([{ kind: "limit", count: 9 }]);
    });

    it("starts after the cursor when one is supplied", async () => {
      const cursor = { marker: true } as never;

      await new FirestoreClassRepository().findPage(request({ cursor }));

      expect(constraintsOfKind("startAfter")).toEqual([
        { kind: "startAfter", cursor },
      ]);
    });

    it("counts with the same filters but no pagination", async () => {
      await new FirestoreClassRepository().countAll(
        request({ filters: { ...EMPTY_CLASS_FILTERS, code: "DEV-101" } }),
      );

      expect(constraintsOfKind("where")).toHaveLength(1);
      expect(constraintsOfKind("limit")).toHaveLength(0);
      expect(constraintsOfKind("startAfter")).toHaveLength(0);
    });
  });

  describe("findPage", () => {
    it("returns the page without the probe document and offers a next cursor", async () => {
      getDocs.mockResolvedValue(docsSnapshot(9));

      const result = await new FirestoreClassRepository().findPage(
        request({ pageSize: 8 }),
      );

      expect(result.ok && result.value.items).toHaveLength(8);
      expect(result.ok && result.value.nextCursor).not.toBeNull();
    });

    it("reports no next cursor on the last page", async () => {
      getDocs.mockResolvedValue(docsSnapshot(5));

      const result = await new FirestoreClassRepository().findPage(
        request({ pageSize: 8 }),
      );

      expect(result.ok && result.value.items).toHaveLength(5);
      expect(result.ok && result.value.nextCursor).toBeNull();
    });

    it("reports no next cursor when the page is empty", async () => {
      const result = await new FirestoreClassRepository().findPage(request());

      expect(result.ok && result.value.items).toHaveLength(0);
      expect(result.ok && result.value.nextCursor).toBeNull();
    });

    it("normalises a Firestore rejection instead of throwing", async () => {
      getDocs.mockRejectedValue({ code: "permission-denied" });

      const result = await new FirestoreClassRepository().findPage(request());

      expect(result.ok).toBe(false);
      expect(!result.ok && result.error.code).toBe("classes/permission-denied");
    });
  });

  describe("countAll", () => {
    it("uses the server-side aggregation", async () => {
      getCountFromServer.mockResolvedValue({ data: () => ({ count: 24 }) });

      const result = await new FirestoreClassRepository().countAll(request());

      expect(result.ok && result.value).toBe(24);
      expect(getDocs).not.toHaveBeenCalled();
    });

    it("normalises a rejection", async () => {
      getCountFromServer.mockRejectedValue({ code: "unavailable" });

      const result = await new FirestoreClassRepository().countAll(request());

      expect(!result.ok && result.error.code).toBe("classes/unavailable");
    });
  });

  describe("writes", () => {
    it("stores the search index and the author alongside a new class", async () => {
      await new FirestoreClassRepository().create(
        {
          date: "2026-08-28",
          code: "DEV-101",
          name: "Fundamentos de React",
          teacher: "Yokasta Reyes",
          link: "https://meet.talendig.do/rec/dev-101",
          comment: "",
        },
        "yokasta.reyes",
      );

      const [, document] = addDoc.mock.calls[0] as [unknown, Record<string, unknown>];
      expect(document.updatedBy).toBe("yokasta.reyes");
      expect(document.keywords).toContain("react");
      expect(document.createdAt).toEqual({ kind: "serverTimestamp" });
    });

    it("rebuilds the search index on every update, so a rename stays findable", async () => {
      await new FirestoreClassRepository().update(
        "class-1",
        {
          date: "2026-08-28",
          code: "PY-100",
          name: "Introducción a Python",
          teacher: "Wilfredo Batista",
          link: "https://meet.talendig.do/rec/py-100",
          comment: "",
        },
        "wilfredo.batista",
      );

      const [, document] = updateDoc.mock.calls[0] as [unknown, Record<string, unknown>];
      expect(document.keywords).toContain("python");
      expect(document.keywords).not.toContain("react");
    });

    it("deletes by id", async () => {
      const result = await new FirestoreClassRepository().remove("class-1");

      expect(result.ok).toBe(true);
      expect(deleteDoc).toHaveBeenCalledWith({ kind: "doc", id: "class-1" });
    });

    it("normalises a rejected write", async () => {
      addDoc.mockRejectedValue({ code: "permission-denied" });

      const result = await new FirestoreClassRepository().create(
        {
          date: "2026-08-28",
          code: "DEV-101",
          name: "x",
          teacher: "y",
          link: "https://a.test",
          comment: "",
        },
        "quien.sea",
      );

      expect(!result.ok && result.error.code).toBe("classes/permission-denied");
    });
  });

  describe("filter options", () => {
    it("collects distinct teachers from recent classes", async () => {
      getDocs.mockResolvedValue(docsSnapshot(3));

      const result = await new FirestoreClassRepository().listTeachers();

      expect(result.ok && result.value).toEqual(["Yokasta Reyes"]);
    });

    it("normalises a rejection instead of breaking the filters", async () => {
      getDocs.mockRejectedValue({ code: "unavailable" });

      const result = await new FirestoreClassRepository().listCodes();

      expect(result.ok).toBe(false);
    });
  });
});
