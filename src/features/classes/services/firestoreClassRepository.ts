/**
 * Firestore implementation of `ClassRepository`.
 *
 * Every filter, sort and page boundary is expressed as a Firestore constraint
 * so the browser never downloads rows it will not show. The composite indexes
 * these queries need are declared in `firestore.indexes.json`.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type Query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { toClassesError, createAppError } from "@/shared/lib/errors";
import { logger } from "@/shared/lib/logger";
import { fail, succeed, type Result } from "@/shared/lib/result";
import { COPY } from "@/shared/i18n/copy";
import type { AppError } from "@/shared/lib/errors";
import type {
  ClassDraft,
  ClassPage,
  ClassPageCursor,
  ClassQuery,
  ClassRecord,
} from "../types";
import type { ClassRepository } from "./classRepository";
import { CLASSES_COLLECTION, toClassRecord } from "./firestoreClassMapper";
import { buildSearchKeywords, toSearchKeyword } from "./searchKeywords";

/**
 * How many documents to scan when collecting distinct teachers and codes for
 * the filter dropdowns. Firestore has no `DISTINCT`, and the alternative — a
 * maintained aggregate document — is more machinery than a community-scale
 * catalogue justifies.
 */
const FACET_SCAN_LIMIT = 500;

/**
 * A cursor is a Firestore snapshot behind an opaque brand, so callers can store
 * and replay it without depending on Firestore types.
 */
type InternalCursor = QueryDocumentSnapshot<DocumentData>;

/**
 * Reveals the snapshot behind an opaque cursor.
 *
 * @param cursor - The opaque cursor handed back to a caller.
 * @returns The underlying Firestore snapshot.
 */
function unwrapCursor(cursor: ClassPageCursor): InternalCursor {
  return cursor as unknown as InternalCursor;
}

/**
 * Hides a Firestore snapshot behind an opaque cursor.
 *
 * @param snapshot - The snapshot that starts the next page.
 * @returns The opaque cursor.
 */
function wrapCursor(snapshot: InternalCursor): ClassPageCursor {
  return snapshot as unknown as ClassPageCursor;
}

/**
 * Builds the Firestore constraints for a query's filters and sort order,
 * excluding pagination.
 *
 * @param request - The query to translate.
 * @returns The constraints, in the order Firestore expects.
 */
function buildFilterConstraints(request: ClassQuery): QueryConstraint[] {
  const { filters, sortOrder } = request;
  const constraints: QueryConstraint[] = [];

  const keyword = toSearchKeyword(filters.searchTerm);
  if (keyword !== null) {
    constraints.push(where("keywords", "array-contains", keyword));
  }

  if (filters.teacher !== null) {
    constraints.push(where("teacher", "==", filters.teacher));
  }

  if (filters.code !== null) {
    constraints.push(where("code", "==", filters.code));
  }

  if (filters.fromDate !== null) {
    constraints.push(where("date", ">=", filters.fromDate));
  }

  if (filters.toDate !== null) {
    constraints.push(where("date", "<=", filters.toDate));
  }

  constraints.push(orderBy("date", sortOrder === "date-asc" ? "asc" : "desc"));

  return constraints;
}

/** Firestore-backed class repository. */
export class FirestoreClassRepository implements ClassRepository {
  /** Handle to the `classes` collection. */
  readonly #classes = collection(firestore, CLASSES_COLLECTION);

  /**
   * Builds a filtered, sorted query without pagination.
   *
   * @param request - The query to translate.
   * @returns The Firestore query.
   */
  #buildQuery(request: ClassQuery): Query<DocumentData> {
    return query(this.#classes, ...buildFilterConstraints(request));
  }

