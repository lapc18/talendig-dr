/**
 * Destructive confirmation for deleting a class.
 *
 * The dialog names the class, its code, its date and its teacher, because the
 * action is irreversible and the admin list shows several similar rows.
 */

import { Button } from "@/shared/components/ui/Button";
import { Dialog } from "@/shared/components/ui/Dialog";
import { COPY } from "@/shared/i18n/copy";
import { formatLongDate } from "@/shared/utils/date";
import type { ClassRecord } from "../types";

/** Props for {@link DeleteClassDialog}. */
export interface DeleteClassDialogProps {
  /** The class awaiting confirmation, or `null` when the dialog is closed. */
  readonly record: ClassRecord | null;
  readonly isDeleting: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (record: ClassRecord) => void;
}

/**
 * Renders the delete confirmation.
 *
 * @param props - The target class, in-flight flag and the two handlers.
 * @returns The dialog element.
 */
export function DeleteClassDialog({
  record,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteClassDialogProps) {
  return (
    <Dialog
      isOpen={record !== null}
      onClose={onCancel}
      title={COPY.actions.deleteClass}
    >
      {record !== null && (
        <>
          <div
            aria-hidden="true"
            className="mb-4 flex size-11 items-center justify-center rounded-xl bg-danger-surface font-sans text-xl font-extrabold text-danger"
          >
            !
          </div>

          <h2 className="mb-2 font-sans text-xl leading-[1.3] font-extrabold tracking-[-0.02em] text-navy-900">
            ¿Eliminar “{record.name}”?
          </h2>

          <p className="mb-4 font-sans text-sm leading-[1.6] text-ink-600">
            Se eliminará el registro de la clase{" "}
            <span className="font-mono text-[13px] font-bold text-navy-900">
              {record.code}
            </span>{" "}
            del {formatLongDate(record.date)}, impartida por {record.teacher}.
            Esta acción no se puede deshacer y la clase dejará de aparecer en la
            consulta pública.
          </p>

          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
              {COPY.actions.cancel}
            </Button>
            <Button
              variant="dangerSolid"
              isLoading={isDeleting}
              loadingLabel={COPY.actions.deleting}
              onClick={() => {
                onConfirm(record);
              }}
            >
              {COPY.actions.deleteClass}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
