/**
 * Render helpers that wrap a subject in the providers it depends on.
 */

import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { ClassRepositoryProvider } from "@/features/classes/context/ClassRepositoryProvider";
import type { AuthService } from "@/features/auth/services/authService";
import type { ClassRepository } from "@/features/classes/services/classRepository";
import { FakeAuthService } from "./doubles/fakeAuthService";
import { InMemoryClassRepository } from "./doubles/inMemoryClassRepository";

/** Options for {@link renderWithProviders} and {@link createWrapper}. */
export interface ProviderOptions {
  readonly repository?: ClassRepository;
  readonly authService?: AuthService;
  /** Initial history entry, for subjects that read the route. */
  readonly route?: string;
}

/**
 * Builds a wrapper component supplying the router, session and repository.
 *
 * @param options - Implementations to inject and the initial route.
 * @returns A wrapper suitable for `render` or `renderHook`.
 */
export function createWrapper({
  repository = new InMemoryClassRepository(),
  authService = new FakeAuthService(),
  route = "/",
}: ProviderOptions = {}) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider authService={authService}>
          <ClassRepositoryProvider repository={repository}>
            {children}
          </ClassRepositoryProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };
}

/**
 * Renders a subject inside the application's providers.
 *
 * @param ui - The element under test.
 * @param options - Implementations to inject and the initial route.
 * @returns The Testing Library render result.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions = {},
): RenderResult {
  return render(ui, { wrapper: createWrapper(options) });
}
