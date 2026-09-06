/**
 * Lazily loaded page components.
 *
 * Each page is its own chunk, so a student opening the public consultation
 * never downloads the administration bundle.
 */

import { lazy } from "react";

/** Public class consultation. */
export const PublicSearchPage = lazy(async () => ({
  default: (await import("@/pages/PublicSearchPage")).PublicSearchPage,
}));

/** Teacher sign-in. */
export const LoginPage = lazy(async () => ({
  default: (await import("@/pages/LoginPage")).LoginPage,
}));

/** Administrative class list. */
export const AdminDashboardPage = lazy(async () => ({
  default: (await import("@/pages/AdminDashboardPage")).AdminDashboardPage,
}));

/** Class create and edit form. */
export const ClassFormPage = lazy(async () => ({
  default: (await import("@/pages/ClassFormPage")).ClassFormPage,
}));

/** Unknown-route fallback. */
export const NotFoundPage = lazy(async () => ({
  default: (await import("@/pages/NotFoundPage")).NotFoundPage,
}));
