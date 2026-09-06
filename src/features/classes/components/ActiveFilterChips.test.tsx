import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_CLASS_FILTERS, type ClassFilters } from "../types";
import { ActiveFilterChips } from "./ActiveFilterChips";

/**
 * Renders the chip row for a filter set.
 *
 * @param filters - Filters to override on the empty baseline.
 * @returns The change spy plus the render result.
 */
function renderChips(filters: Partial<ClassFilters> = {}) {
  const onChange = vi.fn();

  const result = render(
    <ActiveFilterChips
      filters={{ ...EMPTY_CLASS_FILTERS, ...filters }}
      onChange={onChange}
    />,
  );

  return { onChange, ...result };
}

describe("ActiveFilterChips", () => {
  it("renders nothing when no filter is applied", () => {
    const { container } = renderChips();

    expect(container).toBeEmptyDOMElement();
  });

  it("ignores the search term, which is not presented as a chip", () => {
    const { container } = renderChips({ searchTerm: "react" });

    expect(container).toBeEmptyDOMElement();
  });

  it("describes a closed date range with both bounds", () => {
    renderChips({ fromDate: "2026-08-01", toDate: "2026-09-05" });

    expect(
      screen.getByRole("button", { name: /01 ago 2026 → 05 sep 2026/ }),
    ).toBeInTheDocument();
  });

  it("describes an open-ended range from one bound", () => {
    renderChips({ fromDate: "2026-08-01" });
    expect(
      screen.getByRole("button", { name: /Desde 01 ago 2026/ }),
    ).toBeInTheDocument();
  });

  it("describes a range bounded only at the end", () => {
    renderChips({ toDate: "2026-09-05" });
    expect(
      screen.getByRole("button", { name: /Hasta 05 sep 2026/ }),
    ).toBeInTheDocument();
  });

  it("shows one chip per active filter", () => {
    renderChips({
      fromDate: "2026-08-01",
      teacher: "Yokasta Reyes",
      code: "DEV-101",
    });

    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("clears both date bounds when the range chip is dismissed", async () => {
    const user = userEvent.setup();
    const { onChange } = renderChips({
      fromDate: "2026-08-01",
      toDate: "2026-09-05",
    });

    await user.click(screen.getByRole("button", { name: /Quitar filtro/ }));

    expect(onChange).toHaveBeenCalledWith({ fromDate: null, toDate: null });
  });

  it("clears only its own filter when a chip is dismissed", async () => {
    const user = userEvent.setup();
    const { onChange } = renderChips({
      teacher: "Yokasta Reyes",
      code: "DEV-101",
    });

    await user.click(
      screen.getByRole("button", { name: /Quitar filtro Yokasta Reyes/ }),
    );

    expect(onChange).toHaveBeenCalledWith({ teacher: null });
  });
});
