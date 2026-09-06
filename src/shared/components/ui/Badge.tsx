/**
 * Class-code badge.
 *
 * Style tile rule: neutral by default; solid navy when the badge is the subject
 * of the surface (detail panel, delete dialog); teal only for an active filter.
 */

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

/** Badge emphasis. */
export type BadgeTone = "neutral" | "navy" | "teal" | "dashed";

/** Per-tone classes. */
const TONE_CLASSES: Readonly<Record<BadgeTone, string>> = {
  neutral: "bg-navy-50 border border-navy-200 text-navy-900",
  navy: "bg-navy-900 text-white",
  teal: "bg-teal-50 border border-teal-200 text-teal-800",
  dashed: "border border-dashed border-navy-200 text-ink-600",
};

/** Props for {@link Badge}. */
export interface BadgeProps {
  readonly tone?: BadgeTone;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Renders a monospaced code badge.
 *
 * @param props - Tone, optional classes and the code to display.
 * @returns The badge element.
 */
export function Badge({ tone = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-badge px-[9px] py-[5px]",
        "font-mono text-[11.5px] leading-none font-bold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
