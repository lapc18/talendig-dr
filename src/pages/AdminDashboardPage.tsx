/**
 * Administrative class list: search, page, edit and delete.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes";
import { AdminClassTable } from "@/features/classes/components/AdminClassTable";
import { DeleteClassDialog } from "@/features/classes/components/DeleteClassDialog";
import { useClassFacets } from "@/features/classes/hooks/useClassFacets";
import { useClassMutations } from "@/features/classes/hooks/useClassMutations";
import { useClassSearch } from "@/features/classes/hooks/useClassSearch";
import type { ClassRecord } from "@/features/classes/types";
import { AdminHeader } from "@/shared/components/layout/AdminHeader";
import { Alert } from "@/shared/components/ui/Alert";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { Pagination } from "@/shared/components/ui/Pagination";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { Select } from "@/shared/components/ui/Select";
import { ClassListSkeleton } from "@/shared/components/ui/Skeleton";
import { COPY } from "@/shared/i18n/copy";
import { formatDateTime } from "@/shared/utils/date";

/** Rows per page in the administrative list. */
const PAGE_SIZE = 10;

/**
 * Renders the administrative dashboard.
 *
 * @returns The page element.
 */
export function AdminDashboardPage() {
  const search = useClassSearch({ pageSize: PAGE_SIZE, surface: "admin" });
  const { teachers } = useClassFacets();
  const { isDeleting, deleteClass } = useClassMutations();

  const [pendingDeletion, setPendingDeletion] = useState<ClassRecord | null>(null);

  /**
   * The most recent change among the classes on screen.
   *
   * Derived from the records rather than from the clock: reading `new Date()`
   * during render claimed a freshness the app never checked, and made the
   * displayed time jump on every keystroke in the search box.
   */
  const lastUpdatedAt = useMemo<Date | null>(() => {
    if (search.items.length === 0) return null;
    const newest = Math.max(
      ...search.items.map((record) => record.updatedAt.getTime()),
    );
    return new Date(newest);
  }, [search.items]);
  const [deletionError, setDeletionError] = useState<string | null>(null);

  /** Deletes a class, then refreshes the list so the row disappears. */
  async function confirmDeletion(record: ClassRecord): Promise<void> {
    setDeletionError(null);
    const result = await deleteClass(record.id, record.code);

    if (!result.ok) {
      setDeletionError(result.error.userMessage);
      return;
    }

    setPendingDeletion(null);
    search.retry();
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <AdminHeader />

      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-1 font-sans text-h1 text-navy-900">
              {COPY.admin.title}
            </h1>
            <p className="font-sans text-sm text-ink-600">
              {search.totalItems}{" "}
              {search.totalItems === 1
                ? COPY.admin.classSingular
                : COPY.admin.classPlural}
              {lastUpdatedAt !== null && (
                <>
                  {" · "}
                  {COPY.admin.lastUpdate}: {formatDateTime(lastUpdatedAt)}
                </>
              )}
            </p>
          </div>

          <Link
            to={ROUTES.adminNewClass}
            className="inline-flex h-12 items-center rounded-control bg-navy-900 px-[22px] font-sans text-sm font-bold text-white no-underline transition-colors hover:bg-navy-700 hover:text-white hover:no-underline"
          >
            {COPY.actions.newClass}
          </Link>
        </div>

        {deletionError !== null && (
          <Alert className="mb-4">{deletionError}</Alert>
        )}

        <div className="overflow-hidden rounded-card border border-navy-900/9 bg-white shadow-row">
          <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-5 py-4">
            <SearchInput
              label={COPY.admin.searchPlaceholder}
              placeholder={COPY.admin.searchPlaceholder}
              value={search.filters.searchTerm}
              onChange={(event) => {
                search.setFilters({ searchTerm: event.target.value });
              }}
              className="w-full max-w-[380px] flex-1"
            />

            <Select
              aria-label={COPY.publicSearch.teacher}
              value={search.filters.teacher ?? ""}
              placeholderLabel={COPY.admin.teacherFilterAll}
              options={teachers.map((teacher) => ({
                value: teacher,
                label: teacher,
              }))}
              onChange={(event) => {
                search.setFilters({ teacher: event.target.value || null });
              }}
              className="h-[42px] w-auto min-w-[200px] text-[13.5px]"
            />
          </div>

          {search.status === "loading" && (
            <ClassListSkeleton rowCount={6} label={COPY.publicSearch.loading} />
          )}

          {search.status === "error" && search.error !== null && (
            <div className="p-6">
              <ErrorState
                detail={search.error.userMessage}
                onRetry={search.retry}
              />
            </div>
          )}

          {search.status === "success" && search.isEmpty && (
            <div className="p-6">
              <EmptyState
                title={COPY.states.emptyTitle}
                body={COPY.states.emptyBody}
              />
            </div>
          )}

          {search.status === "success" && !search.isEmpty && (
            <>
              <AdminClassTable
                records={search.items}
                onDelete={(record) => {
                  setDeletionError(null);
                  setPendingDeletion(record);
                }}
              />

              <div className="border-t border-ink-100 px-5 py-4">
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
        </div>
      </main>

      <DeleteClassDialog
        record={pendingDeletion}
        isDeleting={isDeleting}
        onCancel={() => {
          setPendingDeletion(null);
          setDeletionError(null);
        }}
        onConfirm={(record) => {
          void confirmDeletion(record);
        }}
      />
    </div>
  );
}
