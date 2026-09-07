/**
 * In-memory `ClassRepository`, substitutable for the Firestore one.
 *
 * Exists so hook and page tests exercise the real components against a real
 * implementation of the contract instead of a pile of ad-hoc mocks. It applies
 * the same filters, sort and paging semantics the Firestore adapter does — if
 * the two ever disagree, that is a bug in one of them, which is the point.
 */

import { createAppError, type AppError } from "@/shared/lib/errors";
import { fail, succeed, type Result } from "@/shared/lib/result";
import type {
  ClassFacetOptions,
  ClassRepository,
} from "@/features/classes/services/classRepository";
import { normalizeForSearch } from "@/features/classes/services/searchKeywords";
import type {
  ClassDraft,
  ClassPage,
  ClassPageCursor,
  ClassQuery,
  ClassRecord,
} from "@/features/classes/types";

/** The cursor shape this implementation hands out. */
interface OffsetCursor {
  readonly offset: number;
}

/** Options for {@link InMemoryClassRepository}. */
export interface InMemoryClassRepositoryOptions {
  /** Records the repository starts with. */
  readonly records?: readonly ClassRecord[];
  /** When set, every method fails with this error instead of succeeding. */
  readonly failWith?: AppError;
}

/**
 * Builds a class record, filling everything the caller does not care about.
 *
 * @param overrides - Fields to set on the record.
 * @returns A complete class record.
 */
export function buildClassRecord(
  overrides: Partial<ClassRecord> = {},
): ClassRecord {
  return {
    id: "class-1",
    date: "2026-08-28",
    code: "DEV-101",
    name: "Fundamentos de React",
    teacher: "Yokasta Reyes",
    link: "https://meet.talendig.do/rec/dev-101",
    comment: "Componentes, props y estado local.",
    createdAt: new Date("2026-08-28T12:00:00Z"),
    updatedAt: new Date("2026-08-28T12:00:00Z"),
    updatedBy: "yokasta.reyes",
    ...overrides,
  };
}

/** A class repository backed by an array. */
export class InMemoryClassRepository implements ClassRepository {
  #records: ClassRecord[];
  readonly #failWith: AppError | undefined;

  /** Calls made through the write side, for assertions. */
  readonly calls: {
    create: { draft: ClassDraft; author: string }[];
    update: { id: string; draft: ClassDraft; author: string }[];
    remove: string[];
  } = { create: [], update: [], remove: [] };

  constructor({ records = [], failWith }: InMemoryClassRepositoryOptions = {}) {
    this.#records = [...records];
    this.#failWith = failWith;
  }

  /** @returns Every record currently stored, in insertion order. */
  get records(): readonly ClassRecord[] {
    return this.#records;
  }

  /**
   * Applies a query's filters and sort order.
   *
   * @param query - The query whose filters should be applied.
   * @returns The matching records, sorted.
   */
  #match(query: ClassQuery): ClassRecord[] {
    const { filters } = query;
    const term = normalizeForSearch(filters.searchTerm).trim();

    const matched = this.#records.filter((record) => {
      if (filters.teacher !== null && record.teacher !== filters.teacher) {
        return false;
      }
      if (filters.code !== null && record.code !== filters.code) return false;
      if (filters.fromDate !== null && record.date < filters.fromDate) {
        return false;
      }
      if (filters.toDate !== null && record.date > filters.toDate) return false;

      if (term === "") return true;

      const haystack = normalizeForSearch(
        `${record.name} ${record.teacher} ${record.code}`,
      );
      return haystack.includes(term);
    });

    return matched.sort((a, b) =>
      query.sortOrder === "date-asc"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
    );
  }

  /** @inheritdoc */
  findPage(query: ClassQuery): Promise<Result<ClassPage, AppError>> {
    if (this.#failWith !== undefined) {
      return Promise.resolve(fail(this.#failWith));
    }

    const matched = this.#match(query);
    const offset = (query.cursor as unknown as OffsetCursor | null)?.offset ?? 0;
    const items = matched.slice(offset, offset + query.pageSize);
    const nextOffset = offset + query.pageSize;

    return Promise.resolve(
      succeed({
        items,
        nextCursor:
          nextOffset < matched.length
            ? ({ offset: nextOffset } as unknown as ClassPageCursor)
            : null,
      }),
    );
  }

  /** @inheritdoc */
  countAll(query: ClassQuery): Promise<Result<number, AppError>> {
    if (this.#failWith !== undefined) {
      return Promise.resolve(fail(this.#failWith));
    }
    return Promise.resolve(succeed(this.#match(query).length));
  }

  /** @inheritdoc */
  findById(id: string): Promise<Result<ClassRecord, AppError>> {
    if (this.#failWith !== undefined) {
      return Promise.resolve(fail(this.#failWith));
    }

    const record = this.#records.find((candidate) => candidate.id === id);

    return Promise.resolve(
      record === undefined
        ? fail(createAppError("classes/not-found", "Esta clase ya no existe."))
        : succeed(record),
    );
  }

  /** @inheritdoc */
  listFacets(): Promise<Result<ClassFacetOptions, AppError>> {
    if (this.#failWith !== undefined) {
      return Promise.resolve(fail(this.#failWith));
    }

    const distinct = (pick: (record: ClassRecord) => string): readonly string[] =>
      [...new Set(this.#records.map(pick))].sort((a, b) => a.localeCompare(b, "es"));

    return Promise.resolve(
      succeed({
        teachers: distinct((record) => record.teacher),
        codes: distinct((record) => record.code),
      }),
    );
  }

  /** @inheritdoc */
  create(
    draft: ClassDraft,
    authorUsername: string,
  ): Promise<Result<string, AppError>> {
    if (this.#failWith !== undefined) {
      return Promise.resolve(fail(this.#failWith));
    }

    this.calls.create.push({ draft, author: authorUsername });
    const id = `class-${String(this.#records.length + 1)}`;
    this.#records.push(
      buildClassRecord({ ...draft, id, updatedBy: authorUsername }),
    );

    return Promise.resolve(succeed(id));
  }

  /** @inheritdoc */
  update(
    id: string,
    draft: ClassDraft,
    authorUsername: string,
  ): Promise<Result<void, AppError>> {
    if (this.#failWith !== undefined) {
      return Promise.resolve(fail(this.#failWith));
    }

    this.calls.update.push({ id, draft, author: authorUsername });
    this.#records = this.#records.map((record) =>
      record.id === id
        ? { ...record, ...draft, updatedBy: authorUsername }
        : record,
    );

    return Promise.resolve(succeed(undefined));
  }

  /** @inheritdoc */
  remove(id: string): Promise<Result<void, AppError>> {
    if (this.#failWith !== undefined) {
      return Promise.resolve(fail(this.#failWith));
    }

    this.calls.remove.push(id);
    this.#records = this.#records.filter((record) => record.id !== id);

    return Promise.resolve(succeed(undefined));
  }
}
