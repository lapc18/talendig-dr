/**
 * Firebase implementation of `AuthService`.
 *
 * Firebase Auth has no username provider, only email/password. Teachers sign in
 * with a bare username, so the service appends a configured, non-routable domain
 * to build the credential: `yokasta.reyes` becomes
 * `yokasta.reyes@classes.talendig.local`. Accounts are provisioned by an
 * administrator in the Firebase console — there is no public sign-up — and the
 * domain never has to resolve or receive mail.
 */

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { env } from "@/config/env";
import { firebaseAuth } from "@/config/firebase";
import { toAuthError } from "@/shared/lib/errors";
import { logger } from "@/shared/lib/logger";
import { fail, succeed, type Result } from "@/shared/lib/result";
import type { AppError } from "@/shared/lib/errors";
import type { AuthenticatedUser, Credentials } from "../types";
import type { AuthService } from "./authService";

/**
 * Builds the Firebase Auth email for a username.
 *
 * @param username - The username typed at sign-in.
 * @returns The synthetic email address for that account.
 */
function toAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${env.authUsernameDomain}`;
}

/**
 * Recovers the username from a Firebase account's synthetic email.
 *
 * @param email - The account email, which may be absent.
 * @returns The username, or an empty string when it cannot be derived.
 */
function toUsername(email: string | null): string {
  return email?.split("@")[0] ?? "";
}

/**
 * Derives a readable display name from a username, e.g. `yokasta.reyes`
 * becomes `Yokasta Reyes`. Firebase's `displayName` wins when an administrator
 * has set one.
 *
 * @param user - The Firebase user.
 * @returns The name to show in the interface.
 */
function toDisplayName(user: User): string {
  if (user.displayName !== null && user.displayName.trim() !== "") {
    return user.displayName;
  }

  return toUsername(user.email)
    .split(/[._-]+/)
    .filter((part) => part !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Builds the two-letter avatar initials for a display name.
 *
 * @param displayName - The teacher's display name.
 * @returns Up to two uppercase initials.
 */
function toInitials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter((part) => part !== "")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Maps a Firebase user onto the domain model.
 *
 * @param user - The Firebase user.
 * @returns The authenticated user.
 */
function toAuthenticatedUser(user: User): AuthenticatedUser {
  const displayName = toDisplayName(user);

  return {
    id: user.uid,
    username: toUsername(user.email),
    displayName,
    initials: toInitials(displayName),
  };
}

/** Firebase-backed authentication service. */
export class FirebaseAuthService implements AuthService {
  /** @inheritdoc */
  async signIn(
    credentials: Credentials,
  ): Promise<Result<AuthenticatedUser, AppError>> {
    try {
      const { user } = await signInWithEmailAndPassword(
        firebaseAuth,
        toAuthEmail(credentials.username),
        credentials.password,
      );

      return succeed(toAuthenticatedUser(user));
    } catch (error) {
      // Logged without the username so credentials never reach the console.
      logger.warn("Sign-in attempt failed");
      return fail(toAuthError(error));
    }
  }

  /** @inheritdoc */
  async signOut(): Promise<Result<void, AppError>> {
    try {
      await firebaseSignOut(firebaseAuth);
      return succeed(undefined);
    } catch (error) {
      logger.error("Sign-out failed", error);
      return fail(toAuthError(error));
    }
  }

  /** @inheritdoc */
  observeSession(
    onChange: (user: AuthenticatedUser | null) => void,
  ): () => void {
    return onAuthStateChanged(firebaseAuth, (user) => {
      onChange(user === null ? null : toAuthenticatedUser(user));
    });
  }
}
