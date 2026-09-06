/**
 * Lazily loaded page components.
 *
 * Each page is its own chunk, so a student opening the public consultation
 * never downloads the administration bundle. Every import goes through
 * `importWithDeploymentRecovery`, because a chunk requested against a previous
 * deployment is gone from the server and only a reload can fix it.
 */

import { lazy } from "react";
import { importWithDeploymentRecovery } from "@/shared/lib/moduleLoading";

/** Public class consultation. */
export const PublicSearchPage = lazy(() =>
  importWithDeploymentRecovery(async () => ({
    default: (await import("@/pages/PublicSearchPage")).PublicSearchPage,
  })),
);

/** Teacher sign-in. */
export const LoginPage = lazy(() =>
  importWithDeploymentRecovery(async () => ({
    default: (await import("@/pages/LoginPage")).LoginPage,
  })),
);

/** Administrative class list. */
export const AdminDashboardPage = lazy(() =>
  importWithDeploymentRecovery(async () => ({
    default: (await import("@/pages/AdminDashboardPage")).AdminDashboardPage,
  })),
);

/** Class create and edit form. */
export const ClassFormPage = lazy(() =>
  importWithDeploymentRecovery(async () => ({
    default: (await import("@/pages/ClassFormPage")).ClassFormPage,
  })),
);

/** Unknown-route fallback. */
export const NotFoundPage = lazy(() =>
  importWithDeploymentRecovery(async () => ({
    default: (await import("@/pages/NotFoundPage")).NotFoundPage,
  })),
);
