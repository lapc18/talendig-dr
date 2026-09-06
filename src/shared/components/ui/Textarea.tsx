/**
 * Multi-line text input.
 */

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";
import { CONTROL_CLASSES } from "./controlStyles";

/** Props for {@link Textarea}. */
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Renders a textarea sized to the design's 104px minimum.
 *
 * @param props - Standard textarea attributes.
 * @returns The textarea element.
 */
export function Textarea({ className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(
        CONTROL_CLASSES,
        "min-h-[104px] resize-y py-3.5 leading-[1.6]",
        className,
      )}
      {...rest}
    />
  );
}
