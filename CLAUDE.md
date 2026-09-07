# CLAUDE.md — Talendig Classes Record

Operating rules for anyone (human or agent) writing code in this repository.
These are not suggestions. A change that violates them is not done.

---

## 1. Language

- **All code is written in English.** Identifiers, file names, function names,
  types, constants, commit messages — English, always.
- **All comments and JSDoc are written in English.**
- **User-facing copy is written in Spanish** (Dominican, neutral, professional).
  Spanish never leaks into identifiers; it lives in `src/shared/i18n/copy.ts`
  and in JSX text nodes only.

```ts
// GOOD
/** Returns the classes matching the active filters. */
function findClasses(filters: ClassFilters): Promise<ClassRecord[]> {}

// BAD — Spanish identifier, Spanish comment
/** Devuelve las clases que cumplen los filtros. */
function buscarClases(filtros: FiltrosClase) {}
```

---

## 2. React best practices

- **Function components only.** No class components except `ErrorBoundary`,
  which the React API still requires.
- **Rules of Hooks are absolute.** No conditional hooks, no hooks in loops.
- **Derive, don't sync.** If a value can be computed from props or state during
  render, compute it. Never mirror props into state with an effect.
- **`useEffect` is for synchronizing with something outside React** (Firestore
  subscriptions, the DOM, timers, analytics). It is not a data-transformation
  tool. Every effect declares a complete dependency array and returns a cleanup
  function when it subscribes to anything.
- **Keys are stable domain ids** (`class.id`), never array indices.
- **Colocate state at the lowest level that still owns it.** Lift only when a
  second consumer genuinely appears.
- **Custom hooks are the composition layer.** Any non-trivial stateful logic in
  a component gets extracted into a `use*` hook that can be tested on its own.
- **Never mutate state.** Always produce new objects and arrays.
- **Controlled inputs go through `react-hook-form`.** Do not hand-roll form
  state.

---

## 3. Clean code

- **Names say what a thing is or does.** No `data`, `info`, `handle`, `temp`,
  `item2`. A boolean reads as a predicate: `isLoading`, `hasNextPage`,
  `canDelete`.
- **Functions do one thing** and stay short enough to read without scrolling —
  roughly 20 lines. If you need a comment to explain a block, extract that block
  into a named function instead.
- **Max 3 parameters.** Beyond that, take a single named options object.
- **No magic values.** Every literal that carries meaning becomes a named
  constant in the module that owns it.
- **No dead code, no commented-out code, no `console.log` left behind.** Git is
  the history; the file is the present.
- **Early return over nested conditionals.** Guard clauses first, happy path
  last and unindented.
- **One export per concern.** A file that exports a component exports that
  component and its props type — nothing unrelated.
- **File length**: if a file passes ~200 lines, it is doing too much. Split it.

---

## 4. Design patterns

Patterns are applied where they remove real duplication or a real coupling
problem — never as decoration.

| Pattern | Where it lives | Why |
|---|---|---|
| **Repository** | `features/classes/services/classRepository.ts` (port) + `firestoreClassRepository.ts` (adapter) | The UI depends on an interface, not on Firestore. Swapping the backend touches one file. |
| **Adapter** | `firestoreClassMapper.ts` | Firestore documents are translated to domain models at exactly one boundary. `Timestamp` never reaches a component. |
| **Provider / Dependency Injection** | `ClassRepositoryProvider`, `AuthProvider` | Implementations are injected through context, so tests inject fakes without mocking modules. |
| **Facade** | `shared/lib/analytics.ts` | One typed surface over Firebase Analytics. Components never import the SDK. |
| **Result type** | `shared/lib/result.ts` | Expected failures are returned as values, not thrown. Callers must handle them. |
| **Compound components** | `ui/Dialog`, `ui/Field` | Composable structure without prop explosions. |
| **Error Boundary** | `shared/components/ErrorBoundary.tsx` | Rendering crashes degrade to a designed fallback, never to a blank page. |

---

## 5. SOLID

- **S — Single Responsibility.** A component renders. A hook orchestrates. A
  service talks to infrastructure. A schema validates. When one file starts
  doing two of those, split it.
