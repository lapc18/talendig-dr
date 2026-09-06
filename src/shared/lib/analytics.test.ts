import { afterEach, describe, expect, it, vi } from "vitest";

const logEvent = vi.fn();
const setUserId = vi.fn();
const isSupported = vi.fn(async () => true);

vi.mock("firebase/analytics", () => ({
  getAnalytics: vi.fn(() => ({})),
  isSupported: () => isSupported(),
  logEvent: (...args: unknown[]) => logEvent(...args),
  setUserId: (...args: unknown[]) => setUserId(...args),
}));

const { ANALYTICS_EVENTS, identifyUser, trackEvent } = await import(
  "./analytics"
);

describe("analytics", () => {
  afterEach(() => {
    logEvent.mockReset();
    setUserId.mockReset();
  });

  it("stays a no-op when no measurement id is configured", async () => {
    trackEvent(ANALYTICS_EVENTS.classDetailOpened, { class_code: "DEV-101" });
    await vi.waitFor(() => {
      expect(isSupported).not.toHaveBeenCalled();
    });

    expect(logEvent).not.toHaveBeenCalled();
  });

  it("does not throw when identifying a user with analytics disabled", async () => {
    expect(() => {
      identifyUser("uid-1");
    }).not.toThrow();

    await Promise.resolve();
    expect(setUserId).not.toHaveBeenCalled();
  });

  it("exposes stable snake_case event names", () => {
    for (const name of Object.values(ANALYTICS_EVENTS)) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("names an event for every action worth measuring", () => {
    expect(Object.values(ANALYTICS_EVENTS)).toEqual(
      expect.arrayContaining([
        "class_search_performed",
        "class_recording_opened",
        "class_created",
        "class_updated",
        "class_deleted",
        "teacher_login_succeeded",
        "teacher_login_failed",
        "error_state_shown",
      ]),
    );
  });
});
