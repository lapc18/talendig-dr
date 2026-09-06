import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/shared/i18n/copy";
import { ErrorBoundary } from "./ErrorBoundary";

/** A component that throws on render, to trip the boundary. */
function Exploding(): never {
  throw new Error("render exploded");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // React logs the caught error itself; silence it so the run stays readable.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders its children while nothing has failed", () => {
    render(
      <ErrorBoundary>
        <p>Contenido</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("shows a designed fallback instead of a blank page when a render throws", () => {
    render(
      <ErrorBoundary>
        <Exploding />
      </ErrorBoundary>,
    );

    expect(screen.getByText(COPY.errors.boundaryTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: COPY.errors.reload }),
    ).toBeInTheDocument();
  });

  it("reports the crash so it is not lost", () => {
    const errorLog = vi.spyOn(console, "error");

    render(
      <ErrorBoundary>
        <Exploding />
      </ErrorBoundary>,
    );

    expect(
      errorLog.mock.calls.some(([message]) =>
        String(message).includes("Unhandled rendering error"),
      ),
    ).toBe(true);
  });

  it("never surfaces the raw error text to the reader", () => {
    render(
      <ErrorBoundary>
        <Exploding />
      </ErrorBoundary>,
    );

    expect(screen.queryByText(/render exploded/)).not.toBeInTheDocument();
  });
});
