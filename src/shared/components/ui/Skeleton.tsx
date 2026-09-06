/**
 * Loading placeholders.
 *
 * Skeletons reserve the final dimensions of the content they stand in for, so
 * the page does not jump when data arrives.
 */

import { cn } from "@/shared/utils/cn";

/** Props for {@link Skeleton}. */
export interface SkeletonProps {
  readonly className?: string;
}

/**
 * Renders a single shimmering placeholder block.
 *
 * @param props - Sizing classes for the block.
 * @returns The placeholder element.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-shimmer rounded-md bg-ink-100", className)}
    />
  );
}

/** Props for {@link ClassListSkeleton}. */
export interface ClassListSkeletonProps {
  /** How many placeholder rows to render. */
  readonly rowCount?: number;
  /** Status text announced to assistive technology. */
  readonly label: string;
}

/**
 * Renders the loading state of a class list.
 *
 * @param props - Row count and the status label.
 * @returns The skeleton list element.
 */
export function ClassListSkeleton({
  rowCount = 4,
  label,
}: ClassListSkeletonProps) {
  return (
    <div role="status" aria-live="polite" className="rounded-card bg-white p-6">
      <Skeleton className="mb-5 h-4 w-[190px]" />

      <div className="flex flex-col gap-3">
        {Array.from({ length: rowCount }, (_, index) => (
          <div
            key={index}
            className="animate-shimmer flex items-center gap-3.5 rounded-xl border border-ink-100 p-3.5"
          >
            <Skeleton className="h-6 w-16 shrink-0 animate-none" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-[13px] w-[70%] animate-none" />
              <Skeleton className="h-[11px] w-[44%] animate-none bg-navy-50" />
            </div>
            <Skeleton className="h-[34px] w-[104px] shrink-0 animate-none bg-navy-50" />
          </div>
        ))}
      </div>

      <p className="mt-4.5 text-center font-sans text-xs font-medium text-ink-400">
        {label}
      </p>
    </div>
  );
}
