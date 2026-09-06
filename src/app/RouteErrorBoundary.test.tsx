import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/shared/i18n/copy";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

/**
 * Renders a route that throws, guarded by the boundary under test.
 *
 * @param error - The value the route should throw.
 */
function renderFailingRoute(error: unknown) {
  function Exploding(): never {
    throw error;
  }

  const router = createMemoryRouter(
    [
      {
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: "/", element: <Exploding /> },
          { path: "/consulta", element: <p>Consulta pública</p> },
        ],
      },
    ],
    { initialEntries: ["/"] },
  );

  return render(<RouterProvider router={router} />);
}

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    // React and React Router both log the caught error themselves.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("replaces React Router's developer screen with the designed one", () => {
    renderFailingRoute(new Error("boom"));

    expect(screen.getByText(COPY.errors.boundaryTitle)).toBeInTheDocument();
    expect(
      screen.queryByText(/Unexpected Application Error/i),
    ).not.toBeInTheDocument();
  });

  it("never shows the raw error text to the reader", () => {
    renderFailingRoute(new Error("Cannot read properties of null"));

    expect(
      screen.queryByText(/Cannot read properties of null/),
    ).not.toBeInTheDocument();
  });

  it("explains a stale deployment instead of calling it a crash", () => {
    renderFailingRoute(
      new TypeError(
        "Failed to fetch dynamically imported module: /assets/LoginPage-abc.js",
      ),
    );

    expect(
      screen.getByText(COPY.errors.staleDeploymentTitle),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(COPY.errors.boundaryTitle),
    ).not.toBeInTheDocument();
  });

  it("announces the failure to assistive technology", () => {
    renderFailingRoute(new Error("boom"));

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("offers both a reload and a way back to the public consultation", () => {
    renderFailingRoute(new Error("boom"));

    expect(
      screen.getByRole("button", { name: COPY.errors.reload }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: COPY.errors.goHome }),
    ).toBeInTheDocument();
  });

  it("reports the error rather than swallowing it", () => {
    const errorLog = vi.spyOn(console, "error");

    renderFailingRoute(new Error("boom"));

    expect(
      errorLog.mock.calls.some(([message]) =>
        String(message).includes("Route failed to render"),
      ),
    ).toBe(true);
  });
});
