/**
 * Test environment setup, loaded once before every suite.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * jsdom 30 ships `HTMLDialogElement` without `showModal`, `close` or the
 * `close` event, so the `Dialog` and `Drawer` components have nothing to drive.
 * This installs the minimum the components actually rely on: the `open`
 * property, the `close` event, and Escape-to-dismiss.
 */
function installDialogPolyfill(): void {
  const prototype = window.HTMLDialogElement.prototype;

  if (typeof prototype.showModal === "function") return;

  /** Dismisses the topmost open dialog when Escape is pressed. */
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    const dialogs = [...document.querySelectorAll("dialog")].filter(
      (dialog) => dialog.open,
    );
    dialogs.at(-1)?.close();
  };

  prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute("open", "");
    document.addEventListener("keydown", onKeyDown);
  };

  prototype.show = prototype.showModal;

  prototype.close = function close(this: HTMLDialogElement): void {
    if (!this.open) return;
    this.removeAttribute("open");
    document.removeEventListener("keydown", onKeyDown);
    this.dispatchEvent(new Event("close"));
  };
}

installDialogPolyfill();

afterEach(() => {
  cleanup();
});
