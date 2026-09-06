/**
 * Create, update and delete operations for classes.
 *
 * Wraps the repository's write side with the in-flight flags the forms and the
 * delete dialog need, and emits the analytics event for each successful change.
 */

import { useCallback, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ANALYTICS_EVENTS, trackEvent } from "@/shared/lib/analytics";
import { createAppError, type AppError } from "@/shared/lib/errors";
import { COPY } from "@/shared/i18n/copy";
import { fail, type Failure, type Result } from "@/shared/lib/result";
import { useClassRepository } from "../context/classRepositoryContext";
import type { ClassDraft } from "../types";

/** Everything {@link useClassMutations} exposes. */
export interface ClassMutations {
  /** `true` while a create or update is in flight. */
  readonly isSaving: boolean;
  /** `true` while a delete is in flight. */
  readonly isDeleting: boolean;

  createClass(draft: ClassDraft): Promise<Result<string, AppError>>;
  updateClass(id: string, draft: ClassDraft): Promise<Result<void, AppError>>;
  deleteClass(id: string, classCode: string): Promise<Result<void, AppError>>;
}

/**
 * Provides the class write operations.
 *
 * @returns The mutation functions and their in-flight flags.
 */
export function useClassMutations(): ClassMutations {
  const repository = useClassRepository();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Rejects a write attempted without a session. Firestore rules enforce this
   * too; failing here just turns a server rejection into an immediate message.
   */
  const requireSession = useCallback((): Failure<AppError> | null => {
    if (user !== null) return null;
    return fail(
      createAppError("classes/permission-denied", COPY.errors.permissionDenied),
    );
  }, [user]);

  const createClass = useCallback(
    async (draft: ClassDraft): Promise<Result<string, AppError>> => {
      const rejection = requireSession();
      if (rejection !== null) return rejection;

      setIsSaving(true);
      try {
        const result = await repository.create(draft, user?.username ?? "");
        if (result.ok) {
          trackEvent(ANALYTICS_EVENTS.classCreated, { class_code: draft.code });
        }
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [repository, requireSession, user],
  );

  const updateClass = useCallback(
    async (id: string, draft: ClassDraft): Promise<Result<void, AppError>> => {
      const rejection = requireSession();
      if (rejection !== null) return rejection;

      setIsSaving(true);
      try {
        const result = await repository.update(id, draft, user?.username ?? "");
        if (result.ok) {
          trackEvent(ANALYTICS_EVENTS.classUpdated, { class_code: draft.code });
        }
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    [repository, requireSession, user],
  );

  const deleteClass = useCallback(
    async (id: string, classCode: string): Promise<Result<void, AppError>> => {
      const rejection = requireSession();
      if (rejection !== null) return rejection;

      setIsDeleting(true);
      try {
        const result = await repository.remove(id);
        if (result.ok) {
          trackEvent(ANALYTICS_EVENTS.classDeleted, { class_code: classCode });
        }
        return result;
      } finally {
        setIsDeleting(false);
      }
    },
    [repository, requireSession],
  );

  return { isSaving, isDeleting, createClass, updateClass, deleteClass };
}
