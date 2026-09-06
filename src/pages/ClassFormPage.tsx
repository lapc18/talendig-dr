/**
 * Class create and edit screen.
 *
 * The route decides the mode: with a `classId` parameter the form loads that
 * class and updates it, without one it creates a new class.
 */

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/app/routes";
import { ClassForm } from "@/features/classes/components/ClassForm";
import { DeleteClassDialog } from "@/features/classes/components/DeleteClassDialog";
import { useClassFacets } from "@/features/classes/hooks/useClassFacets";
import { useClassMutations } from "@/features/classes/hooks/useClassMutations";
import { useClassRecord } from "@/features/classes/hooks/useClassRecord";
import type { ClassDraft, ClassRecord } from "@/features/classes/types";
import { AdminHeader } from "@/shared/components/layout/AdminHeader";
import { Alert } from "@/shared/components/ui/Alert";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { COPY } from "@/shared/i18n/copy";
import { formatShortDate } from "@/shared/utils/date";

/**
 * Reduces a full record to the fields the form owns.
 *
 * @param record - The stored class.
 * @returns The editable subset.
 */
function toDraft(record: ClassRecord): ClassDraft {
  return {
    date: record.date,
    code: record.code,
    name: record.name,
    teacher: record.teacher,
    link: record.link,
    comment: record.comment,
  };
}

/**
 * Renders the class form screen in create or edit mode.
 *
 * @returns The page element.
 */
export function ClassFormPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const isEditing = classId !== undefined;
  const { record, isLoading, error } = useClassRecord(classId ?? null);
  const { teachers } = useClassFacets();
  const { isSaving, isDeleting, createClass, updateClass, deleteClass } =
    useClassMutations();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false);

  /** Returns to the list, which re-reads and therefore shows the change. */
  function returnToList(): void {
    void navigate(ROUTES.admin);
  }

  /** Creates or updates, depending on the mode. */
  async function save(draft: ClassDraft): Promise<void> {
    setSaveError(null);

    const result =
      isEditing && record !== null
        ? await updateClass(record.id, draft)
        : await createClass(draft);

    if (result.ok) {
      returnToList();
      return;
    }

    setSaveError(result.error.userMessage);
  }

  /** Deletes the class being edited. */
  async function confirmDeletion(target: ClassRecord): Promise<void> {
    setSaveError(null);
    const result = await deleteClass(target.id, target.code);

    if (result.ok) {
      returnToList();
      return;
    }

    setIsConfirmingDeletion(false);
    setSaveError(result.error.userMessage);
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <AdminHeader />

      <main className="mx-auto max-w-[760px] px-5 py-8">
        <div className="mb-5">
          <p className="mb-2 font-sans text-xs font-semibold text-ink-600">
            <Link to={ROUTES.admin}>{COPY.form.breadcrumbRoot}</Link>{" "}
            <span className="text-navy-900">
              /{" "}
              {isEditing ? COPY.form.breadcrumbEdit : COPY.form.breadcrumbNew}
            </span>
          </p>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-sans text-h2 text-navy-900">
              {isEditing ? COPY.form.editTitle : COPY.form.createTitle}
            </h1>

            {record !== null && (
              <p className="font-sans text-xs leading-[1.4] font-medium text-ink-600">
                Creada el {formatShortDate(record.date)} · editada por{" "}
                {record.updatedBy === "" ? "—" : record.updatedBy}
              </p>
            )}
          </div>
        </div>

        {saveError !== null && <Alert className="mb-4">{saveError}</Alert>}

        {isEditing && isLoading && (
          <div className="rounded-card bg-white p-8">
            <Skeleton className="mb-4 h-[46px] w-full" />
            <Skeleton className="mb-4 h-[46px] w-full" />
            <Skeleton className="mb-4 h-[46px] w-2/3" />
            <Skeleton className="h-[104px] w-full" />
          </div>
        )}

        {isEditing && error !== null && (
          <ErrorState
            title={error.userMessage}
            body={COPY.states.errorBody}
            onRetry={returnToList}
            retryLabel={COPY.form.breadcrumbRoot}
          />
        )}

        {(!isEditing || record !== null) && (
          <ClassForm
            initialValues={record === null ? undefined : toDraft(record)}
            knownTeachers={teachers}
            isSaving={isSaving}
            submitLabel={
              isEditing ? COPY.actions.saveChanges : COPY.actions.save
            }
            onSubmit={(draft) => {
              void save(draft);
            }}
            onCancel={returnToList}
            onDelete={
              record === null
                ? undefined
                : () => {
                    setIsConfirmingDeletion(true);
                  }
            }
          />
        )}
      </main>

      <DeleteClassDialog
        record={isConfirmingDeletion ? record : null}
        isDeleting={isDeleting}
        onCancel={() => {
          setIsConfirmingDeletion(false);
        }}
        onConfirm={(target) => {
          void confirmDeletion(target);
        }}
      />
    </div>
  );
}
