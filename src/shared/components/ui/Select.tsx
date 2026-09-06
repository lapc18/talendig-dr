/**
 * Dropdown select.
 *
 * A native `<select>` on purpose: it is keyboard accessible, works with mobile
 * pickers, and needs no library. The chevron is drawn with a background image
 * so the control keeps a single box and no overlay intercepts clicks.
 */

import type { SelectHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";
import { CONTROL_CLASSES } from "./controlStyles";

/** One option in a {@link Select}. */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/** Props for {@link Select}. */
export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  readonly options: readonly SelectOption[];
  /** Label for the empty value, e.g. `Todos los profesores`. */
  readonly placeholderLabel?: string;
}

/** Inline chevron, matching the `▾` glyph used across the design. */
const CHEVRON_BACKGROUND =
  "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22><path d=%22M1 1l4 4 4-4%22 fill=%22none%22 stroke=%22%23A8AEBF%22 stroke-width=%221.5%22 stroke-linecap=%22round%22/></svg>')] bg-[length:10px_6px] bg-[position:right_14px_center] bg-no-repeat";

/**
 * Renders a select control.
 *
 * @param props - Standard select attributes plus the option list.
 * @returns The select element.
 */
export function Select({
  options,
  placeholderLabel,
  className,
  ...rest
}: SelectProps) {
  return (
    <select
      className={cn(
        CONTROL_CLASSES,
        CHEVRON_BACKGROUND,
        "h-[46px] cursor-pointer appearance-none pr-9 font-medium",
        className,
      )}
      {...rest}
    >
      {placeholderLabel !== undefined && <option value="">{placeholderLabel}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
