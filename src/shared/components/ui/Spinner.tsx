/**
 * Inline loading indicator used inside buttons and small surfaces.
 */

import { cn } from "@/shared/utils/cn";

/** Props for {@link Spinner}. */
export interface SpinnerProps {
  /** Extra classes, typically the ring colours for the surface it sits on. */
  readonly className?: string;
}

/**
 * Renders a 13px spinning ring.
 *
 * Decorative by design: the surrounding control announces the busy state via
 * `aria-busy`, so a second announcement here would be noise.
 *
 * @param props - Optional class overrides.
 * @returns The spinner element.
 */
export function Spinner({ className }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-[13px] shrink-0 animate-spin rounded-full border-2",
        className,
      )}
    />
  );
}
