/**
 * Empty result state.
 */

import type { ReactNode } from "react";

/** Props for {@link EmptyState}. */
export interface EmptyStateProps {
  readonly title: string;
  readonly body: string;
  /** Optional recovery action, e.g. clearing the filters. */
  readonly action?: ReactNode;
}

/**
 * Renders the "nothing matched" state.
 *
 * @param props - Title, body and an optional action.
 * @returns The empty state element.
 */
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-navy-900/10 bg-white px-10 py-14 text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-5 size-14 rounded-full border-2 border-dashed border-navy-200"
      />
      <h3 className="mb-2 font-sans text-h3 font-extrabold text-navy-900">
        {title}
      </h3>
      <p className="mx-auto mb-[22px] max-w-sm font-sans text-sm leading-[1.6] text-ink-600">
        {body}
      </p>
      {action}
    </div>
  );
}
