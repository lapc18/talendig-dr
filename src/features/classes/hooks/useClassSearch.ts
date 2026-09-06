/**
 * Paged, filtered class search.
 *
 * Owns the whole read side of a class list: filters, sort, cursor pagination
 * and the four async states. Both the public consultation and the admin list
 * use it, which is why it takes the page size and the analytics surface as
 * arguments instead of assuming either.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ANALYTICS_EVENTS, trackEvent } from "@/shared/lib/analytics";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import type { AppError } from "@/shared/lib/errors";
import { useClassRepository } from "../context/classRepositoryContext";
import {
  EMPTY_CLASS_FILTERS,
  countActiveFilters,
  type ClassFilters,
  type ClassPageCursor,
  type ClassRecord,
  type ClassSortOrder,
} from "../types";

/** Quiet period before a keystroke in the search box triggers a query. */
const SEARCH_DEBOUNCE_MS = 300;

/** Stable empty list, so a loading render never allocates a new array. */
const NO_RECORDS: readonly ClassRecord[] = [];

/** Lifecycle of the class list. */
export type ClassSearchStatus = "loading" | "success" | "error";

/** The outcome of one completed request, tagged with the request it answers. */
interface LoadedPage {
  /** Identifies the request; a mismatch with the current one means stale. */
  readonly requestKey: string;
  readonly items: readonly ClassRecord[];
  readonly totalItems: number;
  readonly error: AppError | null;
}

/** Everything {@link useClassSearch} exposes. */
export interface ClassSearchState {
  readonly items: readonly ClassRecord[];
  readonly status: ClassSearchStatus;
  readonly error: AppError | null;
  /** `true` when the query succeeded but matched nothing. */
  readonly isEmpty: boolean;

  readonly filters: ClassFilters;
  readonly sortOrder: ClassSortOrder;
  readonly activeFilterCount: number;

  readonly page: number;
  readonly totalPages: number;
  readonly totalItems: number;
  /** Highest page reachable directly; see `Pagination` for why this exists. */
  readonly reachablePageCount: number;
  readonly pageSize: number;

  setFilters(update: Partial<ClassFilters>): void;
  clearFilters(): void;
  setSortOrder(order: ClassSortOrder): void;
  goToPage(page: number): void;
  retry(): void;
}

/** Arguments for {@link useClassSearch}. */
export interface UseClassSearchOptions {
  readonly pageSize: number;
  /** Which screen is querying, recorded with the search analytics event. */
  readonly surface: "public" | "admin";
}

/**
 * Runs a paged class query and keeps it in sync with the active filters.
 *
 * @param options - Page size and the analytics surface.
 * @returns The list state and the controls that mutate it.
 */
