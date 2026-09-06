import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { COPY } from "@/shared/i18n/copy";
import { buildClassRecord } from "@/test/doubles/inMemoryClassRepository";
import { DeleteClassDialog } from "./DeleteClassDialog";

const RECORD = buildClassRecord({
  name: "Fundamentos de React",
  code: "DEV-101",
  date: "2026-08-28",
  teacher: "Yokasta Reyes",
});

/**
 * Renders the dialog with sensible defaults.
 *
 * @param overrides - Props to override.
 * @returns The handler spies plus the render result.
 */
function renderDialog(
  overrides: Partial<Parameters<typeof DeleteClassDialog>[0]> = {},
) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();

  const result = render(
    <DeleteClassDialog
      record={RECORD}
      isDeleting={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );

  return { onCancel, onConfirm, ...result };
}

describe("DeleteClassDialog", () => {
  it("renders no content while closed", () => {
    renderDialog({ record: null });

    expect(
      screen.queryByText(/¿Eliminar “Fundamentos de React”\?/),
    ).not.toBeInTheDocument();
  });

  it("names the class, its code, its date and its teacher", () => {
    renderDialog();

    expect(
      screen.getByText("¿Eliminar “Fundamentos de React”?"),
    ).toBeInTheDocument();
    expect(screen.getByText("DEV-101")).toBeInTheDocument();
    expect(
      screen.getByText(/28 de agosto de 2026, impartida por Yokasta Reyes/),
    ).toBeInTheDocument();
  });

  it("warns that the action cannot be undone", () => {
    renderDialog();

    expect(
      screen.getByText(/Esta acción no se puede deshacer/),
    ).toBeInTheDocument();
  });

  it("hands the record back on confirmation", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();

    await user.click(
      screen.getByRole("button", { name: COPY.actions.deleteClass }),
    );

    expect(onConfirm).toHaveBeenCalledWith(RECORD);
  });

  it("cancels without deleting", async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = renderDialog();

    await user.click(screen.getByRole("button", { name: COPY.actions.cancel }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancels on Escape, so the dialog is never a trap", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();

    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("blocks both actions while the delete is in flight", () => {
    renderDialog({ isDeleting: true });

    expect(
      screen.getByRole("button", { name: COPY.actions.cancel }),
    ).toBeDisabled();
    expect(screen.getByText(COPY.actions.deleting)).toBeInTheDocument();
  });
});
