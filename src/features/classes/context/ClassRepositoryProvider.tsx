/**
 * Provides a class repository implementation to the tree.
 */

import type { ReactNode } from "react";
import type { ClassRepository } from "../services/classRepository";
import { ClassRepositoryContext } from "./classRepositoryContext";

/** Props for {@link ClassRepositoryProvider}. */
export interface ClassRepositoryProviderProps {
  readonly repository: ClassRepository;
  readonly children: ReactNode;
}

/**
 * Makes `repository` available to every hook below it.
 *
 * @param props - The implementation and the subtree to render.
 * @returns The provider element.
 */
export function ClassRepositoryProvider({
  repository,
  children,
}: ClassRepositoryProviderProps) {
  // The repository is a stable singleton, so the context value never changes
  // identity and no memoisation is needed.
  return (
    <ClassRepositoryContext value={repository}>
      {children}
    </ClassRepositoryContext>
  );
}
