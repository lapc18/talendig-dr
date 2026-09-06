/**
 * Class results as a table, used on wide viewports.
 */

import { Badge } from "@/shared/components/ui/Badge";
import { COPY } from "@/shared/i18n/copy";
import { formatShortDate } from "@/shared/utils/date";
import type { ClassRecord } from "../types";
import { RecordingLink } from "./RecordingLink";

/** Props for {@link ClassResultsTable}. */
export interface ClassResultsTableProps {
  readonly records: readonly ClassRecord[];
  readonly onSelect: (record: ClassRecord) => void;
}

/**
 * Renders the results table.
 *
 * The comment preview column drops out below `xl`, matching the collapse note
 * on artboard 1a.
 *
 * @param props - The records and the row selection handler.
 * @returns The table element.
 */
export function ClassResultsTable({
  records,
  onSelect,
}: ClassResultsTableProps) {
  return (
    <div className="overflow-hidden rounded-card border border-ink-100">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-navy-50">
            <th className="w-[118px] px-5 py-3.5 font-sans text-caption font-semibold text-ink-700 uppercase">
              {COPY.table.date}
            </th>
            <th className="w-[108px] px-2 py-3.5 font-sans text-caption font-semibold text-ink-700 uppercase">
              {COPY.table.code}
            </th>
            <th className="px-2 py-3.5 font-sans text-caption font-semibold text-ink-700 uppercase">
              {COPY.table.className}
            </th>
            <th className="w-[190px] px-2 py-3.5 font-sans text-caption font-semibold text-ink-700 uppercase">
              {COPY.table.teacher}
            </th>
            <th className="w-[160px] px-5 py-3.5 text-right font-sans text-caption font-semibold text-ink-700 uppercase">
              {COPY.table.recording}
            </th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-t border-ink-100 bg-white transition-colors hover:bg-ink-50"
            >
              <td className="px-5 py-4 align-middle font-sans text-[13.5px] font-medium whitespace-nowrap text-ink-700">
                {formatShortDate(record.date)}
              </td>
              <td className="px-2 py-4 align-middle">
                <Badge>{record.code}</Badge>
              </td>
              <td className="px-2 py-4 align-middle">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(record);
                  }}
                  className="cursor-pointer text-left font-sans text-[14.5px] leading-[1.35] font-bold text-navy-900 hover:text-teal-800"
                >
                  {record.name}
                </button>
                {record.comment !== "" && (
                  <p className="mt-0.5 hidden font-sans text-[12.5px] leading-[1.4] text-ink-600 xl:line-clamp-1">
                    {record.comment}
                  </p>
                )}
              </td>
              <td className="px-2 py-4 align-middle font-sans text-[13.5px] font-medium text-ink-700">
                {record.teacher}
              </td>
              <td className="px-5 py-4 text-right align-middle">
                <RecordingLink
                  href={record.link}
                  classCode={record.code}
                  surface="list"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
