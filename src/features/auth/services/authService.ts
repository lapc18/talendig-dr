/**
 * The authentication contract.
 *
 * The login page and the auth context depend on this interface rather than on
 * Firebase Auth, which keeps the sign-in flow testable with a fake.
 */

import type { AppError } from "@/shared/lib/errors";
import type { Result } from "@/shared/lib/result";
import type { AuthenticatedUser, Credentials } from "../types";

/** Sign-in, sign-out and session observation. */
export interface AuthService {
  /**
   * Signs a teacher in.
   *
   * @param credentials - Username and password from the login form.
   * @returns The authenticated user, or an `AppError` describing the failure.
   */
  signIn(credentials: Credentials): Promise<Result<AuthenticatedUser, AppError>>;

  /**
   * Signs the current teacher out.
   *
   * @returns Nothing on success, or an `AppError`.
   */
  signOut(): Promise<Result<void, AppError>>;

  /**
   * Subscribes to session changes, firing immediately with the current session.
   *
   * @param onChange - Called with the user, or `null` when signed out.
   * @returns An unsubscribe function.
   */
  observeSession(
    onChange: (user: AuthenticatedUser | null) => void,
  ): () => void;
}
