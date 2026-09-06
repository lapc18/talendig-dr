/**
 * Create and edit form for a class.
 *
 * One component serves both modes: the only differences are the initial values,
 * the submit label and whether the delete action is offered, all of which are
 * props. Validation is owned by `classDraftSchema`, so the form never restates
 * a rule.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/shared/components/ui/Button";
import { Field } from "@/shared/components/ui/Field";
import { Input } from "@/shared/components/ui/Input";
import { Textarea } from "@/shared/components/ui/Textarea";
import { COPY } from "@/shared/i18n/copy";
import { cn } from "@/shared/utils/cn";
import { CONTROL_CLASSES } from "@/shared/components/ui/controlStyles";
import { todayIsoDate } from "@/shared/utils/date";
import {
  CLASS_COMMENT_MAX_LENGTH,
  classDraftSchema,
  type ClassFormInput,
  type ClassFormValues,
} from "../schemas/classSchema";
import type { ClassDraft } from "../types";

/** Values a blank form starts from. */
const BLANK_DRAFT: ClassFormInput = {
  date: todayIsoDate(),
  code: "",
  name: "",
  teacher: "",
  link: "",
  comment: "",
};

/** Props for {@link ClassForm}. */
export interface ClassFormProps {
  /** Existing values when editing; omitted when creating. */
  readonly initialValues?: ClassDraft;
  /** Teachers already on record, offered as autocomplete suggestions. */
  readonly knownTeachers: readonly string[];
  readonly isSaving: boolean;
  readonly submitLabel: string;
  readonly onSubmit: (draft: ClassDraft) => void;
  readonly onCancel: () => void;
  /** Rendered on the left of the footer when editing. */
  readonly onDelete?: () => void;
}

/**
 * Renders the class form.
 *
 * @param props - Initial values, teacher suggestions and the action handlers.
 * @returns The form element.
 */
export function ClassForm({
  initialValues,
  knownTeachers,
  isSaving,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: ClassFormProps) {
  const teacherListId = useId();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitted },
  } = useForm<ClassFormInput, unknown, ClassFormValues>({
    resolver: zodResolver(classDraftSchema),
    defaultValues: initialValues ?? BLANK_DRAFT,
    // Re-validating on change after the first attempt lets an error clear as
    // soon as it is fixed, instead of only on the next submit.
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // `useWatch` rather than `watch`: it subscribes only this counter to the
  // comment field, so typing a comment does not re-render the whole form.
  const comment = useWatch({ control, name: "comment" });
  const commentLength = comment?.length ?? 0;
  const errorCount = Object.keys(errors).length;

  // The design greys out Save once a submit has failed, so the footer hint and
  // the button agree: there is nothing to save until the fields are corrected.
  const isBlockedByErrors = isSubmitted && errorCount > 0;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit((values) => {
          onSubmit(values);
        })(event);
      }}
      className="overflow-hidden rounded-card border border-navy-900/10 bg-white shadow-card"
    >
      <div className="flex flex-col gap-5 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Field
            label={COPY.form.date}
            isRequired
            helpText={COPY.form.dateHelp}
            errorMessage={errors.date?.message}
            className="flex-1"
          >
            {(control) => (
              <Input type="date" max={todayIsoDate()} {...control} {...register("date")} />
            )}
          </Field>

          <Field
            label={COPY.form.code}
            isRequired
            helpText={COPY.form.codeHelp}
            errorMessage={errors.code?.message}
            className="flex-1"
          >
            {(control) => (
              <Input
                isMonospaced
                placeholder="DEV-101"
                autoComplete="off"
                {...control}
                {...register("code")}
              />
            )}
          </Field>
        </div>

        <Field
          label={COPY.form.name}
          isRequired
          helpText={COPY.form.nameHelp}
          errorMessage={errors.name?.message}
        >
          {(control) => (
            <Input
              placeholder="Fundamentos de React"
              autoComplete="off"
              {...control}
              {...register("name")}
            />
          )}
        </Field>

        <Field
          label={COPY.form.teacher}
          isRequired
          errorMessage={errors.teacher?.message}
        >
          {(control) => (
            <>
              {/*
                A datalist rather than a select: the design shows a dropdown,
                but a fixed list would make the first class impossible to
                create and every new teacher a code change.
              */}
              <input
                list={teacherListId}
                autoComplete="off"
                placeholder="Yokasta Reyes"
                className={cn(CONTROL_CLASSES, "h-[46px] font-medium")}
                {...control}
                {...register("teacher")}
              />
              <datalist id={teacherListId}>
                {knownTeachers.map((teacher) => (
                  <option key={teacher} value={teacher} />
                ))}
              </datalist>
            </>
          )}
        </Field>

        <Field
          label={COPY.form.link}
          isRequired
          errorMessage={errors.link?.message}
        >
          {(control) => (
            <Input
              type="url"
              inputMode="url"
              placeholder="https://meet.talendig.do/rec/dev-101"
              autoComplete="off"
              className="font-mono text-[13.5px]"
              {...control}
              {...register("link")}
            />
          )}
        </Field>

        <Field
          label={COPY.form.comment}
          helpText={COPY.form.commentHelp}
          errorMessage={errors.comment?.message}
          trailing={
            <span className="shrink-0 font-mono text-[11.5px] leading-[1.4] font-medium text-ink-400">
              {commentLength}/{CLASS_COMMENT_MAX_LENGTH}
            </span>
          }
        >
          {(control) => (
            <Textarea
              maxLength={CLASS_COMMENT_MAX_LENGTH}
              placeholder={COPY.form.commentPlaceholder}
              {...control}
              {...register("comment")}
            />
          )}
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50 px-6 py-5 sm:px-8">
        {onDelete === undefined ? (
          <span
            className="font-sans text-[12.5px] leading-[1.4] font-semibold text-danger"
            role={isBlockedByErrors ? "alert" : undefined}
          >
            {isBlockedByErrors
              ? `Corrige ${errorCount} ${errorCount === 1 ? "campo" : "campos"} para poder guardar.`
              : ""}
          </span>
        ) : (
          <Button variant="danger" onClick={onDelete} disabled={isSaving}>
            {COPY.actions.deleteClass}
          </Button>
        )}

        <div className="flex gap-2.5">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            {COPY.actions.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isBlockedByErrors}
            isLoading={isSaving}
            loadingLabel={COPY.actions.saving}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
