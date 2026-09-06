/**
 * Domain model for a class record and the queries the application runs
 * against it. These types are backend-agnostic: nothing here mentions
 * Firestore.
 */

import type { IsoDate } from "@/shared/utils/date";

/** A class taught at Talendig, as the application understands it. */
export interface ClassRecord {
  /** Repository-assigned identifier. */
  readonly id: string;
  /** Calendar day the class was taught, `yyyy-MM-dd`. */
  readonly date: IsoDate;
  /** Course code, normalised uppercase, e.g. `DEV-101`. */
  readonly code: string;
  /** Session title, e.g. `Fundamentos de React`. */
  readonly name: string;
  /** Teacher who taught the session. */
  readonly teacher: string;
  /** Absolute `https` URL to the recording or material. */
  readonly link: string;
  /** Session notes. Empty string when the teacher left none. */
  readonly comment: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  /** Username of whoever last saved the record. */
  readonly updatedBy: string;
}

/** The writable fields of a class, as produced by the form. */
export type ClassDraft = Pick<
  ClassRecord,
  "date" | "code" | "name" | "teacher" | "link" | "comment"
>;

/** Sort orders offered by the interface. */
export type ClassSortOrder = "date-desc" | "date-asc";

/** The filter set applied to a class query. */
export interface ClassFilters {
  /** Free-text term matched against class name, code and teacher. */
  readonly searchTerm: string;
  /** Inclusive lower bound on the class date. */
  readonly fromDate: IsoDate | null;
  /** Inclusive upper bound on the class date. */
  readonly toDate: IsoDate | null;
  /** Exact teacher match, or `null` for all teachers. */
  readonly teacher: string | null;
  /** Exact class-code match, or `null` for all codes. */
  readonly code: string | null;
}

/** Filters with nothing applied. */
export const EMPTY_CLASS_FILTERS: ClassFilters = {
  searchTerm: "",
  fromDate: null,
  toDate: null,
  teacher: null,
  code: null,
};

/**
 * Counts how many filters are active. The search term is deliberately excluded:
 * the interface presents it as a search box, not as a filter chip.
 *
 * @param filters - The filter set to inspect.
 * @returns The number of active filters, 0 to 3.
 */
export function countActiveFilters(filters: ClassFilters): number {
  const hasDateRange = filters.fromDate !== null || filters.toDate !== null;
  return (
    Number(hasDateRange) +
    Number(filters.teacher !== null) +
    Number(filters.code !== null)
  );
}

/**
 * An opaque pagination cursor. Callers store and replay it without inspecting
 * it, which keeps the repository's paging strategy an implementation detail.
 */
export type ClassPageCursor = { readonly __brand: "ClassPageCursor" };

/** One page of class results. */
export interface ClassPage {
  readonly items: readonly ClassRecord[];
  /** Cursor that starts the following page, or `null` on the last page. */
  readonly nextCursor: ClassPageCursor | null;
}

/** Arguments for a paged class query. */
export interface ClassQuery {
  readonly filters: ClassFilters;
  readonly sortOrder: ClassSortOrder;
  readonly pageSize: number;
  /** Cursor returned by a previous page, or `null` for the first page. */
  readonly cursor: ClassPageCursor | null;
}
