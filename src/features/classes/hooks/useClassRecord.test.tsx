import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  InMemoryClassRepository,
  buildClassRecord,
} from "@/test/doubles/inMemoryClassRepository";
import { createWrapper } from "@/test/renderWithProviders";
import { useClassRecord } from "./useClassRecord";

const RECORDS = [
  buildClassRecord({ id: "a", name: "Fundamentos de React" }),
  buildClassRecord({ id: "b", name: "Introducción a Python" }),
];

describe("useClassRecord", () => {
  it("does not read anything when there is no id", () => {
    const repository = new InMemoryClassRepository({ records: RECORDS });
    const findById = vi.spyOn(repository, "findById");

    const { result } = renderHook(() => useClassRecord(null), {
      wrapper: createWrapper({ repository }),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.record).toBeNull();
    expect(result.current.error).toBeNull();
    expect(findById).not.toHaveBeenCalled();
  });

  it("loads the requested class", async () => {
    const { result } = renderHook(() => useClassRecord("a"), {
      wrapper: createWrapper({
        repository: new InMemoryClassRepository({ records: RECORDS }),
      }),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.record?.name).toBe("Fundamentos de React");
  });

  it("reports a missing class as an error rather than an empty form", async () => {
    const { result } = renderHook(() => useClassRecord("missing"), {
      wrapper: createWrapper({
        repository: new InMemoryClassRepository({ records: RECORDS }),
      }),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.record).toBeNull();
    expect(result.current.error?.code).toBe("classes/not-found");
  });

  it("returns to loading and never shows the previous class when the id changes", async () => {
    const { result, rerender } = renderHook(
      ({ id }) => useClassRecord(id),
      {
        initialProps: { id: "a" },
        wrapper: createWrapper({
          repository: new InMemoryClassRepository({ records: RECORDS }),
        }),
      },
    );

    await waitFor(() => {
      expect(result.current.record?.id).toBe("a");
    });

    rerender({ id: "b" });

    // The stale record must not leak into the form for the new id.
    expect(result.current.isLoading).toBe(true);
    expect(result.current.record).toBeNull();

    await waitFor(() => {
      expect(result.current.record?.id).toBe("b");
    });
  });
});
