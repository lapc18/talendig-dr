/**
 * A minimal Result type for expected failures.
 *
 * Repositories and services return `Result` instead of throwing, so the type
 * system forces callers to handle the failure path. Genuinely exceptional
 * situations (programmer error, corrupt state) still throw and are caught by
 * the error boundary.
 */

/** A successful outcome carrying a value. */
export interface Success<T> {
  readonly ok: true;
  readonly value: T;
}

/** A failed outcome carrying an error. */
export interface Failure<E> {
  readonly ok: false;
  readonly error: E;
}

/** Either a `Success<T>` or a `Failure<E>`. */
export type Result<T, E> = Success<T> | Failure<E>;

/**
 * Wraps a value in a successful result.
 *
 * @param value - The value to wrap.
 * @returns A `Success` carrying `value`.
 */
export function succeed<T>(value: T): Success<T> {
  return { ok: true, value };
}

/**
 * Wraps an error in a failed result.
 *
 * @param error - The error to wrap.
 * @returns A `Failure` carrying `error`.
 */
export function fail<E>(error: E): Failure<E> {
  return { ok: false, error };
}
