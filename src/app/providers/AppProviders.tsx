/**
 * Composition root.
 *
 * The concrete Firebase implementations are constructed here and injected into
 * the tree. Everything below depends on the `AuthService` and
 * `ClassRepository` interfaces, so this file is the only place that has to
 * change to run the application against a different backend or a test double.
 */

import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { FirebaseAuthService } from "@/features/auth/services/firebaseAuthService";
import { ClassRepositoryProvider } from "@/features/classes/context/ClassRepositoryProvider";
import { FirestoreClassRepository } from "@/features/classes/services/firestoreClassRepository";
import type { AuthService } from "@/features/auth/services/authService";
import type { ClassRepository } from "@/features/classes/services/classRepository";

/** The application's authentication service. */
const authService: AuthService = new FirebaseAuthService();

/** The application's class repository. */
const classRepository: ClassRepository = new FirestoreClassRepository();

/** Props for {@link AppProviders}. */
export interface AppProvidersProps {
  readonly children: ReactNode;
}

/**
 * Wraps the tree in the application's providers.
 *
 * @param props - The subtree to render.
 * @returns The provider tree.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider authService={authService}>
      <ClassRepositoryProvider repository={classRepository}>
        {children}
      </ClassRepositoryProvider>
    </AuthProvider>
  );
}
