/**
 * Fallback for unknown routes.
 */

import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes";
import { COPY } from "@/shared/i18n/copy";

/**
 * Renders the not-found screen.
 *
 * @returns The page element.
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-100 p-6">
      <div className="w-full max-w-md rounded-card bg-white p-8 text-center shadow-card">
        <h1 className="mb-2 font-sans text-h2 font-extrabold text-navy-900">
          {COPY.notFound.title}
        </h1>
        <p className="mb-6 font-sans text-sm leading-[1.6] text-ink-600">
          {COPY.notFound.body}
        </p>
        <Link
          to={ROUTES.publicSearch}
          className="inline-flex h-[46px] items-center rounded-control bg-navy-900 px-5 font-sans text-sm font-bold text-white no-underline transition-colors hover:bg-navy-700 hover:text-white hover:no-underline"
        >
          {COPY.notFound.action}
        </Link>
      </div>
    </div>
  );
}