- **O — Open/Closed.** Extend behaviour by adding a variant, a strategy, or a
  new adapter — not by adding another `if` to a function that already branches.
- **L — Liskov Substitution.** Every `ClassRepository` implementation honours
  the same contract, including its failure modes. The in-memory fake used in
  tests is substitutable for the Firestore one.
- **I — Interface Segregation.** Small, purpose-built interfaces. A read-only
  consumer depends on the read methods, not on a fat CRUD interface.
- **D — Dependency Inversion.** High-level policy (pages, hooks) depends on
  abstractions. Low-level detail (Firestore, Firebase Auth) depends on the same
  abstractions. Concrete SDK imports live only in `services/` and `config/`.

---

## 6. KISS

- Solve the problem in front of you. No speculative abstraction, no
  configuration option nobody asked for, no plugin system for two cases.
- Two occurrences are a coincidence; three are a pattern. Abstract on the third.
- Prefer the boring solution. A `useState` beats a reducer until the state
  machine actually has more than three transitions.
- If a reviewer needs the author to explain the control flow, the code is too
  clever. Rewrite it.

---

## 7. Error handling

- **Nothing fails silently.** Every `catch` either recovers, or reports through
  `logger` and surfaces a user-visible state.
- **Expected failures are values.** Repository and service methods return
  `Result<T, AppError>`. Unexpected failures throw and are caught by the
  boundary.
- **Errors are typed.** `AppError` carries a `code` from a closed union, a
  Spanish `userMessage`, and the original `cause`. Never surface a raw Firebase
  error string to a user.
- **Every async UI path renders four states**: idle/loading, success, empty, and
  error. The error state offers a retry. The design defines all four — build all
  four.
- **Validate at the boundary.** Zod parses every form input and every document
  read from Firestore. Nothing untrusted flows inward unparsed.
- **Never swallow.** `catch {}` and `.catch(() => {})` are forbidden.

---

## 8. Performance

- **Route-level code splitting** with `React.lazy` for every page.
- **Query at the source.** Filter, sort, and paginate in Firestore with real
  indexes. Never fetch a collection and filter it in the browser.
- **Debounce user-driven queries** (300 ms for search input).
- **Memoize deliberately**: `useMemo`/`useCallback` where a value feeds a
  memoized child or an effect dependency, not reflexively on every line.
- **Stable references.** Context values are memoized so consumers do not
  re-render on every provider render.
- **No layout thrash.** Skeletons occupy the final dimensions of the content
  they replace.
- **Keep the bundle honest.** Import only what is used; no barrel file that
  pulls in the whole feature. Check `pnpm build` output before shipping.

---

## 9. Testing

- **Vitest + Testing Library.** Tests live beside the code they cover as
  `*.test.ts` / `*.test.tsx`. Shared doubles live in `src/test/doubles/`.
- **Test behaviour, not implementation.** Query by role, label and text — the
  way a person uses the screen. No snapshot tests, no assertions on class names
  or internal state.
- **Substitute, don't mock.** Feature code depends on interfaces, so a test
  injects `InMemoryClassRepository` or `FakeAuthService` through the providers.
  `vi.mock` is reserved for the SDK boundary — `firebase/auth`,
  `firebase/firestore`, `firebase/analytics` — where there is no seam of ours.
- **Every test names a behaviour.** `it("rejects http, because a recording link
  must not downgrade")`, never `it("works")`.
- **Cover the failure paths.** A repository that rejects, a form that will not
  validate, a session that has not resolved yet, a clipboard the browser
  refuses. The error path is the one that breaks in production.
- **No flaky tests.** Wait on the real signal — the session, the rendered
  result — never on a fixed delay. A test that has to be re-run is a broken
  test, not an unlucky one.
- **New code arrives with its tests.** A bug fix arrives with the test that
  fails without it.

---

## 10. Documentation

- **Every exported symbol carries JSDoc**: what it does, its parameters, what it
  returns, and what it throws or returns as an error. No exceptions.
- **Every module starts with a file-level comment** stating its responsibility
  in one sentence.
