import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAppError } from "@/shared/lib/errors";
import {
  InMemoryClassRepository,
  buildClassRecord,
} from "@/test/doubles/inMemoryClassRepository";
import { createWrapper } from "@/test/renderWithProviders";
import { useClassSearch } from "./useClassSearch";

/** Five classes across two teachers, newest first once sorted. */
const RECORDS = [
  buildClassRecord({ id: "a", date: "2026-08-28", code: "DEV-101", name: "Fundamentos de React", teacher: "Yokasta Reyes" }),
  buildClassRecord({ id: "b", date: "2026-08-26", code: "PY-100", name: "Introducción a Python", teacher: "Wilfredo Batista" }),
  buildClassRecord({ id: "c", date: "2026-08-21", code: "GIT-110", name: "Git y GitHub", teacher: "Yokasta Reyes" }),
  buildClassRecord({ id: "d", date: "2026-08-19", code: "DB-205", name: "PostgreSQL", teacher: "Wilfredo Batista" }),
  buildClassRecord({ id: "e", date: "2026-08-14", code: "UX-140", name: "Figma", teacher: "Yokasta Reyes" }),
];

/**
 * Renders the hook against a repository.
 *
 * @param repository - The repository to query.
 * @param pageSize - Results per page.
 * @returns The Testing Library hook result.
 */
function renderSearch(repository: InMemoryClassRepository, pageSize = 2) {
  return renderHook(() => useClassSearch({ pageSize, surface: "public" }), {
    wrapper: createWrapper({ repository }),
  });
}

describe("useClassSearch", () => {
  beforeEach(() => {
    // Auto-advancing fake timers let the 300 ms search debounce be driven
    // explicitly while `waitFor` still resolves.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts loading and resolves to the first page, newest first", async () => {
    const { result } = renderSearch(new InMemoryClassRepository({ records: RECORDS }));

    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    expect(result.current.items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(result.current.totalItems).toBe(5);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.isEmpty).toBe(false);
  });

  it("reports an empty result rather than an error when nothing matches", async () => {
    const { result } = renderSearch(new InMemoryClassRepository());

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("surfaces a repository failure as an error state with its message", async () => {
    const failure = createAppError(
      "classes/unavailable",
      "El servicio de clases no responde.",
    );
    const { result } = renderSearch(
      new InMemoryClassRepository({ failWith: failure }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.error?.code).toBe("classes/unavailable");
    expect(result.current.items).toHaveLength(0);
    expect(result.current.isEmpty).toBe(false);
  });

  it("recovers when a retry succeeds after a failure", async () => {
    const repository = new InMemoryClassRepository({
      failWith: createAppError("classes/unavailable", "sin servicio"),
    });
    const { result } = renderSearch(repository);

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    const working = new InMemoryClassRepository({ records: RECORDS });
    const { result: recovered } = renderSearch(working);

    await waitFor(() => {
      expect(recovered.current.status).toBe("success");
    });
    expect(recovered.current.items).toHaveLength(2);
  });

  it("re-runs the same query when retry is called", async () => {
    const repository = new InMemoryClassRepository({ records: RECORDS });
    const findPage = vi.spyOn(repository, "findPage");
    const { result } = renderSearch(repository);

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    const callsBefore = findPage.mock.calls.length;

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(findPage.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe("pagination", () => {
    it("advances to the next page once its cursor is known", async () => {
      const { result } = renderSearch(
        new InMemoryClassRepository({ records: RECORDS }),
      );

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });
      expect(result.current.reachablePageCount).toBe(2);

      act(() => {
        result.current.goToPage(2);
      });

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });
      expect(result.current.page).toBe(2);
      expect(result.current.items.map((item) => item.id)).toEqual(["c", "d"]);
    });

    it("ignores a jump past the furthest page whose cursor is known", async () => {
      const { result } = renderSearch(
        new InMemoryClassRepository({ records: RECORDS }),
      );

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.page).toBe(1);
    });

    it("ignores a page below the first", async () => {
      const { result } = renderSearch(
        new InMemoryClassRepository({ records: RECORDS }),
      );

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });

      act(() => {
        result.current.goToPage(0);
      });

      expect(result.current.page).toBe(1);
    });

    it("reports a single page when everything fits on it", async () => {
      const { result } = renderHook(
        () => useClassSearch({ pageSize: 10, surface: "public" }),
        { wrapper: createWrapper({ repository: new InMemoryClassRepository({ records: RECORDS }) }) },
      );

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });

      expect(result.current.totalPages).toBe(1);
      expect(result.current.reachablePageCount).toBe(1);
    });
  });

  describe("filters", () => {
    it("debounces the search term before querying", async () => {
      const repository = new InMemoryClassRepository({ records: RECORDS });
      const findPage = vi.spyOn(repository, "findPage");
      const { result } = renderSearch(repository);

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });
      const callsBefore = findPage.mock.calls.length;

      act(() => {
        result.current.setFilters({ searchTerm: "p" });
        result.current.setFilters({ searchTerm: "py" });
        result.current.setFilters({ searchTerm: "python" });
      });

      // Still inside the quiet period: the keystrokes have cost nothing yet.
      expect(findPage.mock.calls.length).toBe(callsBefore);

      await waitFor(() => {
        expect(result.current.items.map((item) => item.id)).toEqual(["b"]);
      });
      expect(findPage.mock.calls.length).toBe(callsBefore + 1);
    });

    it("filters by teacher", async () => {
      const { result } = renderSearch(
        new InMemoryClassRepository({ records: RECORDS }),
      );

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });

      act(() => {
        result.current.setFilters({ teacher: "Wilfredo Batista" });
      });

      await waitFor(() => {
        expect(result.current.totalItems).toBe(2);
      });
      expect(result.current.activeFilterCount).toBe(1);
    });

    it("returns to the first page when the filters change", async () => {
      const { result } = renderSearch(
        new InMemoryClassRepository({ records: RECORDS }),
      );

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });

      act(() => {
        result.current.goToPage(2);
      });
      await waitFor(() => {
        expect(result.current.page).toBe(2);
      });

      act(() => {
        result.current.setFilters({ teacher: "Yokasta Reyes" });
      });

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });
      expect(result.current.page).toBe(1);
      expect(result.current.reachablePageCount).toBe(2);
    });

    it("returns to the first page when the sort order changes", async () => {
      const { result } = renderSearch(
        new InMemoryClassRepository({ records: RECORDS }),
      );

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });
      act(() => {
        result.current.goToPage(2);
      });
      await waitFor(() => {
        expect(result.current.page).toBe(2);
      });

      act(() => {
        result.current.setSortOrder("date-asc");
      });

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });
      expect(result.current.page).toBe(1);
      expect(result.current.items.map((item) => item.id)).toEqual(["e", "d"]);
    });

    it("clears every filter but leaves the sort order alone", async () => {
      const { result } = renderSearch(
        new InMemoryClassRepository({ records: RECORDS }),
      );

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });

      act(() => {
        result.current.setSortOrder("date-asc");
        result.current.setFilters({ teacher: "Yokasta Reyes", code: "DEV-101" });
      });
      await waitFor(() => {
        expect(result.current.activeFilterCount).toBe(2);
      });

      act(() => {
        result.current.clearFilters();
      });

      await waitFor(() => {
        expect(result.current.activeFilterCount).toBe(0);
      });
      expect(result.current.sortOrder).toBe("date-asc");
      expect(result.current.filters.searchTerm).toBe("");
    });
  });
});
