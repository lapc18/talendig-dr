/**
 * Filter dropdown options.
 *
 * The teacher and class-code lists are read once per mount and shared by both
 * the public and admin filters. A failure here is non-fatal: the dropdowns fall
 * back to empty and search still works.
 */

import { useEffect, useState } from "react";
import { logger } from "@/shared/lib/logger";
import { useClassRepository } from "../context/classRepositoryContext";

/** The option lists backing the filter dropdowns. */
export interface ClassFacets {
  readonly teachers: readonly string[];
  readonly codes: readonly string[];
  readonly isLoading: boolean;
}

/**
 * Loads the distinct teachers and class codes on record.
 *
 * @returns The option lists and their loading state.
 */
export function useClassFacets(): ClassFacets {
  const repository = useClassRepository();
  const [teachers, setTeachers] = useState<readonly string[]>([]);
  const [codes, setCodes] = useState<readonly string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    void Promise.all([
      repository.listTeachers(),
      repository.listCodes(),
    ]).then(([teacherResult, codeResult]) => {
      if (!isActive) return;

      if (teacherResult.ok) {
        setTeachers(teacherResult.value);
      } else {
        logger.warn("Teacher filter options unavailable", {
          code: teacherResult.error.code,
        });
      }

      if (codeResult.ok) {
        setCodes(codeResult.value);
      } else {
        logger.warn("Class code filter options unavailable", {
          code: codeResult.error.code,
        });
      }

      setIsLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [repository]);

  return { teachers, codes, isLoading };
}
