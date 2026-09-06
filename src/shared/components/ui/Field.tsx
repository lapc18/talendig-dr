/**
 * Form field wrapper: label, control, help text and error message.
 *
 * Compound-component style — the caller supplies the control as children, and
 * `Field` owns the label association and the `aria-describedby` wiring so no
 * screen-reader plumbing is repeated per form.
 */

import { useId, type ReactNode } from "react";
import { COPY } from "@/shared/i18n/copy";
import { cn } from "@/shared/utils/cn";

/** Render props handed to the control so it can wire up accessibility. */
export interface FieldControlProps {
  readonly id: string;
  readonly "aria-describedby": string | undefined;
  readonly "aria-invalid": boolean;
}

/** Props for {@link Field}. */
export interface FieldProps {
  readonly label: string;
  readonly isRequired?: boolean;
  /** Guidance shown under the control while the field is valid. */
  readonly helpText?: string;
  /** Validation message. Replaces the help text and marks the field invalid. */
  readonly errorMessage?: string;
  /** Trailing element on the help row, e.g. a character counter. */
  readonly trailing?: ReactNode;
  readonly className?: string;
  /** Receives the ids and validity flag the control must apply. */
  readonly children: (control: FieldControlProps) => ReactNode;
}

/**
 * Renders a labelled form field.
 *
 * @param props - Label, validation state and a render function for the control.
 * @returns The field element.
 */
export function Field({
  label,
  isRequired = false,
  helpText,
  errorMessage,
  trailing,
  className,
  children,
}: FieldProps) {
  const controlId = useId();
  const messageId = `${controlId}-message`;
  const hasError = errorMessage !== undefined;
  const message = errorMessage ?? helpText;

  return (
    <div className={className}>
      <label
        htmlFor={controlId}
        className="mb-[7px] block font-sans text-[12.5px] leading-none font-semibold text-navy-900"
      >
        {label}{" "}
        {isRequired ? (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="font-medium text-ink-600">{COPY.form.optional}</span>
        )}
      </label>

      {children({
        id: controlId,
        "aria-describedby": message === undefined ? undefined : messageId,
        "aria-invalid": hasError,
      })}

      {(message !== undefined || trailing !== undefined) && (
        <div className="mt-1.5 flex items-start justify-between gap-3">
          {message !== undefined ? (
            <span
              id={messageId}
              // Errors are announced; static help text is not.
              role={hasError ? "alert" : undefined}
              className={cn(
                "font-sans text-[11.5px] leading-[1.4]",
                hasError ? "font-semibold text-danger" : "text-ink-600",
              )}
            >
              {message}
            </span>
          ) : (
            <span />
          )}
          {trailing}
        </div>
      )}
    </div>
  );
}
