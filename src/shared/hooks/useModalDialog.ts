/**
 * Drives a native `<dialog>` from React state.
 */

import { useEffect, useRef, type RefObject } from "react";

/**
 * Keeps a native `<dialog>` in sync with an `isOpen` flag and reports closes
 * the browser performs on its own (Escape, backdrop dismissal).
 *
 * The native element is used deliberately: the platform provides focus
 * trapping, focus restoration, inertness of the page behind, and Escape
 * handling — all of which a hand-rolled modal has to reimplement and usually
 * gets wrong.
 *
 * @param isOpen - Whether the dialog should be showing.
 * @param onClose - Called when the dialog closes by any means.
 * @returns A ref to attach to the `<dialog>` element.
 */
export function useModalDialog(
  isOpen: boolean,
  onClose: () => void,
): RefObject<HTMLDialogElement | null> {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    // `close` also fires for Escape and for form-method="dialog" submissions,
    // which is exactly why the parent state is driven from the event rather
    // than from click handlers alone.
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("close", onClose);
    };
  }, [onClose]);

  return dialogRef;
}
