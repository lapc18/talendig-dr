/**
 * Search box with a leading magnifier icon.
 */

import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

/** Props for {@link SearchInput}. */
export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** `lg` is the hero search on the public page; `md` is the admin toolbar. */
  readonly size?: "md" | "lg";
  /** Accessible name, since the design shows no visible label. */
  readonly label: string;
}

/** Per-size classes for the wrapper and the icon. */
const SIZE_CLASSES = {
  md: { box: "h-[42px] gap-2.5 px-[14px]", text: "text-[13.5px]", icon: 14 },
  lg: { box: "h-[52px] gap-3 px-[18px]", text: "text-[15px]", icon: 16 },
} as const;

/**
 * Renders a search input.
 *
 * @param props - Standard input attributes plus size and accessible label.
 * @returns The search input element.
 */
export function SearchInput({
  size = "md",
  label,
  className,
  ...rest
}: SearchInputProps) {
  const sizing = SIZE_CLASSES[size];

  return (
    <div
      className={cn(
        "flex items-center rounded-control border border-ink-200 bg-white",
        "transition-shadow duration-150",
        "focus-within:border-teal-500 focus-within:shadow-[0_0_0_3px_rgb(39_165_178/0.18)]",
        sizing.box,
        className,
      )}
    >
      <Search
        size={sizing.icon}
        strokeWidth={2.5}
        aria-hidden="true"
        className="shrink-0 text-ink-600"
      />
      <input
        type="search"
        aria-label={label}
        className={cn(
          "w-full bg-transparent font-sans font-medium text-navy-900 outline-none",
          "placeholder:font-normal placeholder:text-ink-400",
          "[&::-webkit-search-cancel-button]:hidden",
          sizing.text,
        )}
        {...rest}
      />
    </div>
  );
}
