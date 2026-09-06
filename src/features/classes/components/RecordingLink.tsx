/**
 * Link to a class recording.
 *
 * Centralised so that every route to a recording — table row, mobile card,
 * detail panel — opens safely and reports the same analytics event.
 */

import { ExternalLink } from "lucide-react";
import { ANALYTICS_EVENTS, trackEvent } from "@/shared/lib/analytics";
import { COPY } from "@/shared/i18n/copy";
import { cn } from "@/shared/utils/cn";

/** Props for {@link RecordingLink}. */
export interface RecordingLinkProps {
  readonly href: string;
  /** Class code, sent with the analytics event. The URL itself never is. */
  readonly classCode: string;
  /** Where the click happened, for analytics. */
  readonly surface: "list" | "detail";
  /** `solid` is the primary action in the detail panel. */
  readonly emphasis?: "soft" | "solid";
  readonly className?: string;
}

/** Per-emphasis classes. */
const EMPHASIS_CLASSES = {
  soft: "border border-teal-200 bg-teal-50 text-teal-800 hover:border-teal-300 hover:bg-teal-100",
  solid: "bg-navy-900 text-white hover:bg-navy-700 hover:text-white",
} as const;

/**
 * Renders a link that opens a recording in a new tab.
 *
 * `noopener` is mandatory: the destination is teacher-supplied and must never
 * get a handle on this window.
 *
 * @param props - Destination, analytics metadata and emphasis.
 * @returns The link element.
 */
export function RecordingLink({
  href,
  classCode,
  surface,
  emphasis = "soft",
  className,
}: RecordingLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent(ANALYTICS_EVENTS.recordingOpened, {
          class_code: classCode,
          surface,
        });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-[7px] rounded-[9px] whitespace-nowrap",
        "px-3.5 py-2.5 font-sans text-[12.5px] leading-none font-bold",
        "no-underline transition-colors hover:no-underline",
        EMPHASIS_CLASSES[emphasis],
        className,
      )}
    >
      {COPY.actions.viewRecording}
      <ExternalLink size={12} strokeWidth={2.5} aria-hidden="true" />
    </a>
  );
}
