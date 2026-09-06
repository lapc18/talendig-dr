/**
 * In-memory `AuthService`, substitutable for the Firebase one.
 */

import { createAppError, type AppError } from "@/shared/lib/errors";
import { COPY } from "@/shared/i18n/copy";
import { fail, succeed, type Result } from "@/shared/lib/result";
import type { AuthService } from "@/features/auth/services/authService";
import type { AuthenticatedUser, Credentials } from "@/features/auth/types";

/** A teacher used across the auth tests. */
export const TEST_USER: AuthenticatedUser = {
  id: "uid-yokasta",
  username: "yokasta.reyes",
  displayName: "Yokasta Reyes",
  initials: "YR",
};

/** Options for {@link FakeAuthService}. */
export interface FakeAuthServiceOptions {
  /** Session the service reports on subscribe. Defaults to signed out. */
  readonly initialUser?: AuthenticatedUser | null;
  /** The single credential pair that succeeds. */
  readonly validPassword?: string;
}

/** An auth service backed by a single in-memory account. */
export class FakeAuthService implements AuthService {
  #user: AuthenticatedUser | null;
  readonly #validPassword: string;
  #listener: ((user: AuthenticatedUser | null) => void) | null = null;

  constructor({
    initialUser = null,
    validPassword = "correcta",
  }: FakeAuthServiceOptions = {}) {
    this.#user = initialUser;
    this.#validPassword = validPassword;
  }

  /** @inheritdoc */
  signIn(
    credentials: Credentials,
  ): Promise<Result<AuthenticatedUser, AppError>> {
    if (credentials.password !== this.#validPassword) {
      return Promise.resolve(
        fail(
          createAppError(
            "auth/invalid-credentials",
            COPY.errors.invalidCredentials,
          ),
        ),
      );
    }

    this.#user = { ...TEST_USER, username: credentials.username };
    this.#listener?.(this.#user);

    return Promise.resolve(succeed(this.#user));
  }

  /** @inheritdoc */
  signOut(): Promise<Result<void, AppError>> {
    this.#user = null;
    this.#listener?.(null);
    return Promise.resolve(succeed(undefined));
  }

  /** @inheritdoc */
  observeSession(
    onChange: (user: AuthenticatedUser | null) => void,
  ): () => void {
    this.#listener = onChange;
    // Firebase reports the restored session asynchronously; matching that here
    // is what makes the provider's `isInitialising` window testable.
    queueMicrotask(() => {
      onChange(this.#user);
    });

    return () => {
      this.#listener = null;
    };
  }
}
