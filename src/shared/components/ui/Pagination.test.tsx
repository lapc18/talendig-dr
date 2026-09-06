import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

/**
 * Renders the pagination bar with sensible defaults.
 *
 * @param overrides - Props to override.
 * @returns The change spy plus the render result.
 */
function renderPagination(
  overrides: Partial<Parameters<typeof Pagination>[0]> = {},
) {
  const onPageChange = vi.fn();

  const result = render(
    <Pagination
      currentPage={1}
      totalPages={3}
      reachablePageCount={2}
      totalItems={24}
      pageItemCount={8}
      pageSize={8}
      onPageChange={onPageChange}
      {...overrides}
    />,
  );

  return { onPageChange, ...result };
}

describe("Pagination", () => {
  it("renders nothing when everything fits on one page", () => {
    const { container } = renderPagination({ totalPages: 1 });

    expect(container).toBeEmptyDOMElement();
  });

  it("reports the range being shown", () => {
    renderPagination();

    expect(screen.getByText("Mostrando 1–8 de 24")).toBeInTheDocument();
  });

  it("counts the range from the current page", () => {
    renderPagination({ currentPage: 2, reachablePageCount: 3 });

    expect(screen.getByText("Mostrando 9–16 de 24")).toBeInTheDocument();
  });

  it("accounts for a short last page", () => {
    renderPagination({ currentPage: 3, reachablePageCount: 3, pageItemCount: 8 });

    expect(screen.getByText("Mostrando 17–24 de 24")).toBeInTheDocument();
  });

  it("marks the current page for assistive technology", () => {
    renderPagination({ currentPage: 2, reachablePageCount: 3 });

    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("disables Previous on the first page", () => {
    renderPagination();

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
  });

  it("disables Next on the last page", () => {
    renderPagination({ currentPage: 3, reachablePageCount: 3 });

    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  it("disables pages whose cursor is not known yet", () => {
    renderPagination({ reachablePageCount: 2 });

    expect(screen.getByRole("button", { name: "2" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "3" })).toBeDisabled();
  });

  it("asks for the page the reader clicked", async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination();

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("steps forward and back by one", async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination({
      currentPage: 2,
      reachablePageCount: 3,
    });

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
