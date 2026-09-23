/**
 * Application root: configuration check, error boundary, providers and router.
 */

import { RouterProvider } from "react-router-dom";
import { missingEnvironmentKeys } from "@/config/env";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { ConfigurationErrorScreen } from "./ConfigurationErrorScreen";
import { AppProviders } from "./providers/AppProviders";
import { router } from "./router";

/**
 * Renders the application.
 *
 * @returns The root element.
 */
export function App() {
  // Checked before anything mounts: with variables missing, every Firebase
  // call would fail with an opaque SDK error, and the screens below would
  // report "no pudimos conectar" for a problem no reader can act on.
  if (missingEnvironmentKeys.length > 0) {
    return <ConfigurationErrorScreen missingKeys={missingEnvironmentKeys} />;
  }

  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}
