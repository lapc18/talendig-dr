import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { COPY } from "@/shared/i18n/copy";
import { createAppError } from "@/shared/lib/errors";
import { FakeAuthService, TEST_USER } from "@/test/doubles/fakeAuthService";
import {
  InMemoryClassRepository,
  buildClassRecord,
} from "@/test/doubles/inMemoryClassRepository";
import { renderWithProviders } from "@/test/renderWithProviders";
import { AdminDashboardPage } from "./AdminDashboardPage";

const RECORDS = [
  buildClassRecord({ id: "a", date: "2026-08-28", code: "DEV-101", name: "Fundamentos de React", teacher: "Yokasta Reyes" }),
  buildClassRecord({ id: "b", date: "2026-08-26", code: "PY-100", name: "Introducción a Python", teacher: "Wilfredo Batista" }),
];

/**
 * Renders the dashboard with a signed-in teacher.
 *
 * @param repository - The repository backing the list.
 * @returns The render result.
 */
function renderDashboard(repository: InMemoryClassRepository) {
  return renderWithProviders(<AdminDashboardPage />, {
    repository,
    authService: new FakeAuthService({ initialUser: TEST_USER }),
  });
}

describe("AdminDashboardPage", () => {
  it("lists the registered classes with their count", async () => {
    renderDashboard(new InMemoryClassRepository({ records: RECORDS }));

    expect(await screen.findByText(/2 clases ·/)).toBeInTheDocument();
    expect(screen.getAllByText("Fundamentos de React").length).toBeGreaterThan(0);
  });

  it("uses the singular for a single class", async () => {
    renderDashboard(new InMemoryClassRepository({ records: [RECORDS[0]] }));

    expect(await screen.findByText(/1 clase ·/)).toBeInTheDocument();
  });

  it("links each row to its edit form", async () => {
    renderDashboard(new InMemoryClassRepository({ records: RECORDS }));
    await screen.findByText(/2 clases ·/);

    const editLinks = screen.getAllByRole("link", { name: COPY.actions.edit });
    expect(editLinks[0]).toHaveAttribute("href", "/admin/clases/a");
  });

  it("offers a route to the creation form", async () => {
    renderDashboard(new InMemoryClassRepository({ records: RECORDS }));
    await screen.findByText(/2 clases ·/);

    expect(
      screen.getByRole("link", { name: COPY.actions.newClass }),
    ).toHaveAttribute("href", "/admin/clases/nueva");
  });

  it("asks for confirmation before deleting and names the class", async () => {
    const user = userEvent.setup();
    const repository = new InMemoryClassRepository({ records: RECORDS });
    renderDashboard(repository);
    await screen.findByText(/2 clases ·/);

    await user.click(screen.getAllByRole("button", { name: COPY.actions.delete })[0]);

    const dialog = await screen.findByRole("dialog", {
      name: COPY.actions.deleteClass,
    });
    expect(
      within(dialog).getByText("¿Eliminar “Fundamentos de React”?"),
    ).toBeInTheDocument();
    expect(repository.calls.remove).toHaveLength(0);
  });

  it("deletes the class and refreshes the list on confirmation", async () => {
    const user = userEvent.setup();
    const repository = new InMemoryClassRepository({ records: RECORDS });
    renderDashboard(repository);
    await screen.findByText(/2 clases ·/);

    await user.click(screen.getAllByRole("button", { name: COPY.actions.delete })[0]);
    const dialog = await screen.findByRole("dialog", {
      name: COPY.actions.deleteClass,
    });
    await user.click(
      within(dialog).getByRole("button", { name: COPY.actions.deleteClass }),
    );

    expect(repository.calls.remove).toEqual(["a"]);
    await waitFor(() => {
      expect(screen.getByText(/1 clase ·/)).toBeInTheDocument();
    });
  });

  it("leaves the class alone when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const repository = new InMemoryClassRepository({ records: RECORDS });
    renderDashboard(repository);
    await screen.findByText(/2 clases ·/);

    await user.click(screen.getAllByRole("button", { name: COPY.actions.delete })[0]);
    const dialog = await screen.findByRole("dialog", {
      name: COPY.actions.deleteClass,
    });
    await user.click(
      within(dialog).getByRole("button", { name: COPY.actions.cancel }),
    );

    expect(repository.calls.remove).toHaveLength(0);
    expect(repository.records).toHaveLength(2);
  });

  it("filters the list by teacher", async () => {
    const user = userEvent.setup();
    renderDashboard(new InMemoryClassRepository({ records: RECORDS }));
    await screen.findByText(/2 clases ·/);

    await user.selectOptions(
      screen.getByLabelText(COPY.publicSearch.teacher),
      "Wilfredo Batista",
    );

    expect(await screen.findByText(/1 clase ·/)).toBeInTheDocument();
  });

  it("shows a recoverable error when the list cannot be read", async () => {
    renderDashboard(
      new InMemoryClassRepository({
        failWith: createAppError("classes/unavailable", "sin servicio"),
      }),
    );

    expect(await screen.findByText(COPY.states.errorTitle)).toBeInTheDocument();
  });

  it("shows the signed-in teacher and a way out", async () => {
    renderDashboard(new InMemoryClassRepository({ records: RECORDS }));

    // Scoped to the header: the same name also appears in the rows below.
    const header = screen.getByRole("banner");
    expect(await within(header).findByText("Yokasta Reyes")).toBeInTheDocument();
    expect(
      within(header).getByRole("button", { name: COPY.actions.signOut }),
    ).toBeInTheDocument();
  });
});
