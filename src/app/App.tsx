/**
 * Application root: error boundary, providers and router.
 */

import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { AppProviders } from "./providers/AppProviders";
import { router } from "./router";

/**
 * Renders the application.
 *
 * @returns The root element.
 */
export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}
