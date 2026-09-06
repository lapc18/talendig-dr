/**
 * Route paths.
 *
 * Every `Link`, redirect and navigation reads from here, so a URL change never
 * has to be chased through the codebase as a string literal.
 */

/** Application route paths. */
export const ROUTES = {
  /** Public consultation, open to students and teachers. */
  publicSearch: "/",
  /** Teacher sign-in. */
  login: "/acceso",
  /** Administrative class list. Requires a session. */
  admin: "/admin",
  /** Class creation form. Requires a session. */
  adminNewClass: "/admin/clases/nueva",
  /** Class edit form. Requires a session. */
  adminEditClass: "/admin/clases/:classId",
} as const;

/**
 * Builds the edit route for a class.
 *
 * @param classId - The class identifier.
 * @returns The concrete path.
 */
export function buildEditClassPath(classId: string): string {
  return ROUTES.adminEditClass.replace(":classId", classId);
}
