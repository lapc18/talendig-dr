/**
 * One class rendered as a card, used on narrow viewports.
 */

import { Badge } from "@/shared/components/ui/Badge";
import { formatShortDate } from "@/shared/utils/date";
import type { ClassRecord } from "../types";
import { RecordingLink } from "./RecordingLink";

/** Props for {@link ClassResultCard}. */
export interface ClassResultCardProps {
  readonly record: ClassRecord;
  readonly onSelect: (record: ClassRecord) => void;
}

/**
 * Renders a class card.
 *
 * The card body is a button so the whole surface opens the detail panel, while
 * the recording link stays a separate, independently focusable target.
 *
 * @param props - The class and the selection handler.
 * @returns The card element.
 */
export function ClassResultCard({ record, onSelect }: ClassResultCardProps) {
  return (
    <article className="rounded-card border border-ink-100 bg-white p-3.5 shadow-row">
      <button
        type="button"
        onClick={() => {
          onSelect(record);
        }}
        className="w-full cursor-pointer text-left"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <Badge>{record.code}</Badge>
          <span className="font-sans text-xs font-medium text-ink-600">
            {formatShortDate(record.date)}
          </span>
        </div>
        <h3 className="font-sans text-[15px] leading-[1.3] font-bold text-navy-900">
          {record.name}
        </h3>
        <p className="mt-0.5 mb-3 font-sans text-[13px] leading-[1.4] text-ink-600">
          {record.teacher}
        </p>
      </button>

      <RecordingLink
        href={record.link}
        classCode={record.code}
        surface="list"
        className="w-full"
      />
    </article>
  );
}
