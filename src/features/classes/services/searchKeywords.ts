/**
 * Search keyword generation.
 *
 * Firestore has no full-text search, so free-text lookup is served by an
 * indexed `keywords` array written alongside each class. Building it here keeps
 * the read query a single `array-contains` — server-side, indexed, and
 * unaffected by how many classes exist.
 */

import type { ClassDraft } from "../types";

/** Shortest prefix stored. Below this the term matches almost everything. */
const MIN_PREFIX_LENGTH = 3;

/** Longest prefix stored, which bounds the array size per document. */
const MAX_PREFIX_LENGTH = 12;

/**
 * Lowercases a string and strips diacritics so `Rosángela` matches `rosangela`.
 *
 * @param value - The raw string.
 * @returns The normalised string.
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Splits normalised text into word tokens, discarding punctuation.
 *
 * @param value - The text to tokenise.
 * @returns The distinct tokens found.
 */
function tokenize(value: string): string[] {
  return normalizeForSearch(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

/**
 * Expands a token into every prefix a user might have typed so far.
 *
 * @param token - A single normalised token.
 * @returns The token's prefixes, from `MIN_PREFIX_LENGTH` up to the token.
 */
function expandPrefixes(token: string): string[] {
  if (token.length < MIN_PREFIX_LENGTH) return [token];

  const longest = Math.min(token.length, MAX_PREFIX_LENGTH);
  const prefixes: string[] = [];

  for (let length = MIN_PREFIX_LENGTH; length <= longest; length += 1) {
    prefixes.push(token.slice(0, length));
  }

  return prefixes;
}

/**
 * Builds the searchable keyword set for a class.
 *
 * The class code is also stored without its hyphen so that `dev101` finds
 * `DEV-101`.
 *
 * @param draft - The class being written.
 * @returns Distinct keywords to store on the document.
 */
export function buildSearchKeywords(draft: ClassDraft): string[] {
  const sources = [draft.name, draft.teacher, draft.code, draft.code.replace("-", "")];
  const keywords = new Set<string>();

  for (const source of sources) {
    for (const token of tokenize(source)) {
      for (const prefix of expandPrefixes(token)) {
        keywords.add(prefix);
      }
    }
  }

  return [...keywords];
}

/**
 * Turns a user's search box input into the single keyword to match on.
 *
 * Firestore allows one `array-contains` per query, so the longest token wins:
 * it is the most selective, and remaining words are rare in practice for a
 * search over class names and teachers.
 *
 * @param searchTerm - Raw text typed by the user.
 * @returns The keyword to query, or `null` when the term carries no signal.
 */
export function toSearchKeyword(searchTerm: string): string | null {
  const tokens = tokenize(searchTerm);
  if (tokens.length === 0) return null;

  const longest = tokens.reduce((best, token) =>
    token.length > best.length ? token : best,
  );

  return longest.slice(0, MAX_PREFIX_LENGTH);
}
