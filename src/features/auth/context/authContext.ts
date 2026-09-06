/**
 * Authentication context definition.
 *
 * Kept apart from the provider component so that consuming a session never
 * pulls the provider's implementation into a module graph that does not need
 * it.
 */

import { createContext } from "react";
import type { AppError } from "@/shared/lib/errors";
import type { Result } from "@/shared/lib/result";
import type { AuthenticatedUser, Credentials } from "../types";

/** Everything the authentication context exposes. */
export interface AuthContextValue {
  /** The signed-in teacher, or `null` when signed out. */
  readonly user: AuthenticatedUser | null;
  /** `true` until the first session state has been resolved. */
  readonly isInitialising: boolean;
  /** `true` while a sign-in request is in flight. */
  readonly isSigningIn: boolean;
  signIn(credentials: Credentials): Promise<Result<AuthenticatedUser, AppError>>;
  signOut(): Promise<void>;
}

/** The auth context. Consumed through `useAuth`. */
export const AuthContext = createContext<AuthContextValue | null>(null);
