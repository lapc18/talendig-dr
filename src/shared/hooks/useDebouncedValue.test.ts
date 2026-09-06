import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("react", 300));

    expect(result.current).toBe("react");
  });

  it("holds the previous value until the delay has elapsed", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "r" } },
    );

    rerender({ value: "react" });
    expect(result.current).toBe("r");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("r");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("react");
  });

  it("publishes only the last value when input keeps changing", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "" } },
    );

    for (const value of ["r", "re", "rea", "reac", "react"]) {
      rerender({ value });
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }

    expect(result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("react");
  });

  it("cancels the pending update when it unmounts", () => {
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "r" } },
    );

    rerender({ value: "react" });
    unmount();

    expect(() => {
      vi.runAllTimers();
    }).not.toThrow();
  });
});
