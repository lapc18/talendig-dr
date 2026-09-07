/**
 * The class repository contract.
 *
 * Pages and hooks depend on these interfaces, never on Firestore, so the
 * storage backend can be replaced or faked without touching a component
 * (Dependency Inversion). Reads and writes are separate interfaces so the
 * public consultation screens depend only on what they use (Interface
 * Segregation).
 */

import type { AppError } from "@/shared/lib/errors";
import type { Result } from "@/shared/lib/result";
import type { ClassDraft, ClassPage, ClassQuery, ClassRecord } from "../types";

/** The option lists behind the filter dropdowns. */
export interface ClassFacetOptions {
  readonly teachers: readonly string[];
  readonly codes: readonly string[];
}

/** Read-only access to class records. Used by the public consultation. */
export interface ClassReader {
  /**
   * Fetches one page of classes matching a query.
   *
   * @param query - Filters, sort order, page size and cursor.
   * @returns The page, or an `AppError` describing why it could not be read.
   */
  findPage(query: ClassQuery): Promise<Result<ClassPage, AppError>>;

  /**
   * Counts every class matching the query's filters, ignoring pagination.
   *
   * @param query - The query whose filters should be counted.
   * @returns The total, or an `AppError`.
   */
  countAll(query: ClassQuery): Promise<Result<number, AppError>>;

  /**
   * Fetches a single class.
   *
   * @param id - The class identifier.
   * @returns The record, or an `AppError` (`classes/not-found` when absent).
   */
  findById(id: string): Promise<Result<ClassRecord, AppError>>;

  /**
   * Lists the distinct teachers and class codes on record, for the filter
   * dropdowns.
   *
   * Both lists come from one call because they are derived from the same rows:
   * asking for them separately would read the same documents twice.
   *
   * @returns The two lists sorted alphabetically, or an `AppError`.
   */
  listFacets(): Promise<Result<ClassFacetOptions, AppError>>;
}

/** Mutating access to class records. Used by the authenticated admin screens. */
export interface ClassWriter {
  /**
   * Creates a class.
   *
   * @param draft - Validated class fields.
   * @param authorUsername - Username credited with the change.
   * @returns The new identifier, or an `AppError`.
   */
  create(
    draft: ClassDraft,
    authorUsername: string,
  ): Promise<Result<string, AppError>>;

  /**
   * Replaces the writable fields of an existing class.
   *
   * @param id - The class identifier.
   * @param draft - Validated class fields.
   * @param authorUsername - Username credited with the change.
   * @returns Nothing on success, or an `AppError`.
   */
  update(
    id: string,
    draft: ClassDraft,
    authorUsername: string,
  ): Promise<Result<void, AppError>>;

  /**
   * Permanently removes a class.
   *
   * @param id - The class identifier.
   * @returns Nothing on success, or an `AppError`.
   */
  remove(id: string): Promise<Result<void, AppError>>;
}

/** The full repository surface, implemented by storage adapters. */
export interface ClassRepository extends ClassReader, ClassWriter {}
