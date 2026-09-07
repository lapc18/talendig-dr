/**
 * Page navigation for class lists.
 *
 * Firestore pages with cursors rather than offsets, so a page is only directly
 * reachable once the cursor that starts it is known. Pages past
 * `reachablePageCount` therefore render disabled and are reached with `Next`,
 * which is one click each and costs no extra reads.
 */

import { COPY } from "@/shared/i18n/copy";
import { cn } from "@/shared/utils/cn";

/** Props for {@link Pagination}. */
export interface PaginationProps {
  /** 1-based index of the page being shown. */
  readonly currentPage: number;
  readonly totalPages: number;
  /** Highest page number the caller can jump to directly. */
  readonly reachablePageCount: number;
  /** Total matching records, used for the "showing x–y of z" line. */
  readonly totalItems: number;
  /** How many records are on the current page. */
  readonly pageItemCount: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
}

/** Shared geometry for every control in the bar. */
const CONTROL_CLASSES =
  "h-9 rounded-[9px] border border-ink-200 bg-white font-sans text-[12.5px] font-semibold text-navy-900 transition-colors";

/**
 * Renders the pagination bar.
 *
 * @param props - Page state and the change handler.
 * @returns The pagination element, or `null` when there is nothing to page.
 */
export function Pagination({
  currentPage,
  totalPages,
  reachablePageCount,
  totalItems,
  pageItemCount,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = firstItem + pageItemCount - 1;

  return (
    <nav
      aria-label={COPY.publicSearch.paginationLabel}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <span className="font-sans text-[13px] text-ink-600">
        Mostrando {firstItem}–{lastItem} de {totalItems}
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => {
            onPageChange(currentPage - 1);
          }}
          className={cn(
            CONTROL_CLASSES,
            "px-3.5",
            "disabled:cursor-not-allowed disabled:text-ink-400",
            "not-disabled:cursor-pointer not-disabled:hover:border-teal-500",
          )}
        >
          {COPY.actions.previous}
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => {
            const isCurrent = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                aria-current={isCurrent ? "page" : undefined}
                disabled={page > reachablePageCount}
                onClick={() => {
                  onPageChange(page);
                }}
                className={cn(
                  CONTROL_CLASSES,
                  "w-9",
                  isCurrent && "border-0 bg-navy-900 font-bold text-white",
                  "disabled:cursor-not-allowed disabled:text-ink-400",
                  "not-disabled:cursor-pointer",
                  !isCurrent && "not-disabled:hover:border-teal-500",
                )}
              >
                {page}
              </button>
            );
          },
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => {
            onPageChange(currentPage + 1);
          }}
          className={cn(
            CONTROL_CLASSES,
            "px-3.5",
            "disabled:cursor-not-allowed disabled:text-ink-400",
            "not-disabled:cursor-pointer not-disabled:hover:border-teal-500",
          )}
        >
          {COPY.actions.next}
        </button>
      </div>
    </nav>
  );
}
