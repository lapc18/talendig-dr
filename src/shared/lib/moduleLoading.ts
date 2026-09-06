/**
 * Recovery for page chunks that no longer exist.
 *
 * Every page is a separate chunk whose filename carries a content hash, and a
 * deploy replaces the whole set. A visitor holding the previous `index.html` —
 * from a browser cache, or simply from a tab left open across a release — asks
 * for a chunk that is no longer on the server, and the dynamic import rejects.
 *
 * Fetching the current `index.html` fixes it, which is what a reload does.
 */

import { logger } from "./logger";

/**
 * Marks that a reload has already been attempted, so a chunk that is genuinely
 * missing surfaces as an error instead of reloading forever. Session-scoped:
 * it clears with the tab.
 */
const RELOAD_ATTEMPTED_KEY = "talendig:chunk-reload-attempted";

/** Messages browsers use when a dynamic import cannot be fetched. */
const CHUNK_ERROR_PATTERNS = [
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "importing a module script failed",
  "'text/html' is not a valid javascript mime type",
];

/**
 * Reports whether an error means a page chunk could not be downloaded.
 *
 * Matching on the message is unavoidable: browsers throw a plain `TypeError`
 * for this, with no code or type to test.
 *
 * @param error - The rejection from a dynamic import.
 * @returns `true` when the failure is a missing or unreachable chunk.
 */
export function isChunkLoadError(error: unknown): boolean {
  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();

  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

/**
 * Reads the reload guard, treating an unavailable session store as "not tried".
 *
 * `sessionStorage` throws in private browsing modes and when site data is
 * blocked, and a crash here would defeat the recovery it exists to enable.
 *
 * @returns `true` when a reload has already been attempted this session.
 */
function hasReloadBeenAttempted(): boolean {
  try {
    return window.sessionStorage.getItem(RELOAD_ATTEMPTED_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Records that a reload is being attempted.
 */
function markReloadAttempted(): void {
  try {
    window.sessionStorage.setItem(RELOAD_ATTEMPTED_KEY, "1");
  } catch {
    // Without the guard a second failure would reload again, which the caller
    // accepts: recovering is worth more than a perfectly bounded retry.
  }
}

/**
 * Clears the guard once a chunk loads, so a later deploy can recover again.
 */
export function clearReloadGuard(): void {
  try {
    window.sessionStorage.removeItem(RELOAD_ATTEMPTED_KEY);
  } catch {
    // Nothing to clear when the store is unavailable.
  }
}

/**
 * Reloads the page once to pick up the current `index.html`.
 *
 * @returns `true` when a reload was started, `false` when one already was.
 */
export function reloadForNewDeployment(): boolean {
  if (hasReloadBeenAttempted()) return false;

  markReloadAttempted();
  logger.warn("A page chunk was missing; reloading to pick up the new build");
  window.location.reload();

  return true;
}

/**
 * Loads a lazily imported module, recovering from a stale-deployment failure.
 *
 * @param load - The dynamic import to run.
 * @returns The module. The promise never settles when a reload is triggered,
 *          because the document is being replaced.
 * @throws The original error when it is not a chunk failure, or when a reload
 *         has already been attempted this session.
 */
export async function importWithDeploymentRecovery<T>(
  load: () => Promise<T>,
): Promise<T> {
  try {
    const module = await load();
    clearReloadGuard();
    return module;
  } catch (error) {
    if (!isChunkLoadError(error) || !reloadForNewDeployment()) throw error;

    // The document is unloading; suspend rather than render anything.
    return new Promise<T>(() => undefined);
  }
}
