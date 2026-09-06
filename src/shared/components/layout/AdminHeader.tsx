/**
 * Navy header for the authenticated administration screens.
 */

import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { COPY } from "@/shared/i18n/copy";
import { Logo } from "./Logo";

/**
 * Renders the admin header with the signed-in teacher and a sign-out control.
 *
 * @returns The header element.
 */
export function AdminHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-navy-900">
      <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link
          to={ROUTES.admin}
          className="flex items-center gap-3.5 no-underline hover:no-underline"
        >
          <Logo variant="white" height={22} />
          <span aria-hidden="true" className="hidden h-5 w-px bg-white/22 sm:block" />
          <span className="hidden font-sans text-[12.5px] leading-none font-semibold text-white/72 sm:block">
            {COPY.brand.publicSubtitle}
          </span>
        </Link>

        <div className="flex items-center gap-3.5">
          {user !== null && (
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-[30px] items-center justify-center rounded-full bg-teal-500 font-sans text-[11.5px] leading-none font-extrabold text-navy-950"
              >
                {user.initials}
              </span>
              <span className="hidden font-sans text-[13px] leading-none font-semibold text-white sm:block">
                {user.displayName}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              void signOut();
            }}
            className="h-9 cursor-pointer rounded-[9px] border border-white/28 px-3.5 font-sans text-[12.5px] leading-none font-semibold text-white transition-colors hover:border-teal-500 hover:bg-teal-500/16"
          >
            {COPY.actions.signOut}
          </button>
        </div>
      </div>
    </header>
  );
}
