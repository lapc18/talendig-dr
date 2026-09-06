import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/app/routes";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { ClassRepositoryProvider } from "@/features/classes/context/ClassRepositoryProvider";
import { COPY } from "@/shared/i18n/copy";
import { createAppError } from "@/shared/lib/errors";
import { FakeAuthService, TEST_USER } from "@/test/doubles/fakeAuthService";
import {
  InMemoryClassRepository,
  buildClassRecord,
} from "@/test/doubles/inMemoryClassRepository";
import { ClassFormPage } from "./ClassFormPage";

const EXISTING = buildClassRecord({
  id: "a",
  code: "DEV-101",
  name: "Fundamentos de React",
  teacher: "Yokasta Reyes",
});

/**
 * Renders the form page at a route, with the admin list as the return target.
 *
 * @param route - The route to open.
 * @param repository - The repository backing the page.
 * @returns The render result.
 */
function renderFormPage(route: string, repository: InMemoryClassRepository) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider authService={new FakeAuthService({ initialUser: TEST_USER })}>
        <ClassRepositoryProvider repository={repository}>
          <Routes>
            <Route path={ROUTES.admin} element={<p>Listado de clases</p>} />
            <Route path={ROUTES.adminNewClass} element={<ClassFormPage />} />
            <Route path={ROUTES.adminEditClass} element={<ClassFormPage />} />
          </Routes>
        </ClassRepositoryProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

/**
 * Fills every required field with a valid value.
 *
 * @param user - The user-event session.
 */
async function fillValidClass(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Código de clase/), "QA-160");
  await user.type(screen.getByLabelText(/Nombre de la clase/), "Testing con Jest");
  await user.type(screen.getByLabelText(/Profesor/), "Ana Mercedes Fernández");
  await user.type(
    screen.getByLabelText(/Enlace de grabación/),
    "https://meet.talendig.do/rec/qa-160",
  );
}

describe("ClassFormPage — creating", () => {
  it("opens a blank form headed as a new class", async () => {
    renderFormPage(ROUTES.adminNewClass, new InMemoryClassRepository());

    expect(
      await screen.findByRole("heading", { name: COPY.form.createTitle }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Código de clase/)).toHaveValue("");
  });

  it("saves the class and returns to the list", async () => {
    const user = userEvent.setup();
    const repository = new InMemoryClassRepository();
    renderFormPage(ROUTES.adminNewClass, repository);
    await screen.findByRole("heading", { name: COPY.form.createTitle });

    await fillValidClass(user);
    await user.click(screen.getByRole("button", { name: COPY.actions.save }));

    await waitFor(() => {
      expect(screen.getByText("Listado de clases")).toBeInTheDocument();
    });
    expect(repository.calls.create[0].draft.code).toBe("QA-160");
    expect(repository.calls.create[0].author).toBe("yokasta.reyes");
  });

  it("stays on the form and reports the reason when the save fails", async () => {
    const user = userEvent.setup();
    renderFormPage(
      ROUTES.adminNewClass,
      new InMemoryClassRepository({
        failWith: createAppError("classes/permission-denied", "Sin permiso."),
      }),
    );
    await screen.findByRole("heading", { name: COPY.form.createTitle });

    await fillValidClass(user);
    await user.click(screen.getByRole("button", { name: COPY.actions.save }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso.");
    expect(screen.queryByText("Listado de clases")).not.toBeInTheDocument();
  });

  it("returns to the list without writing when cancelled", async () => {
    const user = userEvent.setup();
    const repository = new InMemoryClassRepository();
    renderFormPage(ROUTES.adminNewClass, repository);
    await screen.findByRole("heading", { name: COPY.form.createTitle });

    await user.click(screen.getByRole("button", { name: COPY.actions.cancel }));

    await waitFor(() => {
      expect(screen.getByText("Listado de clases")).toBeInTheDocument();
    });
    expect(repository.calls.create).toHaveLength(0);
  });

  it("offers no delete action for a class that does not exist yet", async () => {
    renderFormPage(ROUTES.adminNewClass, new InMemoryClassRepository());
    await screen.findByRole("heading", { name: COPY.form.createTitle });

    expect(
      screen.queryByRole("button", { name: COPY.actions.deleteClass }),
    ).not.toBeInTheDocument();
  });
});

describe("ClassFormPage — editing", () => {
  it("preloads the class being edited", async () => {
    renderFormPage(
      "/admin/clases/a",
      new InMemoryClassRepository({ records: [EXISTING] }),
    );

    expect(
      await screen.findByRole("heading", { name: COPY.form.editTitle }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre de la clase/)).toHaveValue(
        "Fundamentos de React",
      );
    });
  });

  it("saves the change and returns to the list", async () => {
    const user = userEvent.setup();
    const repository = new InMemoryClassRepository({ records: [EXISTING] });
    renderFormPage("/admin/clases/a", repository);
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre de la clase/)).toHaveValue(
        "Fundamentos de React",
      );
    });

    await user.clear(screen.getByLabelText(/Nombre de la clase/));
    await user.type(screen.getByLabelText(/Nombre de la clase/), "React desde cero");
    await user.click(
      screen.getByRole("button", { name: COPY.actions.saveChanges }),
    );

    await waitFor(() => {
      expect(screen.getByText("Listado de clases")).toBeInTheDocument();
    });
    expect(repository.calls.update[0]).toMatchObject({ id: "a" });
    expect(repository.records[0].name).toBe("React desde cero");
  });

  it("deletes the class from the form after confirmation", async () => {
    const user = userEvent.setup();
    const repository = new InMemoryClassRepository({ records: [EXISTING] });
    renderFormPage("/admin/clases/a", repository);
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre de la clase/)).toHaveValue(
        "Fundamentos de React",
      );
    });

    await user.click(
      screen.getByRole("button", { name: COPY.actions.deleteClass }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: COPY.actions.deleteClass,
    });
    await user.click(
      // The confirmation button inside the dialog, not the one on the form.
      (
        await within(dialog).findAllByRole("button", {
          name: COPY.actions.deleteClass,
        })
      )[0],
    );

    await waitFor(() => {
      expect(screen.getByText("Listado de clases")).toBeInTheDocument();
    });
    expect(repository.calls.remove).toEqual(["a"]);
  });

  it("reports a class that no longer exists instead of showing a blank form", async () => {
    renderFormPage("/admin/clases/desaparecida", new InMemoryClassRepository());

    expect(
      await screen.findByText(COPY.errors.classNotFound),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nombre de la clase/)).not.toBeInTheDocument();
  });
});
