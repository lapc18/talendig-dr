/**
 * Route guard for the administrative screens.
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROUTES } from "./routes";

/** Props for {@link ProtectedRoute}. */
export interface ProtectedRouteProps {
  readonly children: ReactNode;
}

/**
 * Renders its children only for a signed-in teacher, redirecting to the login
 * screen otherwise.
 *
 * Firebase restores a session asynchronously, so the guard renders nothing
 * until the first session state arrives — redirecting during that window would
 * bounce an authenticated teacher out of a page they can actually see.
 *
 * This is a convenience, not the security boundary: Firestore rules are what
 * actually protect the data.
 *
 * @param props - The protected subtree.
 * @returns The children, a redirect, or a blank frame while initialising.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isInitialising } = useAuth();
  const location = useLocation();

  if (isInitialising) {
    return <div className="min-h-dvh bg-ink-50" aria-busy="true" />;
  }

  if (user === null) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return children;
}
