/**
 * Responsive switch between the results table and the card list.
 *
 * Both are rendered and toggled with CSS rather than a width listener, so the
 * layout is correct on the first paint and never flickers during hydration.
 */

import type { ClassRecord } from "../types";
import { ClassResultCard } from "./ClassResultCard";
import { ClassResultsTable } from "./ClassResultsTable";

/** Props for {@link ClassResultsList}. */
export interface ClassResultsListProps {
  readonly records: readonly ClassRecord[];
  readonly onSelect: (record: ClassRecord) => void;
}

/**
 * Renders class results in the layout that fits the viewport.
 *
 * @param props - The records and the selection handler.
 * @returns The results element.
 */
export function ClassResultsList({
  records,
  onSelect,
}: ClassResultsListProps) {
  return (
    <>
      <div className="hidden lg:block">
        <ClassResultsTable records={records} onSelect={onSelect} />
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {records.map((record) => (
          <ClassResultCard
            key={record.id}
            record={record}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  );
}
