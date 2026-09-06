/**
 * Single class lookup, used by the edit form when it is opened directly by URL.
 */

import { useEffect, useState } from "react";
import type { AppError } from "@/shared/lib/errors";
import { useClassRepository } from "../context/classRepositoryContext";
import type { ClassRecord } from "../types";

/** The outcome of one completed read, tagged with the id it answers. */
interface LoadedRecord {
  readonly classId: string;
  readonly record: ClassRecord | null;
  readonly error: AppError | null;
}

/** State of a single-class read. */
export interface ClassRecordState {
  readonly record: ClassRecord | null;
  readonly isLoading: boolean;
  readonly error: AppError | null;
}

/**
 * Loads one class by identifier.
 *
 * @param classId - The class to load, or `null` to skip the read entirely.
 * @returns The record and its loading and error state.
 */
export function useClassRecord(classId: string | null): ClassRecordState {
  const repository = useClassRepository();
  const [loaded, setLoaded] = useState<LoadedRecord | null>(null);

  useEffect(() => {
    if (classId === null) return;

    let isActive = true;

    void repository.findById(classId).then((result) => {
      if (!isActive) return;

      setLoaded({
        classId,
        record: result.ok ? result.value : null,
        error: result.ok ? null : result.error,
      });
    });

    return () => {
      isActive = false;
    };
  }, [repository, classId]);

  // Derived rather than stored: a result only counts once it answers the id
  // this render is asking about, which also covers navigating between classes.
  if (classId === null) {
    return { record: null, isLoading: false, error: null };
  }

  const isCurrent = loaded !== null && loaded.classId === classId;

  return {
    record: isCurrent ? loaded.record : null,
    isLoading: !isCurrent,
    error: isCurrent ? loaded.error : null,
  };
}
