/**
 * The three class filters: date range, teacher and class code.
 *
 * Extracted so the desktop filter row and the mobile filter sheet render the
 * exact same controls instead of drifting apart.
 */

import { Select } from "@/shared/components/ui/Select";
import { COPY } from "@/shared/i18n/copy";
import { cn } from "@/shared/utils/cn";
import { CONTROL_CLASSES } from "@/shared/components/ui/controlStyles";
import type { ClassFilters } from "../types";

/** Props for {@link ClassFilterFields}. */
export interface ClassFilterFieldsProps {
  readonly filters: ClassFilters;
  readonly teachers: readonly string[];
  readonly codes: readonly string[];
  readonly onChange: (update: Partial<ClassFilters>) => void;
  /** `row` lays the filters out side by side; `stack` is the mobile sheet. */
  readonly layout?: "row" | "stack";
}

/** Caption style shared by the three filter labels. */
const LABEL_CLASSES =
  "mb-[7px] block font-sans text-caption font-semibold text-ink-600 uppercase";

/**
 * Renders the filter controls.
 *
 * @param props - Current filters, dropdown options and the change handler.
 * @returns The filter fields.
 */
export function ClassFilterFields({
  filters,
  teachers,
  codes,
  onChange,
  layout = "row",
}: ClassFilterFieldsProps) {
  const isRow = layout === "row";

  return (
    <div
      className={cn(
        "gap-3",
        isRow ? "grid grid-cols-1 md:grid-cols-3" : "flex flex-col gap-[18px]",
      )}
    >
      <div>
        <span className={LABEL_CLASSES}>{COPY.publicSearch.dateRange}</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label={`${COPY.publicSearch.dateRange} — desde`}
            value={filters.fromDate ?? ""}
            max={filters.toDate ?? undefined}
            onChange={(event) => {
              onChange({ fromDate: event.target.value || null });
            }}
            className={cn(CONTROL_CLASSES, "h-11 font-medium")}
          />
          <input
            type="date"
            aria-label={`${COPY.publicSearch.dateRange} — hasta`}
            value={filters.toDate ?? ""}
            min={filters.fromDate ?? undefined}
            onChange={(event) => {
              onChange({ toDate: event.target.value || null });
            }}
            className={cn(CONTROL_CLASSES, "h-11 font-medium")}
          />
        </div>
      </div>

      <div>
        <span className={LABEL_CLASSES}>{COPY.publicSearch.teacher}</span>
        <Select
          aria-label={COPY.publicSearch.teacher}
          value={filters.teacher ?? ""}
          placeholderLabel={COPY.publicSearch.allTeachers}
          options={teachers.map((teacher) => ({
            value: teacher,
            label: teacher,
          }))}
          onChange={(event) => {
            onChange({ teacher: event.target.value || null });
          }}
          className="h-11"
        />
      </div>

      <div>
        <span className={LABEL_CLASSES}>{COPY.publicSearch.classCode}</span>
        <Select
          aria-label={COPY.publicSearch.classCode}
          value={filters.code ?? ""}
          placeholderLabel={COPY.publicSearch.allCodes}
          options={codes.map((code) => ({ value: code, label: code }))}
          onChange={(event) => {
            onChange({ code: event.target.value || null });
          }}
          className="h-11"
        />
      </div>
    </div>
  );
}
