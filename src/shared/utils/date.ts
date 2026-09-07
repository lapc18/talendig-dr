/**
 * Date helpers.
 *
 * Class dates are calendar days, not instants: a class taught on 28 August is
 * the 28th regardless of the reader's timezone. They are therefore stored and
 * passed around as `yyyy-MM-dd` strings and only converted to `Date` for
 * formatting, using local time so the day never shifts.
 */

import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";

/** A calendar day in `yyyy-MM-dd` form. */
export type IsoDate = string;

/** Storage format for calendar days. */
const ISO_DATE_FORMAT = "yyyy-MM-dd";

/**
 * Parses an `IsoDate` into a local-time `Date` at midnight.
 *
 * @param isoDate - Calendar day in `yyyy-MM-dd` form.
 * @returns The parsed date, or `null` when the input is not a valid day.
 */
export function parseIsoDate(isoDate: IsoDate): Date | null {
  const parsed = parse(isoDate, ISO_DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

/**
 * Formats a calendar day as a compact Spanish date, e.g. `28 ago 2026`.
 *
 * @param isoDate - Calendar day in `yyyy-MM-dd` form.
 * @returns The formatted date, or the raw input when it cannot be parsed.
 */
export function formatShortDate(isoDate: IsoDate): string {
  const parsed = parseIsoDate(isoDate);
  if (parsed === null) return isoDate;
  return format(parsed, "dd MMM yyyy", { locale: es });
}

/**
 * Formats a calendar day in full Spanish prose, e.g.
 * `28 de agosto de 2026`.
 *
 * @param isoDate - Calendar day in `yyyy-MM-dd` form.
 * @returns The formatted date, or the raw input when it cannot be parsed.
 */
export function formatLongDate(isoDate: IsoDate): string {
  const parsed = parseIsoDate(isoDate);
  if (parsed === null) return isoDate;
  return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Returns today as an `IsoDate` in the viewer's local timezone.
 *
 * @returns Today's calendar day.
 */
export function todayIsoDate(): IsoDate {
  return format(new Date(), ISO_DATE_FORMAT);
}

/** Formatter for the Dominican time of day, e.g. `9:15 a. m.` */
const TIME_FORMATTER = new Intl.DateTimeFormat("es-DO", {
  hour: "numeric",
  minute: "2-digit",
});

/**
 * Formats a timestamp as a Spanish time of day, e.g. `9:15 a. m.`
 *
 * `Intl` rather than date-fns here: date-fns renders the day period as `PM` or
 * `p.m.` even under the Spanish locale, and the design writes `p. m.`
 *
 * @param date - The instant to format.
 * @returns The formatted time.
 */
export function formatTimeOfDay(date: Date): string {
  return TIME_FORMATTER.format(date);
}

/**
 * Formats an instant as a Spanish date and time, e.g. `06 sep 2026, 8:15 p. m.`
 *
 * Unlike {@link formatShortDate}, which takes a calendar day, this takes a real
 * timestamp — a record's `createdAt` or `updatedAt`.
 *
 * @param date - The instant to format.
 * @returns The formatted date and time.
 */
export function formatDateTime(date: Date): string {
  return `${format(date, "dd MMM yyyy", { locale: es })}, ${TIME_FORMATTER.format(date)}`;
}
