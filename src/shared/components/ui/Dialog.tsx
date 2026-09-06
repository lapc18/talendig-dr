/**
 * Centred modal dialog.
 */

import type { ReactNode } from "react";
import { useModalDialog } from "@/shared/hooks/useModalDialog";
import { cn } from "@/shared/utils/cn";

/** Props for {@link Dialog}. */
export interface DialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** Accessible name for the dialog. */
  readonly title: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Renders a centred modal.
 *
 * @param props - Open state, close handler, accessible title and content.
 * @returns The dialog element.
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  className,
  children,
}: DialogProps) {
  const dialogRef = useModalDialog(isOpen, onClose);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      className={cn(
        "m-auto w-[480px] max-w-[calc(100vw-2rem)] rounded-dialog bg-white p-7",
        "shadow-dialog backdrop:bg-navy-900/42",
        className,
      )}
    >
      {/* The element is kept mounted while closed, so content is skipped to
          avoid running effects and network calls for a hidden dialog. */}
      {isOpen ? children : null}
    </dialog>
  );
}
