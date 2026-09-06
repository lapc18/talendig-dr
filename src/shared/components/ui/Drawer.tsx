/**
 * Right-hand side panel.
 *
 * Below the `md` breakpoint it becomes a full-height sheet with a grab handle,
 * matching the responsive note on artboard 1c.
 */

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { COPY } from "@/shared/i18n/copy";
import { cn } from "@/shared/utils/cn";
import { useModalDialog } from "@/shared/hooks/useModalDialog";

/** Props for {@link Drawer}. */
export interface DrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** Accessible name for the panel. */
  readonly title: string;
  /** Content of the sticky header, above the divider. */
  readonly header: ReactNode;
  /** Scrolling body content. */
  readonly children: ReactNode;
  /** Actions pinned to the bottom of the panel. */
  readonly footer?: ReactNode;
}

/**
 * Renders a side panel.
 *
 * @param props - Open state, close handler, title and content slots.
 * @returns The drawer element.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  header,
  children,
  footer,
}: DrawerProps) {
  const dialogRef = useModalDialog(isOpen, onClose);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      className={cn(
        "m-0 w-full max-w-full bg-white shadow-panel backdrop:bg-navy-900/42",
        // Below `sm` the panel becomes a bottom sheet, which is how a
        // one-handed reader expects to dismiss it; from `sm` up it is the
        // full-height side panel the design specifies.
        "mt-auto max-h-[88dvh] rounded-t-2xl",
        "sm:mt-0 sm:mr-0 sm:ml-auto sm:h-dvh sm:max-h-dvh sm:w-[520px] sm:rounded-none",
      )}
    >
      {isOpen ? (
        <div className="flex max-h-[88dvh] flex-col sm:max-h-none sm:h-full">
          <div
            aria-hidden="true"
            className="mx-auto mt-3 h-1 w-11 shrink-0 rounded-full bg-ink-200 sm:hidden"
          />
          <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-5 sm:px-7 sm:py-6">
            {header}
            <button
              type="button"
              onClick={onClose}
              aria-label={COPY.actions.close}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-ink-200 bg-ink-50 text-ink-700 transition-colors hover:bg-ink-100"
            >
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
            {children}
          </div>

          {footer !== undefined && (
            <div className="flex shrink-0 gap-2.5 border-t border-ink-100 px-5 py-4 sm:px-7 sm:py-5">
              {footer}
            </div>
          )}
        </div>
      ) : null}
    </dialog>
  );
}
