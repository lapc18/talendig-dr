/**
 * Right-hand side panel.
 *
 * Below the `md` breakpoint it becomes a full-height sheet with a grab handle,
 * matching the responsive note on artboard 1c.
 */

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { COPY } from "@/shared/i18n/copy";
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
      className="mt-0 mr-0 mb-0 ml-auto h-dvh max-h-dvh w-[520px] max-w-full bg-white shadow-panel backdrop:bg-navy-900/42 sm:rounded-none"
    >
      {isOpen ? (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-7 py-6">
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

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-7 py-6">
            {children}
          </div>

          {footer !== undefined && (
            <div className="flex gap-2.5 border-t border-ink-100 px-7 py-5">
              {footer}
            </div>
          )}
        </div>
      ) : null}
    </dialog>
  );
}
