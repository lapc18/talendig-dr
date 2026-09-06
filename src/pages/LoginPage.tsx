/**
 * Teacher sign-in.
 *
 * Signing in is the only way into the administrative screens; the public
 * consultation never requires it.
 */

import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ROUTES } from "@/app/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Logo } from "@/shared/components/layout/Logo";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { Field } from "@/shared/components/ui/Field";
import { Input } from "@/shared/components/ui/Input";
import { COPY } from "@/shared/i18n/copy";

/**
 * Renders the sign-in screen.
 *
 * @returns The page element.
 */
export function LoginPage() {
  const { user, isInitialising, isSigningIn, signIn } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // An already-authenticated teacher has no reason to see this screen.
  if (!isInitialising && user !== null) {
    return <Navigate to={ROUTES.admin} replace />;
  }

  /** Validates locally, then attempts the sign-in. */
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);

    if (username.trim() === "") {
      setErrorMessage(COPY.validation.usernameRequired);
      return;
    }
    if (password === "") {
      setErrorMessage(COPY.validation.passwordRequired);
      return;
    }

    const result = await signIn({ username, password });

    if (result.ok) {
      void navigate(ROUTES.admin, { replace: true });
      return;
    }

    setErrorMessage(result.error.userMessage);
    // Never keep a rejected password in memory or in the field.
    setPassword("");
  }

  const hasError = errorMessage !== null;

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-navy-900 p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 -left-36 size-[520px] rounded-full border border-teal-500/28"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -bottom-40 size-[340px] rounded-full border border-white/10"
      />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo variant="white" height={30} />
          <span className="font-sans text-xs font-semibold tracking-[0.1em] text-white/60 uppercase">
            {COPY.brand.productName}
          </span>
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            void submit(event);
          }}
          className="rounded-dialog bg-white p-8 shadow-auth"
        >
          <h1 className="mb-1 font-sans text-[22px] leading-[1.25] font-extrabold tracking-[-0.02em] text-navy-900">
            {COPY.auth.title}
          </h1>
          <p className="mb-5 font-sans text-[13.5px] leading-[1.5] text-ink-600">
            {COPY.auth.subtitle}
          </p>

          {hasError && <Alert className="mb-5">{errorMessage}</Alert>}

          <Field label={COPY.auth.username} isRequired className="mb-4">
            {(control) => (
              <Input
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                }}
                {...control}
                aria-invalid={hasError}
                aria-describedby={undefined}
              />
            )}
          </Field>

          <Field label={COPY.auth.password} isRequired className="mb-2.5">
            {(control) => (
              <div className="relative">
                <Input
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                  }}
                  className="pr-20"
                  {...control}
                  aria-invalid={hasError}
                  aria-describedby={undefined}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordVisible((visible) => !visible);
                  }}
                  className="absolute inset-y-0 right-3.5 cursor-pointer font-sans text-[12.5px] font-semibold text-teal-700"
                >
                  {isPasswordVisible ? COPY.actions.hide : COPY.actions.show}
                </button>
              </div>
            )}
          </Field>

          <p className="mb-5 text-right font-sans text-[12.5px] font-semibold text-ink-600">
            <span title={COPY.auth.forgotPasswordHelp}>
              {COPY.auth.forgotPassword}
            </span>
          </p>

          <Button
            type="submit"
            size="lg"
            isFullWidth
            isLoading={isSigningIn}
            loadingLabel={COPY.actions.signIn}
          >
            {COPY.actions.signIn}
          </Button>

          <p className="mt-4.5 text-center">
            <Link
              to={ROUTES.publicSearch}
              className="font-sans text-[12.5px] font-semibold text-ink-700"
            >
              {COPY.actions.backToPublic}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
