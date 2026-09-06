import { describe, expect, it } from "vitest";
import { COPY } from "@/shared/i18n/copy";
import { createAppError, toAuthError, toClassesError } from "./errors";

describe("createAppError", () => {
  it("keeps the original error as the cause without surfacing it", () => {
    const cause = new Error("FirebaseError: internal");
    const error = createAppError("auth/unknown", COPY.errors.unexpected, cause);

    expect(error.cause).toBe(cause);
    expect(error.userMessage).toBe(COPY.errors.unexpected);
  });
});

describe("toAuthError", () => {
  it.each([
    "auth/invalid-credential",
    "auth/invalid-email",
    "auth/user-not-found",
    "auth/wrong-password",
    "auth/user-disabled",
  ])(
    "maps %s to a single message, so no code reveals whether a user exists",
    (code) => {
      const error = toAuthError({ code });

      expect(error.code).toBe("auth/invalid-credentials");
      expect(error.userMessage).toBe(COPY.errors.invalidCredentials);
    },
  );

  it("maps rate limiting to its own message", () => {
    expect(toAuthError({ code: "auth/too-many-requests" }).code).toBe(
      "auth/too-many-attempts",
    );
  });

  it("maps a network failure to its own message", () => {
    expect(toAuthError({ code: "auth/network-request-failed" }).code).toBe(
      "auth/network",
    );
  });

  it("falls back to the generic message for an unrecognised code", () => {
    const error = toAuthError({ code: "auth/some-future-code" });

    expect(error.code).toBe("auth/unknown");
    expect(error.userMessage).toBe(COPY.errors.unexpected);
  });

  it("handles values that are not Firebase errors at all", () => {
    expect(toAuthError(null).code).toBe("auth/unknown");
    expect(toAuthError("boom").code).toBe("auth/unknown");
    expect(toAuthError(new Error("boom")).code).toBe("auth/unknown");
  });

  it("never puts the raw error text in the user message", () => {
    const error = toAuthError(new Error("Firebase: quota exceeded (auth/x)."));

    expect(error.userMessage).not.toContain("Firebase");
  });
});

describe("toClassesError", () => {
  it.each([
    ["permission-denied", "classes/permission-denied"],
    ["unauthenticated", "classes/permission-denied"],
    ["not-found", "classes/not-found"],
    ["unavailable", "classes/unavailable"],
    ["deadline-exceeded", "classes/unavailable"],
  ])("maps the Firestore code %s to %s", (firestoreCode, expected) => {
    expect(toClassesError({ code: firestoreCode }).code).toBe(expected);
  });

  it("falls back to the generic class error for an unrecognised code", () => {
    expect(toClassesError({ code: "resource-exhausted" }).code).toBe(
      "classes/unknown",
    );
  });

  it("always produces a message that is safe to render", () => {
    expect(toClassesError(undefined).userMessage).toBe(COPY.errors.unexpected);
  });
});
