/**
 * Single-line text input.
 */

import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";
import { CONTROL_CLASSES } from "./controlStyles";

/** Props for {@link Input}. */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Renders the value in the monospaced face, for codes and URLs. */
  readonly isMonospaced?: boolean;
}

/**
 * Renders a text input.
 *
 * @param props - Standard input attributes plus the monospace flag.
 * @returns The input element.
 */
export function Input({ isMonospaced = false, className, ...rest }: InputProps) {
  return (
    <input
      className={cn(
        CONTROL_CLASSES,
        "h-[46px]",
        isMonospaced && "font-mono font-semibold",
        className,
      )}
      {...rest}
    />
  );
}
