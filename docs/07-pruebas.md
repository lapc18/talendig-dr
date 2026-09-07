# 7. Pruebas

```bash
pnpm test            # una vez
pnpm test:watch      # mientras programas
pnpm test:coverage   # con cobertura
```

Vitest + Testing Library sobre jsdom. Las pruebas viven **al lado** del código
que cubren: `useClassSearch.ts` y `useClassSearch.test.ts` son vecinos.

## El principio: sustituir, no mockear

Esta es la diferencia con la mayoría de proyectos. Como las páginas y hooks
dependen de interfaces, una prueba inyecta **otra implementación real** por los
mismos proveedores que usa la app:

```tsx
renderWithProviders(<PublicSearchPage />, {
  repository: new InMemoryClassRepository({ records: [...] }),
});
```

Compara con lo que **no** hacemos:

```ts
vi.mock("firebase/firestore");   // ❌ acopla la prueba al SDK
```

[`InMemoryClassRepository`](../src/test/doubles/inMemoryClassRepository.ts)
implementa `ClassRepository` de verdad: aplica los mismos filtros, el mismo
orden y la misma paginación por cursor. Si el doble y el adaptador de Firestore
alguna vez difieren, es un bug en uno de los dos — y ese es justamente el punto
(la **L** de SOLID).

`vi.mock` se reserva para la frontera del SDK —`firebase/auth`,
`firebase/firestore`, `firebase/analytics`— donde no hay costura nuestra.

## Los dobles disponibles

| Doble | Para |
|---|---|
| [`InMemoryClassRepository`](../src/test/doubles/inMemoryClassRepository.ts) | Clases. Acepta `records` y `failWith` |
| [`buildClassRecord`](../src/test/doubles/inMemoryClassRepository.ts) | Construye un `ClassRecord` con overrides |
| [`FakeAuthService`](../src/test/doubles/fakeAuthService.ts) | Sesión. Acepta `initialUser` y `validPassword` |
| [`renderWithProviders`](../src/test/renderWithProviders.tsx) | Monta con router + sesión + repositorio |
| [`createWrapper`](../src/test/renderWithProviders.tsx) | Lo mismo, para `renderHook` |

## Probar comportamiento, no implementación

Consulta por rol, etiqueta y texto — como lo haría una persona:

```tsx
screen.getByRole("button", { name: "Guardar clase" })   // ✅
screen.getByLabelText(/Código de clase/)                // ✅
container.querySelector(".bg-navy-900")                 // ❌
```

Nada de snapshots. Nada de afirmar sobre clases CSS ni estado interno.

## Cada prueba nombra un comportamiento

```ts
it("rejects http, because a recording link must not downgrade")   // ✅
it("works")                                                        // ❌
```

El nombre explica **qué** y **por qué**. Cuando falla en CI, el nombre solo ya
debería decirte qué se rompió.

## Cubre los caminos de fallo

Son los que revientan en producción. `InMemoryClassRepository` acepta `failWith`
justamente para eso:

```ts
new InMemoryClassRepository({
  failWith: createAppError("classes/unavailable", "sin servicio"),
});
```

## Nada de pruebas intermitentes

Espera la **señal real**, nunca un retardo fijo:

```ts
await waitFor(() => expect(result.current.status).toBe("success"));   // ✅
await new Promise((r) => setTimeout(r, 500));                          // ❌
```

Una prueba que hay que volver a correr está rota, no tuvo mala suerte.

> Hubo una así en este proyecto: esperaba `isSaving === false`, que ya era
> cierto antes de que la sesión resolviera. Se arregló esperando la señal de
> verdad — `auth.user !== null`.

## Probar debounce y tiempo

Con temporizadores falsos que avanzan solos, para que `waitFor` siga resolviendo:

```ts
vi.useFakeTimers({ shouldAdvanceTime: true });
```

## El entorno de pruebas

[`vitest.config.ts`](../vitest.config.ts) inyecta una configuración de Firebase
falsa. `VITE_FIREBASE_MEASUREMENT_ID` se omite **a propósito**: sin él la fachada
de analytics es un no-op y nunca toca la red.

[`src/test/setup.ts`](../src/test/setup.ts) registra los matchers de jest-dom,
limpia el DOM entre pruebas e instala el polyfill de `<dialog>`.

## Qué cubrir

| Capa | Qué probar |
|---|---|
| Lógica pura | Cada rama. Son rápidas y valen mucho |
| Servicios | Qué consulta construyen, y que normalicen los rechazos |
| Hooks | Los cuatro estados, y las transiciones entre ellos |
| Componentes | Lo que ve y hace una persona |
| Páginas | El flujo completo, incluido el camino de error |

No cubrimos el cableado: `App.tsx`, `router.tsx` y `AppProviders.tsx` solo
componen piezas ya probadas.

## Lo siguiente

[Despliegue](./08-despliegue.md).
