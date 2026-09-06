import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { FakeAuthService, TEST_USER } from "@/test/doubles/fakeAuthService";
import type { AuthService } from "@/features/auth/services/authService";
import { ProtectedRoute } from "./ProtectedRoute";
import { ROUTES } from "./routes";

/**
 * Renders a protected page at `/admin` with a login screen to redirect to.
 *
 * @param authService - The session implementation to inject.
 * @returns The Testing Library render result.
 */
function renderGuarded(authService: AuthService) {
  return render(
    <MemoryRouter initialEntries={[ROUTES.admin]}>
      <AuthProvider authService={authService}>
        <Routes>
          <Route path={ROUTES.login} element={<p>Pantalla de acceso</p>} />
          <Route
            path={ROUTES.admin}
            element={
              <ProtectedRoute>
                <p>Panel de administración</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows neither the page nor the login screen while the session resolves", () => {
    renderGuarded(new FakeAuthService({ initialUser: TEST_USER }));

    // Redirecting during this window would bounce an authenticated teacher out
    // of a page they can actually see.
    expect(screen.queryByText("Panel de administración")).not.toBeInTheDocument();
    expect(screen.queryByText("Pantalla de acceso")).not.toBeInTheDocument();
  });

  it("renders the page for a signed-in teacher", async () => {
    renderGuarded(new FakeAuthService({ initialUser: TEST_USER }));

    expect(
      await screen.findByText("Panel de administración"),
    ).toBeInTheDocument();
  });

  it("redirects to the login screen when there is no session", async () => {
    renderGuarded(new FakeAuthService());

    expect(await screen.findByText("Pantalla de acceso")).toBeInTheDocument();
    expect(screen.queryByText("Panel de administración")).not.toBeInTheDocument();
  });

  it("sends the teacher to the login screen after signing out", async () => {
    const service = new FakeAuthService({ initialUser: TEST_USER });
    renderGuarded(service);

    await screen.findByText("Panel de administración");
    await service.signOut();

    await waitFor(() => {
      expect(screen.getByText("Pantalla de acceso")).toBeInTheDocument();
    });
  });
});
