import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { COPY } from "@/shared/i18n/copy";
import type { ClassDraft } from "../types";
import { ClassForm } from "./ClassForm";

const EXISTING: ClassDraft = {
  date: "2026-08-28",
  code: "DEV-101",
  name: "Fundamentos de React",
  teacher: "Yokasta Reyes",
  link: "https://meet.talendig.do/rec/dev-101",
  comment: "Componentes y estado local.",
};

/**
 * Renders the form with sensible defaults.
 *
 * @param overrides - Props to override.
 * @returns The submit and cancel spies plus the render result.
 */
function renderForm(overrides: Partial<Parameters<typeof ClassForm>[0]> = {}) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  const result = render(
    <ClassForm
      knownTeachers={["Yokasta Reyes", "Wilfredo Batista"]}
      isSaving={false}
      submitLabel={COPY.actions.save}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...overrides}
    />,
  );

  return { onSubmit, onCancel, ...result };
}

describe("ClassForm", () => {
  it("submits a normalised draft, uppercasing the code and trimming text", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/Código de clase/), "dev-101");
    await user.type(
      screen.getByLabelText(/Nombre de la clase/),
      "  Fundamentos de React  ",
    );
    await user.type(screen.getByLabelText(/Profesor/), "Yokasta Reyes");
    await user.type(
      screen.getByLabelText(/Enlace de grabación/),
      "https://meet.talendig.do/rec/dev-101",
    );
    await user.click(screen.getByRole("button", { name: COPY.actions.save }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      code: "DEV-101",
      name: "Fundamentos de React",
      teacher: "Yokasta Reyes",
      link: "https://meet.talendig.do/rec/dev-101",
      comment: "",
    });
  });

  it("blocks the submit and names the invalid fields", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/Código de clase/), "dev101");
    await user.type(screen.getByLabelText(/Nombre de la clase/), "Una clase");
    await user.type(screen.getByLabelText(/Profesor/), "Yokasta Reyes");
    await user.type(screen.getByLabelText(/Enlace de grabación/), "meet.talendig");
    await user.click(screen.getByRole("button", { name: COPY.actions.save }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(/El enlace no tiene un formato válido/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Corrige 2 campos para poder guardar."),
    ).toBeInTheDocument();
  });

  it("disables saving until the invalid fields are corrected", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/Código de clase/), "dev101");
    await user.type(screen.getByLabelText(/Nombre de la clase/), "Una clase");
    await user.type(screen.getByLabelText(/Profesor/), "Yokasta Reyes");
    await user.type(
      screen.getByLabelText(/Enlace de grabación/),
      "https://meet.talendig.do/rec/x",
    );

    const save = screen.getByRole("button", { name: COPY.actions.save });
    await user.click(save);
    expect(save).toBeDisabled();

    await user.clear(screen.getByLabelText(/Código de clase/));
    await user.type(screen.getByLabelText(/Código de clase/), "DEV-101");

    expect(save).toBeEnabled();
    await user.click(save);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("marks the invalid controls for assistive technology", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Enlace de grabación/), "meet.talendig");
    await user.click(screen.getByRole("button", { name: COPY.actions.save }));

    expect(screen.getByLabelText(/Enlace de grabación/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("preloads existing values when editing", () => {
    renderForm({ initialValues: EXISTING, submitLabel: COPY.actions.saveChanges });

    expect(screen.getByLabelText(/Código de clase/)).toHaveValue("DEV-101");
    expect(screen.getByLabelText(/Nombre de la clase/)).toHaveValue(
      "Fundamentos de React",
    );
    expect(screen.getByLabelText(/Comentario/)).toHaveValue(
      "Componentes y estado local.",
    );
  });

  it("counts the comment against its limit as it is typed", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByText("0/600")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Comentario/), "Hola");

    expect(screen.getByText("4/600")).toBeInTheDocument();
  });

  it("offers the known teachers as suggestions without forcing the choice", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/Código de clase/), "NEW-100");
    await user.type(screen.getByLabelText(/Nombre de la clase/), "Clase nueva");
    await user.type(screen.getByLabelText(/Profesor/), "Profesora Nueva");
    await user.type(
      screen.getByLabelText(/Enlace de grabación/),
      "https://meet.talendig.do/rec/new",
    );
    await user.click(screen.getByRole("button", { name: COPY.actions.save }));

    expect(screen.getAllByRole("option", { hidden: true }).length).toBe(2);
    expect(onSubmit.mock.calls[0][0].teacher).toBe("Profesora Nueva");
  });

  it("shows the delete action only when one is provided", () => {
    const { unmount } = renderForm();
    expect(
      screen.queryByRole("button", { name: COPY.actions.deleteClass }),
    ).not.toBeInTheDocument();
    unmount();

    renderForm({ initialValues: EXISTING, onDelete: vi.fn() });
    expect(
      screen.getByRole("button", { name: COPY.actions.deleteClass }),
    ).toBeInTheDocument();
  });

  it("locks the actions while a save is in flight", () => {
    renderForm({ isSaving: true });

    expect(
      screen.getByRole("button", { name: COPY.actions.cancel }),
    ).toBeDisabled();
    expect(screen.getByText(COPY.actions.saving)).toBeInTheDocument();
  });
});
