/**
 * Inline message banner, used for form-level and sign-in errors.
 */

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

/** Banner severity. */
export type AlertTone = "danger" | "info";

/** Per-tone classes. */
const TONE_CLASSES: Readonly<Record<AlertTone, string>> = {
  danger: "border-danger-border bg-danger-surface text-danger-strong",
  info: "border-teal-200 bg-teal-50 text-teal-800",
};

/** Props for {@link Alert}. */
export interface AlertProps {
  readonly tone?: AlertTone;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Renders a message banner.
 *
 * Danger banners use `role="alert"` so a failed sign-in is announced
 * immediately; informational ones are polite.
 *
 * @param props - Tone, optional classes and the message.
 * @returns The banner element.
 */
export function Alert({ tone = "danger", className, children }: AlertProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3",
        "font-sans text-[13px] leading-[1.5] font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {tone === "danger" && (
        <span aria-hidden="true" className="font-extrabold text-danger">
          !
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}
