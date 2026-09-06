/**
 * Validation schemas for class input.
 *
 * The same schema validates the form (through the react-hook-form resolver) and
 * anything else that constructs a draft, so the rules exist in exactly one
 * place.
 */

import { z } from "zod";
import { COPY } from "@/shared/i18n/copy";
import { todayIsoDate } from "@/shared/utils/date";

/** Course codes read as `LETTERS-NUMBERS`, e.g. `DEV-101`. */
const CLASS_CODE_PATTERN = /^[A-Z]{2,6}-\d{2,4}$/;

/** Longest accepted class name. */
export const CLASS_NAME_MAX_LENGTH = 120;

/** Longest accepted comment. Mirrored by the form's character counter. */
export const CLASS_COMMENT_MAX_LENGTH = 600;

/**
 * Reports whether a string is an absolute `https` URL.
 *
 * `http` is rejected on purpose: recordings live behind authenticated services
 * and a plaintext link is a downgrade, not a convenience.
 *
 * @param value - The candidate URL.
 * @returns `true` when the value parses as an `https` URL.
 */
function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Schema for the class create/edit form. */
export const classDraftSchema = z.object({
  date: z
    .string()
    .min(1, COPY.validation.dateRequired)
    .refine((value) => value <= todayIsoDate(), COPY.validation.dateInFuture),

  code: z
    .string()
    .min(1, COPY.validation.codeRequired)
    // Teachers type `dev-101`; normalising before validating avoids rejecting
    // input that is correct in every way except capitalisation.
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => CLASS_CODE_PATTERN.test(value), COPY.validation.codeFormat),

  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, COPY.validation.nameRequired)
        .max(CLASS_NAME_MAX_LENGTH, COPY.validation.nameTooLong),
    ),

  teacher: z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1, COPY.validation.teacherRequired)),

  link: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, COPY.validation.linkRequired)
        .refine(isHttpsUrl, COPY.validation.linkFormat),
    ),

  comment: z
    .string()
    .max(CLASS_COMMENT_MAX_LENGTH, COPY.validation.commentTooLong)
    .transform((value) => value.trim())
    .default(""),
});

/** Form values before validation and transformation. */
export type ClassFormInput = z.input<typeof classDraftSchema>;

/** Validated, normalised class draft. */
export type ClassFormValues = z.output<typeof classDraftSchema>;