  /** @inheritdoc */
  async findPage(request: ClassQuery): Promise<Result<ClassPage, AppError>> {
    try {
      const constraints = buildFilterConstraints(request);

      if (request.cursor !== null) {
        constraints.push(startAfter(unwrapCursor(request.cursor)));
      }

      // One extra document tells us whether a next page exists without a
      // second round trip.
      constraints.push(limit(request.pageSize + 1));

      const snapshot = await getDocs(query(this.#classes, ...constraints));
      const hasMore = snapshot.docs.length > request.pageSize;
      const pageDocs = hasMore
        ? snapshot.docs.slice(0, request.pageSize)
        : snapshot.docs;

      const lastDoc = pageDocs.at(-1);

      return succeed({
        items: pageDocs.map(toClassRecord),
        nextCursor: hasMore && lastDoc !== undefined ? wrapCursor(lastDoc) : null,
      });
    } catch (error) {
      logger.error("Failed to read a page of classes", error, {
        filters: request.filters,
      });
      return fail(toClassesError(error));
    }
  }

  /** @inheritdoc */
  async countAll(request: ClassQuery): Promise<Result<number, AppError>> {
    try {
      // Server-side aggregation: the count never transfers the documents.
      const snapshot = await getCountFromServer(this.#buildQuery(request));
      return succeed(snapshot.data().count);
    } catch (error) {
      logger.error("Failed to count classes", error, {
        filters: request.filters,
      });
      return fail(toClassesError(error));
    }
  }

  /** @inheritdoc */
  async findById(id: string): Promise<Result<ClassRecord, AppError>> {
    try {
      const snapshot = await getDoc(doc(this.#classes, id));

      if (!snapshot.exists()) {
        return fail(
          createAppError("classes/not-found", COPY.errors.classNotFound),
        );
      }

      return succeed(toClassRecord(snapshot as InternalCursor));
    } catch (error) {
      logger.error("Failed to read a class", error, { id });
      return fail(toClassesError(error));
    }
  }

  /** @inheritdoc */
  async listTeachers(): Promise<Result<readonly string[], AppError>> {
    return this.#listDistinctValues("teacher");
  }

  /** @inheritdoc */
  async listCodes(): Promise<Result<readonly string[], AppError>> {
    return this.#listDistinctValues("code");
  }

  /**
   * Collects the distinct values of one field across recent classes.
   *
   * @param field - The document field to collect.
   * @returns The sorted distinct values, or an `AppError`.
   */
  async #listDistinctValues(
    field: "teacher" | "code",
  ): Promise<Result<readonly string[], AppError>> {
    try {
      const snapshot = await getDocs(
        query(this.#classes, orderBy("date", "desc"), limit(FACET_SCAN_LIMIT)),
      );

      const values = new Set<string>();
      for (const document of snapshot.docs) {
        const value = document.get(field) as unknown;
        if (typeof value === "string" && value !== "") values.add(value);
      }

      return succeed([...values].sort((a, b) => a.localeCompare(b, "es")));
    } catch (error) {
      logger.error("Failed to list filter options", error, { field });
      return fail(toClassesError(error));
    }
  }

  /** @inheritdoc */
  async create(
    draft: ClassDraft,
    authorUsername: string,
  ): Promise<Result<string, AppError>> {
    try {
      const reference = await addDoc(this.#classes, {
        ...draft,
        keywords: buildSearchKeywords(draft),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: authorUsername,
      });

      return succeed(reference.id);
    } catch (error) {
      logger.error("Failed to create a class", error, { code: draft.code });
      return fail(toClassesError(error));
    }
  }

  /** @inheritdoc */
  async update(
    id: string,
    draft: ClassDraft,
    authorUsername: string,
  ): Promise<Result<void, AppError>> {
    try {
      await updateDoc(doc(this.#classes, id), {
        ...draft,
        keywords: buildSearchKeywords(draft),
        updatedAt: serverTimestamp(),
        updatedBy: authorUsername,
      });

      return succeed(undefined);
    } catch (error) {
      logger.error("Failed to update a class", error, { id });
      return fail(toClassesError(error));
    }
  }

  /** @inheritdoc */
  async remove(id: string): Promise<Result<void, AppError>> {
    try {
      await deleteDoc(doc(this.#classes, id));
      return succeed(undefined);
    } catch (error) {
      logger.error("Failed to delete a class", error, { id });
      return fail(toClassesError(error));
    }
  }
}
