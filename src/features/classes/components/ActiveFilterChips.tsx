/**
 * Dismissible chips summarising the filters currently applied.
 */

import { X } from "lucide-react";
import { COPY } from "@/shared/i18n/copy";
import { cn } from "@/shared/utils/cn";
import { formatShortDate } from "@/shared/utils/date";
import type { ClassFilters } from "../types";

/** One rendered chip. */
interface FilterChip {
  readonly key: string;
  readonly label: string;
  /** The filter reset this chip applies when dismissed. */
  readonly reset: Partial<ClassFilters>;
  /** Navy chips are date ranges; teal chips are exact-match filters. */
  readonly tone: "navy" | "teal";
}

/** Props for {@link ActiveFilterChips}. */
export interface ActiveFilterChipsProps {
  readonly filters: ClassFilters;
  readonly onChange: (update: Partial<ClassFilters>) => void;
}

/**
 * Describes the active date range in one short label.
 *
 * @param filters - The current filters.
 * @returns The label, or `null` when no date bound is set.
 */
function describeDateRange(filters: ClassFilters): string | null {
  const { fromDate, toDate } = filters;

  if (fromDate !== null && toDate !== null) {
    return `${formatShortDate(fromDate)} → ${formatShortDate(toDate)}`;
  }
  if (fromDate !== null) return `Desde ${formatShortDate(fromDate)}`;
  if (toDate !== null) return `Hasta ${formatShortDate(toDate)}`;
  return null;
}

/**
 * Builds the chip list for the active filters.
 *
 * @param filters - The current filters.
 * @returns The chips to render, in display order.
 */
function buildChips(filters: ClassFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  const dateLabel = describeDateRange(filters);

  if (dateLabel !== null) {
    chips.push({
      key: "date",
      label: dateLabel,
      reset: { fromDate: null, toDate: null },
      tone: "navy",
    });
  }

  if (filters.teacher !== null) {
    chips.push({
      key: "teacher",
      label: filters.teacher,
      reset: { teacher: null },
      tone: "teal",
    });
  }

  if (filters.code !== null) {
    chips.push({
      key: "code",
      label: filters.code,
      reset: { code: null },
      tone: "teal",
    });
  }

  return chips;
}

/**
 * Renders the active filter chips.
 *
 * @param props - Current filters and the change handler.
 * @returns The chip row, or `null` when no filter is active.
 */
export function ActiveFilterChips({
  filters,
  onChange,
}: ActiveFilterChipsProps) {
  const chips = buildChips(filters);
  if (chips.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="font-sans text-xs font-semibold text-ink-600">
        {COPY.publicSearch.activeFilters}
      </span>

      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => {
            onChange(chip.reset);
          }}
          aria-label={COPY.publicSearch.removeFilter(chip.label)}
          className={cn(
            "inline-flex cursor-pointer items-center gap-[7px] rounded-full px-[11px] py-1.5",
            "font-sans text-xs leading-none font-semibold transition-colors",
            chip.tone === "navy"
              ? "bg-navy-900 text-white hover:bg-navy-700"
              : "border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100",
          )}
        >
          {chip.label}
          <X
            size={11}
            strokeWidth={3}
            aria-hidden="true"
            className={chip.tone === "navy" ? "text-teal-300" : undefined}
          />
        </button>
      ))}
    </div>
  );
}
