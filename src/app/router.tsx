/**
 * Route table.
 */

import { Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import {
  AdminDashboardPage,
  ClassFormPage,
  LoginPage,
  NotFoundPage,
  PublicSearchPage,
} from "./lazyPages";
import { ProtectedRoute } from "./ProtectedRoute";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { ROUTES } from "./routes";

/**
 * Wraps a lazily loaded page in a suspense boundary.
 *
 * The fallback is a plain tinted frame rather than a spinner: chunks resolve in
 * milliseconds on a warm cache, and a flashing spinner reads as a glitch.
 *
 * @param page - The page element to render once its chunk has loaded.
 * @returns The suspended page.
 */
function withSuspense(page: ReactNode): ReactNode {
  return (
    <Suspense
      fallback={<div className="min-h-dvh bg-ink-100" aria-busy="true" />}
    >
      {page}
    </Suspense>
  );
}

/** The application router. */
export const router = createBrowserRouter([
  {
    // A pathless parent exists only to give every route below it the same
    // error screen; without one, RouterProvider renders its own.
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: ROUTES.publicSearch, element: withSuspense(<PublicSearchPage />) },
      { path: ROUTES.login, element: withSuspense(<LoginPage />) },
      {
        path: ROUTES.admin,
        element: withSuspense(
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: ROUTES.adminNewClass,
        element: withSuspense(
          <ProtectedRoute>
            <ClassFormPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: ROUTES.adminEditClass,
        element: withSuspense(
          <ProtectedRoute>
            <ClassFormPage />
          </ProtectedRoute>,
        ),
      },
      { path: "*", element: withSuspense(<NotFoundPage />) },
    ],
  },
]);
