/**
 * Translation layer between Firestore documents and the domain model.
 *
 * This is the only place that knows the document shape or handles `Timestamp`,
 * so no `Timestamp` ever reaches a hook or a component. Reads are parsed
 * defensively: a malformed document is reported rather than silently rendered
 * as `undefined`.
 */

import {
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { z } from "zod";
import type { ClassRecord } from "../types";

/** Firestore collection holding class records. */
export const CLASSES_COLLECTION = "classes";

/**
 * Shape of a stored class document.
 *
 * `keywords` is a write-side search index and is deliberately absent from
 * `ClassRecord`: the interface never needs it.
 */
const classDocumentSchema = z.object({
  date: z.string(),
  code: z.string(),
  name: z.string(),
  teacher: z.string(),
  link: z.string(),
  comment: z.string().default(""),
  keywords: z.array(z.string()).default([]),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
  updatedBy: z.string().default(""),
});

/** A validated class document as stored in Firestore. */
export type ClassDocument = z.infer<typeof classDocumentSchema>;

/**
 * Converts a Firestore snapshot into a domain record.
 *
 * @param snapshot - The document snapshot to convert.
 * @returns The domain record.
 * @throws {z.ZodError} When the document does not match the expected shape.
 */
export function toClassRecord(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): ClassRecord {
  const document = classDocumentSchema.parse(snapshot.data());

  return {
    id: snapshot.id,
    date: document.date,
    code: document.code,
    name: document.name,
    teacher: document.teacher,
    link: document.link,
    comment: document.comment,
    createdAt: document.createdAt.toDate(),
    updatedAt: document.updatedAt.toDate(),
    updatedBy: document.updatedBy,
  };
}
