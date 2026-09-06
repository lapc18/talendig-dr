import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearReloadGuard,
  importWithDeploymentRecovery,
  isChunkLoadError,
  reloadForNewDeployment,
} from "./moduleLoading";

/** Replaces `location.reload` with a spy, since jsdom cannot navigate. */
function stubReload() {
  const reload = vi.fn();
  Object.defineProperty(window, "location", {
    value: { ...window.location, reload },
    configurable: true,
    writable: true,
  });
  return reload;
}

describe("isChunkLoadError", () => {
  it.each([
    "Failed to fetch dynamically imported module: https://x/assets/LoginPage-abc.js",
    "error loading dynamically imported module",
    "Importing a module script failed.",
    "Expected a JavaScript module script but the server responded with a MIME type of 'text/html' is not a valid JavaScript MIME type.",
  ])("recognises the browser message %#", (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it("does not mistake an ordinary failure for a missing chunk", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of null"))).toBe(
      false,
    );
    expect(isChunkLoadError(new Error("Missing or insufficient permissions."))).toBe(
      false,
    );
  });

  it("handles values that are not errors", () => {
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError("failed to fetch dynamically imported module")).toBe(
      true,
    );
  });
});

describe("reloadForNewDeployment", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("reloads once", () => {
    const reload = stubReload();

    expect(reloadForNewDeployment()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("refuses a second reload, so a genuinely missing chunk cannot loop", () => {
    const reload = stubReload();

    reloadForNewDeployment();
    expect(reloadForNewDeployment()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("allows recovering again once a chunk has loaded", () => {
    const reload = stubReload();

    reloadForNewDeployment();
    clearReloadGuard();

    expect(reloadForNewDeployment()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("still reloads when the session store is unavailable", () => {
    const reload = stubReload();
    vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("access denied");
    });
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("access denied");
    });

    expect(reloadForNewDeployment()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("importWithDeploymentRecovery", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("returns the module when the import succeeds", async () => {
    const module = { default: "page" };

    await expect(
      importWithDeploymentRecovery(() => Promise.resolve(module)),
    ).resolves.toBe(module);
  });

  it("clears the guard on a successful load", async () => {
    stubReload();
    reloadForNewDeployment();

    await importWithDeploymentRecovery(() => Promise.resolve("ok"));

    expect(reloadForNewDeployment()).toBe(true);
  });

  it("reloads instead of surfacing a stale chunk to the reader", async () => {
    const reload = stubReload();
    let settled = false;

    void importWithDeploymentRecovery(() =>
      Promise.reject(
        new TypeError("Failed to fetch dynamically imported module: /a.js"),
      ),
    ).then(() => {
      settled = true;
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(reload).toHaveBeenCalledTimes(1);
    // The document is unloading, so the caller must stay suspended.
    expect(settled).toBe(false);
  });

  it("surfaces the failure once a reload has already been tried", async () => {
    stubReload();
    reloadForNewDeployment();

    await expect(
      importWithDeploymentRecovery(() =>
        Promise.reject(new TypeError("Failed to fetch dynamically imported module")),
      ),
    ).rejects.toThrow(/dynamically imported module/);
  });

  it("never reloads for an error that is not a chunk failure", async () => {
    const reload = stubReload();

    await expect(
      importWithDeploymentRecovery(() =>
        Promise.reject(new Error("boom in module body")),
      ),
    ).rejects.toThrow("boom in module body");
    expect(reload).not.toHaveBeenCalled();
  });
});