- **Non-obvious decisions get a `why` comment.** Explain the reason, never the
  mechanics — the code already states the mechanics.
- **The README is part of the change.** A PR that adds a feature, an
  environment variable, a script, or a route and does not update `README.md` is
  incomplete. The README always describes the code as it is on `main`.

### `docs/` is part of the change too

`docs/` is the long explanation of the system, written in Spanish for someone
who just joined and has never seen this code. It describes the codebase as it
is on `main`, not as it once was. **Documentation drift is a defect, not a
chore** — a doc that lies is worse than no doc, because it is trusted.

Every change checks this table and updates what it touched. It is not optional
and it is not a follow-up ticket.

| If you changed… | Update |
|---|---|
| A field on a class, or a validation rule | `docs/03-modelo-de-datos.md` + the recipe in `docs/09-recetas.md` |
| A filter, a query, or an index | `docs/03-modelo-de-datos.md` |
| Anything about sign-in, sessions or route guards | `docs/04-autenticacion.md` |
| A UI component, a design token, or a breakpoint | `docs/05-interfaz.md` |
| An error path, a boundary, or an `AppErrorCode` | `docs/06-errores.md` |
| A test double, or how tests are written | `docs/07-pruebas.md` |
| A workflow, a secret, or hosting config | `docs/08-despliegue.md` |
| A layer, a folder, or a pattern | `docs/02-arquitectura.md` |
| A script or a command | `docs/01-guia-de-inicio.md` |
| A term a newcomer would not know | `docs/glosario.md` |

Rules for the prose:

- **Spanish**, addressed to a junior developer. Explain the *why*; the code
  already shows the *how*.
- **Every file reference is a relative markdown link**, written from the
  document's own directory. A link that 404s is a broken build of the
  documentation, so check them before pushing:

  ```bash
  grep -oE '\]\(\.\.?/[^)]+\)' docs/*.md | sed 's/.*(\(.*\))/\1/' | \
    while read -r p; do [ -e "docs/$p" ] || echo "roto: $p"; done
  ```
- **Never paste code that will drift.** Link to the file instead. Quote at most
  the few lines that carry the idea, and only when the idea is the point.
- **Record the trade-off, not just the decision.** The reason a choice was made
  is what a newcomer cannot recover from the code.
- **Renaming or deleting a file means grepping `docs/` for it.**

`docs/design/` holds the design canvas and `docs/design-prompt.md` the prompt
that produced it. Keep both in sync when the design changes.

---

## 11. Firebase Analytics

- Analytics is consumed **only** through the facade in
  `src/shared/lib/analytics.ts`. No component or hook imports
  `firebase/analytics` directly.
- **Event names are constants** in `ANALYTICS_EVENTS`, `snake_case`, and typed
  against their payload. A new event means a new entry in that map and a new
  payload type — not a free-form string at a call site.
- **Track intent, not renders**: searches performed, filters applied, a
  recording opened, a class created/updated/deleted, a login succeeded or
  failed, an error state shown.
- **Never send personal data.** No passwords, no email addresses, no full names,
  no raw URLs of private recordings. Send ids, codes, counts, and enum values.
- Analytics must **never break the app**. Every call is fire-and-forget behind a
  guard: if the SDK is unsupported or disabled, the call is a no-op and the app
  continues.
- Analytics is **disabled outside production** unless
  `VITE_ENABLE_ANALYTICS_IN_DEV=true`.

---

## 12. Definition of done

A change is done when all of these hold:

- [ ] `pnpm build` passes with no TypeScript errors and no new warnings.
- [ ] `pnpm lint` passes.
- [ ] `pnpm test` passes, and the change is covered by tests that would fail
      without it.
- [ ] Every new exported symbol has JSDoc.
- [ ] Loading, empty, and error states exist for every async path touched.
- [ ] No `any`, no non-null assertion (`!`) without a comment justifying it, no
      `@ts-ignore`.
- [ ] `README.md` reflects the change.
- [ ] `docs/` reflects the change — see the table in §10; every link resolves.
- [ ] The UI matches `docs/design/talendig-classes-record.dc.html` — tokens from
      `src/styles/tokens.css`, never hardcoded hex values in components.
