/**
 * Fallback for anything a route throws.
 *
 * `RouterProvider` catches errors raised while matching, loading or rendering a
 * route before they reach the surrounding `ErrorBoundary`, and without an
 * `errorElement` it renders its own developer-facing screen — stack trace and
 * all. This is that screen, redesigned and in Spanish.
 */

import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { ROUTES } from "@/app/routes";
import { Button } from "@/shared/components/ui/Button";
import { COPY } from "@/shared/i18n/copy";
import { logger } from "@/shared/lib/logger";
import { isChunkLoadError } from "@/shared/lib/moduleLoading";

/**
 * Describes a route error in the terms the reader needs.
 *
 * A missing page chunk is not a crash: the deployment moved under an open tab,
 * and reloading resolves it. Saying so is more useful than "algo se rompió".
 *
 * @param error - The value thrown by the route.
 * @returns The title and body to render.
 */
function describeRouteError(error: unknown): {
  readonly title: string;
  readonly body: string;
} {
  if (isChunkLoadError(error)) {
    return {
      title: COPY.errors.staleDeploymentTitle,
      body: COPY.errors.staleDeploymentBody,
    };
  }

  if (isRouteErrorResponse(error) && error.status === 404) {
    return { title: COPY.notFound.title, body: COPY.notFound.body };
  }

  return {
    title: COPY.errors.boundaryTitle,
    body: COPY.errors.boundaryBody,
  };
}

/**
 * Renders the route-level error screen.
 *
 * @returns The fallback element.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { title, body } = describeRouteError(error);

  logger.error("Route failed to render", error);

  return (
    <div
      role="alert"
      className="flex min-h-dvh items-center justify-center bg-ink-100 p-6"
    >
      <div className="w-full max-w-md rounded-card bg-white p-8 text-center shadow-card">
        <div
          aria-hidden="true"
          className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-danger-surface font-sans text-2xl font-extrabold text-danger"
        >
          !
        </div>

        <h1 className="mb-2 font-sans text-h2 font-extrabold text-navy-900">
          {title}
        </h1>
        <p className="mb-6 font-sans text-sm leading-[1.6] text-ink-600">
          {body}
        </p>

        <div className="flex flex-wrap justify-center gap-2.5">
          <Button
            onClick={() => {
              window.location.reload();
            }}
          >
            {COPY.errors.reload}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void navigate(ROUTES.publicSearch);
            }}
          >
            {COPY.errors.goHome}
          </Button>
        </div>
      </div>
    </div>
  );
}
