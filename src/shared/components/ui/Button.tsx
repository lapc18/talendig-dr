/**
 * The application button.
 *
 * Variants and sizes come straight from the style tile (artboard 1j), including
 * every hover, active, disabled and loading treatment. New button styling is
 * added as a variant here rather than as one-off classes at a call site.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Spinner } from "./Spinner";

/** Visual weight of a button. */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "dangerSolid"
  | "ghost";

/** Control height. */
export type ButtonSize = "sm" | "md" | "lg";

/** Per-variant classes, including interaction states. */
const VARIANT_CLASSES: Readonly<Record<ButtonVariant, string>> = {
  primary: cn(
    "bg-navy-900 text-white",
    "hover:not-disabled:bg-navy-700",
    "active:not-disabled:bg-navy-950 active:not-disabled:shadow-[inset_0_2px_4px_rgb(0_0_0/0.3)]",
    "disabled:bg-navy-200 disabled:text-white",
  ),
  secondary: cn(
    "bg-teal-50 text-teal-800 border border-teal-200",
    "hover:not-disabled:bg-teal-100 hover:not-disabled:border-teal-300",
    "active:not-disabled:bg-teal-200 active:not-disabled:border-teal-400",
    "disabled:bg-ink-50 disabled:text-ink-400 disabled:border-ink-100",
  ),
  outline: cn(
    "bg-white text-navy-900 border border-ink-200",
    "hover:not-disabled:border-teal-500 hover:not-disabled:text-teal-800",
    "disabled:bg-ink-50 disabled:text-ink-400 disabled:border-ink-100",
  ),
  danger: cn(
    "bg-white text-danger border border-danger-border",
    "hover:not-disabled:bg-danger-surface hover:not-disabled:border-danger-border-strong",
    "active:not-disabled:bg-danger active:not-disabled:text-white",
    "disabled:bg-ink-50 disabled:text-ink-400 disabled:border-ink-100",
  ),
  dangerSolid: cn(
    "bg-danger text-white",
    "hover:not-disabled:bg-danger-strong",
    "disabled:bg-navy-200",
  ),
  ghost: cn(
    "bg-transparent text-white border border-white/28",
    "hover:not-disabled:border-teal-500 hover:not-disabled:bg-teal-500/16",
  ),
};

/** Per-size classes. */
const SIZE_CLASSES: Readonly<Record<ButtonSize, string>> = {
  sm: "h-[38px] px-[14px] text-[12.5px]",
  md: "h-[46px] px-5 text-[14px]",
  lg: "h-[50px] px-6 text-[14.5px]",
};

/** Spinner ring colours per variant, so the ring reads on its background. */
const SPINNER_CLASSES: Readonly<Record<ButtonVariant, string>> = {
  primary: "border-white/40 border-t-teal-300",
  secondary: "border-teal-200 border-t-teal-700",
  outline: "border-ink-200 border-t-navy-900",
  danger: "border-danger-border border-t-danger",
  dangerSolid: "border-white/40 border-t-white",
  ghost: "border-white/40 border-t-white",
};

/** Props for {@link Button}. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Shows a spinner and blocks interaction while an action is in flight. */
  readonly isLoading?: boolean;
  /** Replaces the label while loading, e.g. `Guardando`. */
  readonly loadingLabel?: string;
  /** Stretches the button to the width of its container. */
  readonly isFullWidth?: boolean;
  readonly children: ReactNode;
}

/**
 * Renders a button.
 *
 * @param props - Standard button attributes plus variant, size and loading state.
 * @returns The button element.
 */
export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingLabel,
  isFullWidth = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled === true || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-bold",
        "font-sans whitespace-nowrap transition-colors duration-150",
        "cursor-pointer disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        isFullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <>
          <Spinner className={SPINNER_CLASSES[variant]} />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
