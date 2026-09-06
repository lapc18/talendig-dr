/**
 * Authentication provider.
 *
 * Holds the session, exposes sign-in and sign-out, and takes the `AuthService`
 * implementation as a prop so tests can supply a fake.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ANALYTICS_EVENTS,
  identifyUser,
  trackEvent,
} from "@/shared/lib/analytics";
import type { AppError } from "@/shared/lib/errors";
import type { Result } from "@/shared/lib/result";
import type { AuthService } from "../services/authService";
import type { AuthenticatedUser, Credentials } from "../types";
import { AuthContext, type AuthContextValue } from "./authContext";

/** Props for {@link AuthProvider}. */
export interface AuthProviderProps {
  /** The service implementation to use. Injected so tests can pass a fake. */
  readonly authService: AuthService;
  readonly children: ReactNode;
}

/**
 * Provides the authentication session to the tree.
 *
 * @param props - The service implementation and the subtree to render.
 * @returns The provider element.
 */
export function AuthProvider({ authService, children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Firebase restores the session asynchronously on load, so the tree waits for
  // the first callback before deciding whether to redirect to the login page.
  useEffect(() => {
    const unsubscribe = authService.observeSession((nextUser) => {
      setUser(nextUser);
      setIsInitialising(false);
      identifyUser(nextUser?.id ?? null);
    });

    return unsubscribe;
  }, [authService]);

  const signIn = useCallback(
    async (
      credentials: Credentials,
    ): Promise<Result<AuthenticatedUser, AppError>> => {
      setIsSigningIn(true);

      try {
        const result = await authService.signIn(credentials);

        if (result.ok) {
          trackEvent(ANALYTICS_EVENTS.loginSucceeded, {});
        } else {
          trackEvent(ANALYTICS_EVENTS.loginFailed, {
            reason: result.error.code,
          });
        }

        return result;
      } finally {
        setIsSigningIn(false);
      }
    },
    [authService],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await authService.signOut();
    setUser(null);
    identifyUser(null);
  }, [authService]);

  // Memoised so every consumer does not re-render whenever the provider does.
  const value = useMemo<AuthContextValue>(
    () => ({ user, isInitialising, isSigningIn, signIn, signOut }),
    [user, isInitialising, isSigningIn, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
