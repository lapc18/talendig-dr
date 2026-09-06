/**
 * Value debouncing.
 */

import { useEffect, useState } from "react";

/**
 * Returns a copy of `value` that only updates once it has stopped changing for
 * `delayMs`. Used to keep every keystroke in the search box from becoming a
 * Firestore read.
 *
 * @param value - The value to debounce.
 * @param delayMs - Quiet period before the value is published.
 * @returns The debounced value.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
