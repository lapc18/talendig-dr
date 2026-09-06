/**
 * Top-level rendering error boundary.
 *
 * React only supports error boundaries as class components, which is the sole
 * reason this file is not a function component. Anything a render throws
 * degrades to a designed fallback instead of a blank page.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { COPY } from "@/shared/i18n/copy";
import { logger } from "@/shared/lib/logger";
import { Button } from "./ui/Button";

/** Props for {@link ErrorBoundary}. */
export interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

/** Internal state of {@link ErrorBoundary}. */
interface ErrorBoundaryState {
  readonly hasError: boolean;
}

/** Catches render-time errors below it and shows a recoverable fallback. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false };

  /**
   * Moves the boundary into its error state.
   *
   * @returns The next state.
   */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  /**
   * Reports the crash.
   *
   * @param error - The thrown error.
   * @param errorInfo - React's component stack for the crash.
   */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("Unhandled rendering error", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  /** @returns The children, or the fallback when a render has failed. */
  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink-100 p-6">
        <div className="w-full max-w-md rounded-card bg-white p-8 text-center shadow-card">
          <h1 className="mb-2 font-sans text-h2 font-extrabold text-navy-900">
            {COPY.errors.boundaryTitle}
          </h1>
          <p className="mb-6 font-sans text-sm leading-[1.6] text-ink-600">
            {COPY.errors.boundaryBody}
          </p>
          <Button
            onClick={() => {
              window.location.reload();
            }}
          >
            {COPY.errors.reload}
          </Button>
        </div>
      </div>
    );
  }
}
