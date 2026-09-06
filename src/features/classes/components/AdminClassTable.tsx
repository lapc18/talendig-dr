/**
 * Administrative class list with per-row edit and delete actions.
 *
 * Below `lg` each row becomes a card with the actions at the foot, matching the
 * collapse note on artboard 1f.
 */

import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { buildEditClassPath } from "@/app/routes";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { COPY } from "@/shared/i18n/copy";
import { formatShortDate } from "@/shared/utils/date";
import type { ClassRecord } from "../types";

/** Props for {@link AdminClassTable}. */
export interface AdminClassTableProps {
  readonly records: readonly ClassRecord[];
  readonly onDelete: (record: ClassRecord) => void;
}

/** Header cell style, shared by every column. */
const HEADER_CELL_CLASSES =
  "px-3 py-3 font-sans text-caption font-semibold text-ink-700 uppercase";

/** Outline-button styling applied to the edit link. */
const EDIT_LINK_CLASSES = [
  "inline-flex h-[38px] items-center justify-center rounded-control px-3",
  "border border-ink-200 bg-white font-sans text-[12.5px] font-bold",
  "text-navy-900 no-underline transition-colors",
  "hover:border-teal-500 hover:text-teal-800 hover:no-underline",
].join(" ");

/** Props for {@link RowActions}. */
interface RowActionsProps {
  readonly record: ClassRecord;
  readonly onDelete: (record: ClassRecord) => void;
}

/**
 * Renders the per-row actions, shared by the table and the card layouts.
 *
 * Edit is a link rather than a button so it keeps native navigation — middle
 * click, open in new tab, and a real href in the status bar.
 *
 * @param props - The class the actions apply to and the delete handler.
 * @returns The action controls.
 */
function RowActions({ record, onDelete }: RowActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Link to={buildEditClassPath(record.id)} className={EDIT_LINK_CLASSES}>
        {COPY.actions.edit}
      </Link>
      <Button
        size="sm"
        variant="danger"
        className="px-3"
        onClick={() => {
          onDelete(record);
        }}
      >
        {COPY.actions.delete}
      </Button>
    </div>
  );
}

/**
 * Renders the administrative class list.
 *
 * @param props - The records and the delete handler.
 * @returns The list element.
 */
export function AdminClassTable({ records, onDelete }: AdminClassTableProps) {
  return (
    <>
      <table className="hidden w-full border-collapse text-left lg:table">
        <thead>
          <tr className="bg-navy-50">
            <th className={`${HEADER_CELL_CLASSES} w-[130px] pl-5`}>
              {COPY.table.date}
            </th>
            <th className={`${HEADER_CELL_CLASSES} w-[110px]`}>
              {COPY.table.code}
            </th>
            <th className={HEADER_CELL_CLASSES}>{COPY.table.className}</th>
            <th className={`${HEADER_CELL_CLASSES} w-[190px]`}>
              {COPY.table.teacher}
            </th>
            <th className={`${HEADER_CELL_CLASSES} w-[140px] hidden xl:table-cell`}>
              {COPY.table.link}
            </th>
            <th className={`${HEADER_CELL_CLASSES} w-[170px] pr-5 text-right`}>
              {COPY.table.actions}
            </th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-t border-ink-100 transition-colors hover:bg-ink-50"
            >
              <td className="px-3 py-3.5 pl-5 font-sans text-[13.5px] font-medium whitespace-nowrap text-ink-700">
                {formatShortDate(record.date)}
              </td>
              <td className="px-3 py-3.5">
                <Badge>{record.code}</Badge>
              </td>
              <td className="px-3 py-3.5 font-sans text-sm leading-[1.35] font-bold text-navy-900">
                {record.name}
              </td>
              <td className="px-3 py-3.5 font-sans text-[13.5px] font-medium text-ink-700">
                {record.teacher}
              </td>
              <td className="hidden px-3 py-3.5 xl:table-cell">
                <a
                  href={record.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[12.5px] font-medium"
                >
                  {COPY.actions.viewRecording}
                  <ExternalLink size={11} strokeWidth={2.5} aria-hidden="true" />
                </a>
              </td>
              <td className="px-3 py-3.5 pr-5">
                <RowActions record={record} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 p-4 lg:hidden">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-card border border-ink-100 p-3.5"
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
            <p className="mt-0.5 mb-3 font-sans text-[13px] text-ink-600">
              {record.teacher}
            </p>
            <RowActions record={record} onDelete={onDelete} />
          </article>
        ))}
      </div>
    </>
  );
}
