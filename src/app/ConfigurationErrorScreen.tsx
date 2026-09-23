/**
 * Shown when the build is missing environment variables.
 *
 * Reaching the first Firebase call with an incomplete configuration produces an
 * opaque SDK error, and letting the import throw produces a blank page. This is
 * what the reader sees instead.
 */

import { COPY } from "@/shared/i18n/copy";

/** Props for {@link ConfigurationErrorScreen}. */
export interface ConfigurationErrorScreenProps {
  /** The variables that were absent, listed for whoever runs the deploy. */
  readonly missingKeys: readonly string[];
}

/**
 * Renders the misconfiguration screen.
 *
 * @param props - The variables that were absent.
 * @returns The screen element.
 */
export function ConfigurationErrorScreen({
  missingKeys,
}: ConfigurationErrorScreenProps) {
  return (
    <div
      role="alert"
      className="flex min-h-dvh items-center justify-center bg-ink-100 p-6"
    >
      <div className="w-full max-w-md rounded-card bg-white p-8 text-center shadow-card">
        <h1 className="mb-2 font-sans text-h2 font-extrabold text-navy-900">
          {COPY.errors.misconfiguredTitle}
        </h1>
        <p className="mb-5 font-sans text-sm leading-[1.6] text-ink-600">
          {COPY.errors.misconfiguredBody}
        </p>

        {/* Names only, never values: this screen is public. */}
        <ul className="rounded-control bg-navy-50 p-4 text-left font-mono text-xs leading-[1.7] text-ink-700">
          {missingKeys.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
