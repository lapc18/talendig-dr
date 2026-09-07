import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithEmailAndPassword = vi.fn();
const firebaseSignOut = vi.fn();
const onAuthStateChanged = vi.fn();

vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/auth")>()),
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: (...args: unknown[]) =>
    signInWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => firebaseSignOut(...args),
  onAuthStateChanged: (...args: unknown[]) => onAuthStateChanged(...args),
}));

const { FirebaseAuthService } = await import("./firebaseAuthService");

/**
 * Builds a Firebase user stand-in.
 *
 * @param overrides - Fields to set on the user.
 * @returns The stand-in user.
 */
function firebaseUser(overrides: Record<string, unknown> = {}) {
  return {
    uid: "uid-1",
    email: "yokasta.reyes@classes.talendig.test",
    displayName: null,
    ...overrides,
  };
}

describe("FirebaseAuthService", () => {
  beforeEach(() => {
    signInWithEmailAndPassword.mockReset();
    firebaseSignOut.mockReset();
    onAuthStateChanged.mockReset();
  });

  describe("signIn", () => {
    it("turns a username into the account email with the configured domain", async () => {
      signInWithEmailAndPassword.mockResolvedValue({ user: firebaseUser() });

      await new FirebaseAuthService().signIn({
        username: "yokasta.reyes",
        password: "secreta",
      });

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "yokasta.reyes@classes.talendig.test",
        "secreta",
      );
    });

    it("normalises the typed username, so casing and spaces do not lock anyone out", async () => {
      signInWithEmailAndPassword.mockResolvedValue({ user: firebaseUser() });

      await new FirebaseAuthService().signIn({
        username: "  Yokasta.Reyes  ",
        password: "secreta",
      });

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "yokasta.reyes@classes.talendig.test",
        "secreta",
      );
    });

    it("derives a readable name and initials from the username", async () => {
      signInWithEmailAndPassword.mockResolvedValue({ user: firebaseUser() });

      const result = await new FirebaseAuthService().signIn({
        username: "yokasta.reyes",
        password: "secreta",
      });

      expect(result.ok && result.value).toMatchObject({
        id: "uid-1",
        username: "yokasta.reyes",
        displayName: "Yokasta Reyes",
        initials: "YR",
      });
    });

    it("prefers the display name an administrator set", async () => {
      signInWithEmailAndPassword.mockResolvedValue({
        user: firebaseUser({ displayName: "Ana Mercedes Fernández" }),
      });

      const result = await new FirebaseAuthService().signIn({
        username: "ana.fernandez",
        password: "secreta",
      });

      expect(result.ok && result.value.displayName).toBe(
        "Ana Mercedes Fernández",
      );
      expect(result.ok && result.value.initials).toBe("AM");
    });

    it("ignores a blank display name", async () => {
      signInWithEmailAndPassword.mockResolvedValue({
        user: firebaseUser({
          displayName: "   ",
          email: "luis.nunez@classes.talendig.test",
        }),
      });

      const result = await new FirebaseAuthService().signIn({
        username: "luis.nunez",
        password: "secreta",
      });

      expect(result.ok && result.value.displayName).toBe("Luis Nunez");
    });

    it("normalises a rejection into an application error", async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        code: "auth/invalid-credential",
      });

      const result = await new FirebaseAuthService().signIn({
        username: "yokasta.reyes",
        password: "incorrecta",
      });

      expect(result.ok).toBe(false);
      expect(!result.ok && result.error.code).toBe("auth/invalid-credentials");
    });

    it("logs the account domain, the likeliest cause of a blanket failure", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      signInWithEmailAndPassword.mockRejectedValue({
        code: "auth/invalid-credential",
      });

      await new FirebaseAuthService().signIn({
        username: "yokasta.reyes",
        password: "secreta",
      });

      expect(JSON.stringify(warn.mock.calls)).toContain(
        "classes.talendig.test",
      );
    });

    it("never writes the credentials to the log", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      signInWithEmailAndPassword.mockRejectedValue({ code: "auth/wrong-password" });

      await new FirebaseAuthService().signIn({
        username: "yokasta.reyes",
        password: "super-secreta",
      });

      const logged = JSON.stringify(warn.mock.calls);
      expect(logged).not.toContain("super-secreta");
      expect(logged).not.toContain("yokasta.reyes");
    });
  });

  describe("signOut", () => {
    it("reports success", async () => {
      firebaseSignOut.mockResolvedValue(undefined);

      expect(await new FirebaseAuthService().signOut()).toMatchObject({
        ok: true,
      });
    });

    it("normalises a failure instead of throwing", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      firebaseSignOut.mockRejectedValue({ code: "auth/network-request-failed" });

      const result = await new FirebaseAuthService().signOut();

      expect(result.ok).toBe(false);
      expect(!result.ok && result.error.code).toBe("auth/network");
    });
  });

  describe("observeSession", () => {
    it("reports a signed-in teacher", () => {
      const onChange = vi.fn();
      onAuthStateChanged.mockImplementation(
        (_auth: unknown, callback: (user: unknown) => void) => {
          callback(firebaseUser());
          return () => undefined;
        },
      );

      new FirebaseAuthService().observeSession(onChange);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ username: "yokasta.reyes" }),
      );
    });

    it("reports a signed-out session as null", () => {
      const onChange = vi.fn();
      onAuthStateChanged.mockImplementation(
        (_auth: unknown, callback: (user: unknown) => void) => {
          callback(null);
          return () => undefined;
        },
      );

      new FirebaseAuthService().observeSession(onChange);

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("hands back Firebase's unsubscribe function", () => {
      const unsubscribe = vi.fn();
      onAuthStateChanged.mockReturnValue(unsubscribe);

      expect(new FirebaseAuthService().observeSession(vi.fn())).toBe(
        unsubscribe,
      );
    });
  });
});
