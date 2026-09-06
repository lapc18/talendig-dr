/**
 * Navy header for the public consultation screens.
 */

import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes";
import { COPY } from "@/shared/i18n/copy";
import { Logo } from "./Logo";

/**
 * Renders the public header with the teacher sign-in link.
 *
 * @returns The header element.
 */
export function PublicHeader() {
  return (
    <header className="bg-navy-900">
      <div className="mx-auto flex min-h-[68px] max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-10">
        <Link
          to={ROUTES.publicSearch}
          className="flex items-center gap-3.5 no-underline hover:no-underline"
        >
          <Logo variant="white" height={24} />
          {/* The product label is the first thing to go on a narrow header:
              the wordmark alone already identifies the site. */}
          <span
            aria-hidden="true"
            className="hidden h-[22px] w-px bg-white/22 sm:block"
          />
          <span className="hidden font-sans text-[13px] leading-none font-semibold text-white/72 sm:block">
            {COPY.brand.productName}
          </span>
        </Link>

        <Link
          to={ROUTES.login}
          className="rounded-[10px] border border-white/28 px-4 py-2.5 font-sans text-[13px] leading-none font-semibold text-white no-underline transition-colors hover:border-teal-500 hover:bg-teal-500/16 hover:text-white hover:no-underline"
        >
          {COPY.actions.teacherAccess}
        </Link>
      </div>
    </header>
  );
}