export function useClassSearch({
  pageSize,
  surface,
}: UseClassSearchOptions): ClassSearchState {
  const repository = useClassRepository();

  const [filters, setFiltersState] = useState<ClassFilters>(EMPTY_CLASS_FILTERS);
  const [sortOrder, setSortOrderState] = useState<ClassSortOrder>("date-desc");
  const [page, setPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);
  const [loaded, setLoaded] = useState<LoadedPage | null>(null);

  /** `cursors[n]` starts page `n + 1`; page 1 always starts at `null`. */
  const [cursors, setCursors] = useState<(ClassPageCursor | null)[]>([null]);

  const debouncedSearchTerm = useDebouncedValue(
    filters.searchTerm,
    SEARCH_DEBOUNCE_MS,
  );

  // The debounced term is what actually reaches Firestore; the raw one only
  // drives the input's own value.
  //
  // Depending on the individual fields rather than on `filters` is what makes
  // the debounce real: spreading `filters` would produce a new object on every
  // keystroke, and the query effect would re-run for each one even though the
  // value it reads had not changed yet.
  const effectiveFilters = useMemo<ClassFilters>(
    () => ({
      searchTerm: debouncedSearchTerm,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      teacher: filters.teacher,
      code: filters.code,
    }),
    [
      debouncedSearchTerm,
      filters.fromDate,
      filters.toDate,
      filters.teacher,
      filters.code,
    ],
  );

  /** Identifies a distinct result set, so paging state resets when it changes. */
  const querySignature = useMemo(
    () => JSON.stringify({ ...effectiveFilters, sortOrder }),
    [effectiveFilters, sortOrder],
  );

  // A new filter or sort produces a different result set, so cursors collected
  // for the previous one are meaningless and the list restarts at page 1.
  // Adjusting during render rather than in an effect: React re-runs this
  // component immediately without committing the stale paging state to the DOM.
  const [lastSignature, setLastSignature] = useState(querySignature);
  if (lastSignature !== querySignature) {
    setLastSignature(querySignature);
    setCursors([null]);
    setPage(1);
  }

  /** Cursor that starts the page being requested. */
  const cursor = cursors[page - 1] ?? null;

  /** Identifies the request the current render expects an answer for. */
  const requestKey = `${querySignature}|${String(page)}|${String(retryToken)}`;

  /** Latest request in flight, so a slow earlier response is ignored. */
  const latestRequestKeyRef = useRef(requestKey);

  useEffect(() => {
    latestRequestKeyRef.current = requestKey;

    const request = { filters: effectiveFilters, sortOrder, pageSize, cursor };

    void Promise.all([
      repository.findPage(request),
      repository.countAll(request),
    ]).then(([pageResult, countResult]) => {
      // A newer query started while this one was in flight; drop the result.
      if (latestRequestKeyRef.current !== requestKey) return;

      if (!pageResult.ok) {
        setLoaded({
          requestKey,
          items: NO_RECORDS,
          totalItems: 0,
          error: pageResult.error,
        });
        trackEvent(ANALYTICS_EVENTS.errorStateShown, {
          surface,
          error_code: pageResult.error.code,
        });
        return;
      }

      const { items, nextCursor } = pageResult.value;

      // Extend the cursor trail only when this page is the furthest reached,
      // so navigating backwards never truncates or duplicates it.
      if (nextCursor !== null) {
        setCursors((current) =>
          current.length === page ? [...current, nextCursor] : current,
        );
      }

      // A failed count must not fail the page: the list still renders, it just
      // falls back to the number of rows it actually has.
      const totalItems = countResult.ok ? countResult.value : items.length;
      setLoaded({ requestKey, items, totalItems, error: null });

      trackEvent(ANALYTICS_EVENTS.searchPerformed, {
        query_length: effectiveFilters.searchTerm.length,
        result_count: totalItems,
        has_filters: countActiveFilters(effectiveFilters) > 0,
      });
    });
  }, [
    repository,
    requestKey,
    effectiveFilters,
    sortOrder,
    pageSize,
    cursor,
    page,
    surface,
  ]);

  const setFilters = useCallback((update: Partial<ClassFilters>): void => {
    setFiltersState((current) => ({ ...current, ...update }));
  }, []);

  const clearFilters = useCallback((): void => {
    setFiltersState(EMPTY_CLASS_FILTERS);
    trackEvent(ANALYTICS_EVENTS.filtersCleared, { surface });
  }, [surface]);

  const setSortOrder = useCallback((order: ClassSortOrder): void => {
    setSortOrderState(order);
  }, []);

  const goToPage = useCallback(
    (nextPage: number): void => {
      // Only pages whose starting cursor is known can be jumped to.
      if (nextPage < 1 || nextPage > cursors.length) return;
      setPage(nextPage);
    },
    [cursors.length],
  );

  const retry = useCallback((): void => {
    setRetryToken((token) => token + 1);
  }, []);

  // The list state is derived from whether the loaded page answers the request
  // this render is making, which removes the need for a separate status state.
  const isCurrent = loaded !== null && loaded.requestKey === requestKey;
  const status: ClassSearchStatus = !isCurrent
    ? "loading"
    : loaded.error !== null
      ? "error"
      : "success";

  const items = isCurrent ? loaded.items : NO_RECORDS;
  const totalItems = isCurrent ? loaded.totalItems : 0;

  return {
    items,
    status,
    error: isCurrent ? loaded.error : null,
    isEmpty: status === "success" && items.length === 0,
    filters,
    sortOrder,
    activeFilterCount: countActiveFilters(filters),
    page,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    totalItems,
    reachablePageCount: cursors.length,
    pageSize,
    setFilters,
    clearFilters,
    setSortOrder,
    goToPage,
    retry,
  };
}
