/**
 * Error state with a retry affordance.
 *
 * Every async surface in the application renders this when a read fails, so a
 * failure is always recoverable without a page reload.
 */

import { COPY } from "@/shared/i18n/copy";
import { Button } from "./Button";

/** Props for {@link ErrorState}. */
export interface ErrorStateProps {
  readonly title?: string;
  readonly body?: string;
  /**
   * Technical detail shown in the tinted footer, e.g.
   * `Error 503 · El servicio de clases no responde.` Safe to show: it comes
   * from our own error model, never from a raw SDK message.
   */
  readonly detail?: string;
  readonly onRetry: () => void;
  /** `true` while the retry request is in flight. */
  readonly isRetrying?: boolean;
  /**
   * Label for the recovery button. Override it when the action is not a retry —
   * a button that says "Reintentar" but navigates away is a lie.
   */
  readonly retryLabel?: string;
}

/**
 * Renders a recoverable error.
 *
 * @param props - Copy overrides, detail line and the retry handler.
 * @returns The error state element.
 */
export function ErrorState({
  title = COPY.states.errorTitle,
  body = COPY.states.errorBody,
  detail,
  onRetry,
  isRetrying = false,
  retryLabel = COPY.actions.retry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-card border border-navy-900/10 bg-white px-10 py-14 text-center"
    >
      <div
        aria-hidden="true"
        className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-danger-surface font-sans text-2xl font-extrabold text-danger"
      >
        !
      </div>
      <h3 className="mb-2 font-sans text-h3 font-extrabold text-navy-900">
        {title}
      </h3>
      <p className="mx-auto mb-[22px] max-w-sm font-sans text-sm leading-[1.6] text-ink-600">
        {body}
      </p>

      <div className="flex justify-center gap-2.5">
        <Button onClick={onRetry} isLoading={isRetrying}>
          {retryLabel}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            window.location.assign(`mailto:${COPY.support.email}`);
          }}
        >
          {COPY.actions.contactSupport}
        </Button>
      </div>

      {detail !== undefined && (
        <p className="mt-5 rounded-[10px] border border-danger-border bg-danger-surface px-3.5 py-3 text-left font-sans text-[12.5px] leading-[1.5] font-medium text-danger-strong">
          {detail}
        </p>
      )}
    </div>
  );
}
