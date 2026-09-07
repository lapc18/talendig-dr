/**
 * Browser entry point.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { COPY } from "./shared/i18n/copy";
import { logger } from "./shared/lib/logger";
import {
  isChunkLoadError,
  reloadForNewDeployment,
} from "./shared/lib/moduleLoading";
import "./styles/index.css";

/**
 * Reports failures that escape React entirely.
 *
 * A rejected promise nobody awaited, or an error thrown from a timer or an
 * event listener, never reaches an error boundary. Without this they vanish,
 * and "nothing fails silently" would be a claim the code does not keep.
 */
function installGlobalErrorReporting(): void {
  window.addEventListener("unhandledrejection", (event) => {
    // A preload that lost its race with a deploy is recoverable, not a bug.
    if (isChunkLoadError(event.reason) && reloadForNewDeployment()) return;
    logger.error("Unhandled promise rejection", event.reason);
  });

  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event.error)) {
      reloadForNewDeployment();
      return;
    }
    logger.error("Uncaught error", event.error, { source: event.filename });
  });

  // Vite raises this when a module preload fails, which after a deploy means
  // the preloaded chunk no longer exists.
  window.addEventListener("vite:preloadError", (event) => {
    if (!reloadForNewDeployment()) return;
    event.preventDefault();
  });
}

/**
 * Paints the failure that stopped the application from starting at all.
 *
 * Written with plain DOM on purpose: whatever failed did so while the module
 * graph was still evaluating, so React and the components below it may never
 * have been reached.
 *
 * @param root - The mount point to render into.
 */
function renderStartupFailure(root: HTMLElement): void {
  const frame = document.createElement("div");
  frame.setAttribute("role", "alert");
  frame.style.cssText =
    "min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:#edeff4;font-family:Montserrat,system-ui,sans-serif";

  const card = document.createElement("div");
  card.style.cssText =
    "max-width:28rem;width:100%;padding:2rem;border-radius:14px;background:#fff;text-align:center;box-shadow:0 2px 10px rgb(17 5 70 / 0.06)";

  const title = document.createElement("h1");
  title.textContent = COPY.errors.boundaryTitle;
  title.style.cssText =
    "margin:0 0 .5rem;font-size:1.5rem;font-weight:800;color:#110546";

  const body = document.createElement("p");
  body.textContent = COPY.errors.boundaryBody;
  body.style.cssText =
    "margin:0;font-size:.875rem;line-height:1.6;color:#6b7285";

  card.append(title, body);
  frame.append(card);
  root.replaceChildren(frame);
}

installGlobalErrorReporting();

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error('index.html is missing the <div id="root"> mount point.');
}

/*
 * Imported dynamically so a failure while the application's modules evaluate
 * is catchable. `config/env` validates at import and throws on a missing
 * variable; with a static import that throw happens above React, and every
 * visitor gets a blank page instead of the fallback written for exactly this.
 */
void import("./app/App")
  .then(({ App }) => {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((cause: unknown) => {
    if (isChunkLoadError(cause) && reloadForNewDeployment()) return;
    logger.error("The application could not start", cause);
    renderStartupFailure(rootElement);
  });
