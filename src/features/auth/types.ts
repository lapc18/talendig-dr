/**
 * Authentication domain types.
 */

/** A signed-in teacher, as the application understands them. */
export interface AuthenticatedUser {
  /** Firebase Auth UID. Opaque, safe to send to analytics. */
  readonly id: string;
  /** Username typed at sign-in, e.g. `yokasta.reyes`. */
  readonly username: string;
  /** Display name shown in the admin header. */
  readonly displayName: string;
  /** Uppercase initials for the header avatar, e.g. `YR`. */
  readonly initials: string;
}

/** Credentials submitted by the login form. */
export interface Credentials {
  readonly username: string;
  readonly password: string;
}
