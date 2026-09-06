import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FakeAuthService, TEST_USER } from "@/test/doubles/fakeAuthService";
import {
  InMemoryClassRepository,
  buildClassRecord,
} from "@/test/doubles/inMemoryClassRepository";
import { createWrapper } from "@/test/renderWithProviders";
import { createAppError } from "@/shared/lib/errors";
import type { ClassDraft } from "../types";
import { useClassMutations } from "./useClassMutations";

const DRAFT: ClassDraft = {
  date: "2026-08-28",
  code: "DEV-101",
  name: "Fundamentos de React",
  teacher: "Yokasta Reyes",
  link: "https://meet.talendig.do/rec/dev-101",
  comment: "",
};

/**
 * Renders the mutations hook with a session already established.
 *
 * The auth session is read alongside it so the helper can wait for the real
 * signal — the provider resolves the session asynchronously, exactly as
 * Firebase does, and writing before it lands would hit the session guard
 * instead of the repository.
 *
 * @param repository - The repository to write through.
 * @returns The hook result, once the session has resolved.
 */
async function renderSignedIn(repository: InMemoryClassRepository) {
  const rendered = renderHook(
    () => ({ mutations: useClassMutations(), auth: useAuth() }),
    {
      wrapper: createWrapper({
        repository,
        authService: new FakeAuthService({ initialUser: TEST_USER }),
      }),
    },
  );

  await waitFor(() => {
    expect(rendered.result.current.auth.user).not.toBeNull();
  });

  return rendered;
}

describe("useClassMutations", () => {
  it("refuses to write without a session", async () => {
    const repository = new InMemoryClassRepository();
    const { result } = renderHook(
      () => ({ mutations: useClassMutations(), auth: useAuth() }),
      {
        wrapper: createWrapper({
          repository,
          authService: new FakeAuthService(),
        }),
      },
    );

    // Wait for the signed-out state to be settled, so the refusal is about the
    // missing session and not about the session not having resolved yet.
    await waitFor(() => {
      expect(result.current.auth.isInitialising).toBe(false);
    });

    let outcome: Awaited<ReturnType<typeof result.current.mutations.createClass>>;
    await act(async () => {
      outcome = await result.current.mutations.createClass(DRAFT);
    });

    expect(outcome!.ok).toBe(false);
    expect(!outcome!.ok && outcome!.error.code).toBe(
      "classes/permission-denied",
    );
    expect(repository.records).toHaveLength(0);
  });

  it("creates a class and credits the signed-in teacher", async () => {
    const repository = new InMemoryClassRepository();
    const { result } = await renderSignedIn(repository);

    await act(async () => {
      await result.current.mutations.createClass(DRAFT);
    });

    expect(repository.calls.create).toHaveLength(1);
    expect(repository.calls.create[0].author).toBe("yokasta.reyes");
    expect(repository.records[0].name).toBe("Fundamentos de React");
  });

  it("updates a class through the repository", async () => {
    const repository = new InMemoryClassRepository({
      records: [buildClassRecord({ id: "a" })],
    });
    const { result } = await renderSignedIn(repository);

    await act(async () => {
      await result.current.mutations.updateClass("a", { ...DRAFT, name: "Renombrada" });
    });

    expect(repository.calls.update[0].id).toBe("a");
    expect(repository.records[0].name).toBe("Renombrada");
  });

  it("deletes a class", async () => {
    const repository = new InMemoryClassRepository({
      records: [buildClassRecord({ id: "a" })],
    });
    const { result } = await renderSignedIn(repository);

    await act(async () => {
      await result.current.mutations.deleteClass("a", "DEV-101");
    });

    expect(repository.calls.remove).toEqual(["a"]);
    expect(repository.records).toHaveLength(0);
  });

  it("passes a repository failure back to the caller instead of throwing", async () => {
    const repository = new InMemoryClassRepository({
      failWith: createAppError("classes/permission-denied", "sin permiso"),
    });
    const { result } = await renderSignedIn(repository);

    let outcome: Awaited<ReturnType<typeof result.current.mutations.createClass>>;
    await act(async () => {
      outcome = await result.current.mutations.createClass(DRAFT);
    });

    expect(outcome!.ok).toBe(false);
    expect(!outcome!.ok && outcome!.error.userMessage).toBe("sin permiso");
  });

  it("clears the in-flight flag even when the write fails", async () => {
    const repository = new InMemoryClassRepository({
      failWith: createAppError("classes/unknown", "falló"),
    });
    const { result } = await renderSignedIn(repository);

    await act(async () => {
      await result.current.mutations.deleteClass("a", "DEV-101");
    });

    expect(result.current.mutations.isDeleting).toBe(false);
  });
});
