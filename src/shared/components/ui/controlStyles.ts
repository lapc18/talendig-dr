/**
 * Class strings shared by every form control.
 *
 * Kept out of the component modules so inputs, selects, textareas and the
 * date-range fields all inherit exactly the same box, focus and invalid
 * treatment.
 */

import { cn } from "@/shared/utils/cn";

/**
 * Base classes for inputs, selects and textareas.
 *
 * The focus treatment is a teal border plus a soft teal halo; the global
 * `:focus-visible` ring is overridden here because the design gives form
 * controls their own, tighter treatment.
 */
export const CONTROL_CLASSES = cn(
  "w-full rounded-control border border-ink-200 bg-white px-[14px]",
  "font-sans text-[14px] text-navy-900 placeholder:text-ink-400",
  "transition-shadow duration-150 outline-none",
  "focus:border-teal-500 focus:shadow-[0_0_0_3px_rgb(39_165_178/0.18)]",
  "focus:focus-visible:shadow-[0_0_0_3px_rgb(39_165_178/0.18)]",
  "aria-invalid:border-danger aria-invalid:shadow-none",
  "disabled:border-ink-100 disabled:bg-ink-50 disabled:text-ink-400",
);
