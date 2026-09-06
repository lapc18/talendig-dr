import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createAppError } from "@/shared/lib/errors";
import { COPY } from "@/shared/i18n/copy";
import {
  InMemoryClassRepository,
  buildClassRecord,
} from "@/test/doubles/inMemoryClassRepository";
import { renderWithProviders } from "@/test/renderWithProviders";
import { PublicSearchPage } from "./PublicSearchPage";

const RECORDS = [
  buildClassRecord({ id: "a", date: "2026-08-28", code: "DEV-101", name: "Fundamentos de React", teacher: "Yokasta Reyes", comment: "Props y estado local." }),
  buildClassRecord({ id: "b", date: "2026-08-26", code: "PY-100", name: "Introducción a Python", teacher: "Wilfredo Batista", comment: "" }),
  buildClassRecord({ id: "c", date: "2026-08-21", code: "GIT-110", name: "Git y GitHub para equipos", teacher: "Yokasta Reyes", comment: "" }),
];

describe("PublicSearchPage", () => {
  it("lists the classes on record, newest first", async () => {
    renderWithProviders(<PublicSearchPage />, {
      repository: new InMemoryClassRepository({ records: RECORDS }),
    });

    expect(await screen.findByText("3 clases encontradas")).toBeInTheDocument();

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("Fundamentos de React")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Git y GitHub para equipos")).toBeInTheDocument();
  });

  it("uses the singular when exactly one class matches", async () => {
    renderWithProviders(<PublicSearchPage />, {
      repository: new InMemoryClassRepository({ records: [RECORDS[0]] }),
    });

    expect(await screen.findByText("1 clase encontrada")).toBeInTheDocument();
  });

  it("narrows the list as the reader types", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PublicSearchPage />, {
      repository: new InMemoryClassRepository({ records: RECORDS }),
    });
    await screen.findByText("3 clases encontradas");

    await user.type(
      screen.getByRole("searchbox", { name: COPY.publicSearch.searchPlaceholder }),
      "python",
    );

    expect(await screen.findByText("1 clase encontrada")).toBeInTheDocument();
    expect(screen.queryByText("Fundamentos de React")).not.toBeInTheDocument();
  });

  it("offers to clear the filters from the empty state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PublicSearchPage />, {
      repository: new InMemoryClassRepository({ records: RECORDS }),
    });
    await screen.findByText("3 clases encontradas");

    await user.selectOptions(
      screen.getByLabelText(COPY.publicSearch.teacher),
      "Wilfredo Batista",
    );
    await user.type(
      screen.getByRole("searchbox", { name: COPY.publicSearch.searchPlaceholder }),
      "figma",
    );

    expect(await screen.findByText(COPY.states.emptyTitle)).toBeInTheDocument();

    await user.click(
      within(screen.getByText(COPY.states.emptyTitle).parentElement!).getByRole(
        "button",
        { name: COPY.actions.clearFilters },
      ),
    );

    await waitFor(() => {
      expect(screen.getByText("3 clases encontradas")).toBeInTheDocument();
    });
  });

  it("shows a recoverable error when the read fails", async () => {
    renderWithProviders(<PublicSearchPage />, {
      repository: new InMemoryClassRepository({
        failWith: createAppError(
          "classes/unavailable",
          "El servicio de clases no responde.",
        ),
      }),
    });

    expect(await screen.findByText(COPY.states.errorTitle)).toBeInTheDocument();
    expect(
      screen.getByText("El servicio de clases no responde."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: COPY.actions.retry }),
    ).toBeInTheDocument();
  });

  it("opens the detail panel with the full comment", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PublicSearchPage />, {
      repository: new InMemoryClassRepository({ records: RECORDS }),
    });
    await screen.findByText("3 clases encontradas");

    await user.click(
      screen.getByRole("button", { name: "Fundamentos de React" }),
    );

    const panel = await screen.findByRole("dialog", {
      name: "Fundamentos de React",
    });
    expect(within(panel).getByText("28 de agosto de 2026")).toBeInTheDocument();
    expect(within(panel).getByText("Props y estado local.")).toBeInTheDocument();
  });

  it("says so plainly when a class has no comment", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PublicSearchPage />, {
      repository: new InMemoryClassRepository({ records: RECORDS }),
    });
    await screen.findByText("3 clases encontradas");

    await user.click(
      screen.getByRole("button", { name: "Introducción a Python" }),
    );

    const panel = await screen.findByRole("dialog", {
      name: "Introducción a Python",
    });
    expect(within(panel).getByText(COPY.detail.noComment)).toBeInTheDocument();
  });

  it("opens recordings in a new tab without handing over this window", async () => {
    renderWithProviders(<PublicSearchPage />, {
      repository: new InMemoryClassRepository({ records: [RECORDS[0]] }),
    });
    await screen.findByText("1 clase encontrada");

    // The table and the card list are both in the DOM — CSS decides which one
    // the viewport shows — so every route to the recording must be checked.
    const links = screen.getAllByRole("link", { name: /Ver grabación/ });
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
      expect(link).toHaveAttribute(
        "href",
        "https://meet.talendig.do/rec/dev-101",
      );
    }
  });

  it("shows a chip for an applied filter and clears it when dismissed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PublicSearchPage />, {
      repository: new InMemoryClassRepository({ records: RECORDS }),
    });
    await screen.findByText("3 clases encontradas");

    await user.selectOptions(
      screen.getByLabelText(COPY.publicSearch.classCode),
      "DEV-101",
    );

    const chip = await screen.findByRole("button", {
      name: /Quitar filtro DEV-101/,
    });
    expect(await screen.findByText("1 clase encontrada")).toBeInTheDocument();

    await user.click(chip);

    await waitFor(() => {
      expect(screen.getByText("3 clases encontradas")).toBeInTheDocument();
    });
  });
});
