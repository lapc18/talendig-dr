/**
 * Browser entry point.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
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

installGlobalErrorReporting();

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error('index.html is missing the <div id="root"> mount point.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
