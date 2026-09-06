/**
 * Talendig wordmark.
 *
 * The two official PNGs live in `public/brand/`. Brand rules from the style
 * tile: never stretch, never recolour, and never place the mark on teal — so
 * only these two variants exist and neither takes a colour override.
 */

import { cn } from "@/shared/utils/cn";

/** Which official asset to render. */
export type LogoVariant = "navy" | "white";

/** Public paths of the official assets. */
const LOGO_SOURCE: Readonly<Record<LogoVariant, string>> = {
  navy: "/brand/talendig-logo.png",
  white: "/brand/talendig-logo-white.png",
};

/** Intrinsic dimensions, declared so the browser reserves the right box. */
const INTRINSIC_WIDTH = 482;
const INTRINSIC_HEIGHT = 147;

/** Props for {@link Logo}. */
export interface LogoProps {
  /** `white` for navy surfaces, `navy` for light ones. */
  readonly variant?: LogoVariant;
  /** Rendered height in pixels. Width follows the intrinsic aspect ratio. */
  readonly height?: number;
  readonly className?: string;
}

/**
 * Renders the wordmark.
 *
 * @param props - Variant, height and optional classes.
 * @returns The logo image.
 */
export function Logo({ variant = "navy", height = 26, className }: LogoProps) {
  return (
    <img
      src={LOGO_SOURCE[variant]}
      alt="Talendig"
      width={INTRINSIC_WIDTH}
      height={INTRINSIC_HEIGHT}
      style={{ height, width: (height * INTRINSIC_WIDTH) / INTRINSIC_HEIGHT }}
      className={cn("block max-w-full object-contain", className)}
    />
  );
}
