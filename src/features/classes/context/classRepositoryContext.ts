/**
 * Repository injection point.
 *
 * Hooks read the repository from here instead of importing the Firestore
 * adapter, so a test can render a subtree against an in-memory implementation
 * without module mocking.
 */

import { createContext, useContext } from "react";
import type { ClassRepository } from "../services/classRepository";

/** The repository context. Provided by `ClassRepositoryProvider`. */
export const ClassRepositoryContext = createContext<ClassRepository | null>(
  null,
);

/**
 * Reads the injected class repository.
 *
 * @returns The repository implementation for this subtree.
 * @throws {Error} When called outside a `ClassRepositoryProvider`.
 */
export function useClassRepository(): ClassRepository {
  const repository = useContext(ClassRepositoryContext);

  if (repository === null) {
    throw new Error(
      "useClassRepository must be used inside a <ClassRepositoryProvider>.",
    );
  }

  return repository;
}
