import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FakeAuthService, TEST_USER } from "@/test/doubles/fakeAuthService";
import type { AuthService } from "../services/authService";
import { AuthProvider } from "./AuthProvider";

/**
 * Renders `useAuth` under a provider backed by the given service.
 *
 * @param authService - The service implementation to inject.
 * @returns The Testing Library hook result.
 */
function renderAuth(authService: AuthService) {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <AuthProvider authService={authService}>{children}</AuthProvider>
    ),
  });
}

describe("useAuth", () => {
  it("fails loudly when used outside a provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(/inside an <AuthProvider>/);
  });
});

describe("AuthProvider", () => {
  it("starts initialising, so the guard does not redirect too early", () => {
    const { result } = renderAuth(new FakeAuthService());

    expect(result.current.isInitialising).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it("settles to signed out when there is no session to restore", async () => {
    const { result } = renderAuth(new FakeAuthService());

    await waitFor(() => {
      expect(result.current.isInitialising).toBe(false);
    });
    expect(result.current.user).toBeNull();
  });

  it("restores an existing session", async () => {
    const { result } = renderAuth(
      new FakeAuthService({ initialUser: TEST_USER }),
    );

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });
    expect(result.current.user?.displayName).toBe("Yokasta Reyes");
    expect(result.current.isInitialising).toBe(false);
  });

  it("signs a teacher in and exposes the session", async () => {
    const { result } = renderAuth(new FakeAuthService());
    await waitFor(() => {
      expect(result.current.isInitialising).toBe(false);
    });

    await act(async () => {
      const outcome = await result.current.signIn({
        username: "yokasta.reyes",
        password: "correcta",
      });
      expect(outcome.ok).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.user?.username).toBe("yokasta.reyes");
    });
  });

  it("returns the error and stays signed out on bad credentials", async () => {
    const { result } = renderAuth(new FakeAuthService());
    await waitFor(() => {
      expect(result.current.isInitialising).toBe(false);
    });

    await act(async () => {
      const outcome = await result.current.signIn({
        username: "yokasta.reyes",
        password: "incorrecta",
      });
      expect(outcome.ok).toBe(false);
      expect(!outcome.ok && outcome.error.code).toBe("auth/invalid-credentials");
    });

    expect(result.current.user).toBeNull();
  });

  it("clears the in-flight flag after a failed sign-in", async () => {
    const { result } = renderAuth(new FakeAuthService());
    await waitFor(() => {
      expect(result.current.isInitialising).toBe(false);
    });

    await act(async () => {
      await result.current.signIn({ username: "x", password: "incorrecta" });
    });

    expect(result.current.isSigningIn).toBe(false);
  });

  it("signs out", async () => {
    const { result } = renderAuth(
      new FakeAuthService({ initialUser: TEST_USER }),
    );
    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
  });

  it("stops observing the session when it unmounts", async () => {
    const service = new FakeAuthService({ initialUser: TEST_USER });
    const { result, unmount } = renderAuth(service);

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    // A session change after unmount must not reach a torn-down provider.
    unmount();
    await expect(service.signOut()).resolves.toMatchObject({ ok: true });
  });
});
