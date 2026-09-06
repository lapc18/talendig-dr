/**
 * Access to the authentication session.
 */

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "../context/authContext";

/**
 * Reads the authentication context.
 *
 * @returns The session, sign-in and sign-out surface.
 * @throws {Error} When called outside an `AuthProvider`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }

  return context;
}
