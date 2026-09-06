/**
 * Public class consultation — the screen students and teachers use to find a
 * class and open its recording. No authentication required.
 */

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { ActiveFilterChips } from "@/features/classes/components/ActiveFilterChips";
import { ClassDetailDrawer } from "@/features/classes/components/ClassDetailDrawer";
import { ClassFilterFields } from "@/features/classes/components/ClassFilterFields";
import { ClassResultsList } from "@/features/classes/components/ClassResultsList";
import { useClassFacets } from "@/features/classes/hooks/useClassFacets";
import { useClassSearch } from "@/features/classes/hooks/useClassSearch";
import type { ClassRecord, ClassSortOrder } from "@/features/classes/types";
import { PublicHeader } from "@/shared/components/layout/PublicHeader";
import { Button } from "@/shared/components/ui/Button";
import { Dialog } from "@/shared/components/ui/Dialog";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { Pagination } from "@/shared/components/ui/Pagination";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { Select } from "@/shared/components/ui/Select";
import { ClassListSkeleton } from "@/shared/components/ui/Skeleton";
import { ANALYTICS_EVENTS, trackEvent } from "@/shared/lib/analytics";
import { COPY } from "@/shared/i18n/copy";

/** Results per page on the public consultation. */
const PAGE_SIZE = 8;

/** Sort options offered above the results. */
const SORT_OPTIONS = [
  { value: "date-desc", label: COPY.publicSearch.sortNewest },
  { value: "date-asc", label: COPY.publicSearch.sortOldest },
] as const;

/**
 * Renders the public consultation screen.
 *
 * @returns The page element.
 */
export function PublicSearchPage() {
  const search = useClassSearch({ pageSize: PAGE_SIZE, surface: "public" });
  const { teachers, codes } = useClassFacets();

  const [selectedRecord, setSelectedRecord] = useState<ClassRecord | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  /** Opens the detail panel for a class and records the interaction. */
  function openDetail(record: ClassRecord): void {
    setSelectedRecord(record);
    trackEvent(ANALYTICS_EVENTS.classDetailOpened, { class_code: record.code });
  }

  return (
    <div className="min-h-dvh bg-ink-100">
      <PublicHeader />

      <main className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-10">
        <section className="bg-gradient-to-b from-navy-50 to-white pt-10 pb-6">
          <h1 className="mb-1.5 font-sans text-h1 text-navy-900">
            {COPY.publicSearch.title}
          </h1>
          <p className="mb-5 font-sans text-body text-ink-600">
            {COPY.publicSearch.subtitle}
          </p>

          <div className="flex gap-3">
            <SearchInput
              size="lg"
              label={COPY.publicSearch.searchPlaceholder}
              placeholder={COPY.publicSearch.searchPlaceholder}
              value={search.filters.searchTerm}
              onChange={(event) => {
                search.setFilters({ searchTerm: event.target.value });
              }}
              className="flex-1"
            />

            <Button
              size="lg"
              className="hidden shrink-0 lg:inline-flex"
              onClick={() => {
                search.retry();
              }}
            >
              {COPY.actions.search}
            </Button>

            <Button
              size="lg"
              className="shrink-0 lg:hidden"
              onClick={() => {
                setIsFilterSheetOpen(true);
              }}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              {search.activeFilterCount > 0
                ? `${COPY.actions.filters} · ${String(search.activeFilterCount)}`
                : COPY.actions.filters}
            </Button>
          </div>

          <div className="mt-3.5 hidden items-end gap-3 lg:flex">
            <ClassFilterFields
              filters={search.filters}
              teachers={teachers}
              codes={codes}
              onChange={search.setFilters}
            />
            <Button
              variant="secondary"
              className="h-11 shrink-0"
              onClick={search.clearFilters}
              disabled={search.activeFilterCount === 0}
            >
              {COPY.actions.clearFilters}
            </Button>
          </div>

          <ActiveFilterChips
            filters={search.filters}
            onChange={search.setFilters}
          />
        </section>

        <section className="pt-2">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2
              aria-live="polite"
              className="font-sans text-base leading-[1.3] font-bold text-navy-900"
            >
              {search.status === "success"
                ? `${String(search.totalItems)} ${search.totalItems === 1 ? "clase encontrada" : "clases encontradas"}`
                : " "}
            </h2>

            <label className="flex items-center gap-2 font-sans text-[13px] font-medium text-ink-600">
              {COPY.publicSearch.sortBy}
              <Select
                value={search.sortOrder}
                options={SORT_OPTIONS}
                onChange={(event) => {
                  search.setSortOrder(event.target.value as ClassSortOrder);
                }}
                className="h-9 w-auto min-w-[190px] py-0 text-[13px]"
              />
            </label>
          </div>

          {search.status === "loading" && (
            <ClassListSkeleton label={COPY.publicSearch.loading} />
          )}

          {search.status === "error" && search.error !== null && (
            <ErrorState
              detail={search.error.userMessage}
              onRetry={search.retry}
            />
          )}

          {search.status === "success" && search.isEmpty && (
            <EmptyState
              title={COPY.states.emptyTitle}
              body={COPY.states.emptyBody}
              action={
                search.activeFilterCount > 0 ? (
                  <Button variant="secondary" onClick={search.clearFilters}>
                    {COPY.actions.clearFilters}
                  </Button>
                ) : undefined
              }
            />
          )}

          {search.status === "success" && !search.isEmpty && (
            <>
              <ClassResultsList records={search.items} onSelect={openDetail} />

              <div className="mt-5">
                <Pagination
                  currentPage={search.page}
                  totalPages={search.totalPages}
                  reachablePageCount={search.reachablePageCount}
                  totalItems={search.totalItems}
                  pageItemCount={search.items.length}
                  pageSize={search.pageSize}
                  onPageChange={search.goToPage}
                />
              </div>
            </>
          )}
        </section>
      </main>

      <Dialog
        isOpen={isFilterSheetOpen}
        onClose={() => {
          setIsFilterSheetOpen(false);
        }}
        title={COPY.actions.filters}
      >
        <div className="mb-4.5 flex items-center justify-between">
          <h2 className="font-sans text-lg font-extrabold text-navy-900">
            {COPY.actions.filters}
          </h2>
          <button
            type="button"
            onClick={search.clearFilters}
            className="cursor-pointer font-sans text-[13px] font-semibold text-teal-700"
          >
            {COPY.actions.clear}
          </button>
        </div>

        <ClassFilterFields
          layout="stack"
          filters={search.filters}
          teachers={teachers}
          codes={codes}
          onChange={search.setFilters}
        />

        <Button
          size="lg"
          isFullWidth
          className="mt-5"
          onClick={() => {
            setIsFilterSheetOpen(false);
            trackEvent(ANALYTICS_EVENTS.filtersApplied, {
              filter_count: search.activeFilterCount,
              has_date_range:
                search.filters.fromDate !== null ||
                search.filters.toDate !== null,
              has_teacher: search.filters.teacher !== null,
              has_code: search.filters.code !== null,
            });
          }}
        >
          {COPY.actions.applyFilters} ({search.totalItems})
        </Button>
      </Dialog>

      <ClassDetailDrawer
        record={selectedRecord}
        onClose={() => {
          setSelectedRecord(null);
        }}
      />
    </div>
  );
}
