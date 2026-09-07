# 6. Manejo de errores

## El principio

**Nada falla en silencio, y ningún texto crudo de Firebase llega a un usuario.**

## Fallos esperados vs. inesperados

La distinción organiza todo lo demás.

| | Esperado | Inesperado |
|---|---|---|
| Ejemplo | Contraseña incorrecta, sin conexión, clase borrada | Un `undefined` donde no debía, un bug |
| Cómo viaja | **Se devuelve** como valor | **Se lanza** |
| Quién lo maneja | El que llamó, obligado por el tipo | El error boundary |

### Fallos esperados: `Result`

Los servicios devuelven [`Result<T, AppError>`](../src/shared/lib/result.ts):

```ts
const result = await repository.findById(id);

if (!result.ok) {
  setError(result.error.userMessage);   // TypeScript no te deja saltártelo
  return;
}
usar(result.value);                     // aquí ya sabe que existe
```

Esto no es estilo: si intentas leer `result.value` sin comprobar `result.ok`,
**no compila**. El manejo del error deja de ser disciplina y pasa a ser una
regla del compilador.

### Fallos inesperados: los boundaries

Hay **dos**, y hacen falta los dos:

| Boundary | Atrapa |
|---|---|
| [`ErrorBoundary`](../src/shared/components/ErrorBoundary.tsx) | Errores de render en cualquier parte del árbol |
| [`RouteErrorBoundary`](../src/app/RouteErrorBoundary.tsx) | Errores dentro de una ruta |

**¿Por qué dos?** Porque `RouterProvider` atrapa los errores de sus rutas
*antes* de que lleguen al `ErrorBoundary` que lo envuelve. Sin un `errorElement`
propio, React Router pinta su pantalla de depuración —con stack trace y todo— a
un profesor.

## `AppError`

Todo fallo presentable se normaliza a un [`AppError`](../src/shared/lib/errors.ts):

```ts
interface AppError {
  code: AppErrorCode;      // de una unión cerrada
  userMessage: string;     // español, seguro de pintar
  cause?: unknown;         // el original, solo para el log
}
```

`cause` **nunca** se muestra. Es para el log.

Los traductores son `toAuthError` y `toClassesError`. Un código que no conocen
cae al mensaje genérico — nunca al texto de Firebase.

## Los cuatro estados

**Toda ruta asíncrona pinta cuatro estados.** No tres.

```tsx
{status === "loading" && <ClassListSkeleton … />}
{status === "error"   && <ErrorState detail={error.userMessage} onRetry={retry} />}
{status === "success" && isEmpty && <EmptyState … />}
{status === "success" && !isEmpty && <ClassResultsList … />}
```

«Vacío» y «error» son cosas distintas y se ven distinto. Buscar «zzzz» y no
encontrar nada no es un fallo; que Firestore no responda sí.

El estado de error **siempre ofrece reintentar**.

## Chunks que ya no existen

Cada página es un chunk con hash en el nombre. Un despliegue los reemplaza. Si
alguien tenía la pestaña abierta y navega, pide un chunk que ya no está.

Sin manejo, eso es un `TypeError` y la pantalla de depuración de React Router.

[`moduleLoading.ts`](../src/shared/lib/moduleLoading.ts) lo detecta y **recarga
una vez** para traer el `index.html` actual. Un guard en `sessionStorage` evita
el bucle si el chunk falta de verdad, y se limpia cuando una carga funciona.

Al usuario no se le dice «algo se rompió» sino **«Hay una versión nueva
disponible»**, que es lo que pasó.

## Lo que no llega a ningún boundary

Una promesa rechazada que nadie esperó, o un error en un `setTimeout`, no pasa
por React. [`main.tsx`](../src/main.tsx) los engancha:

```ts
window.addEventListener("unhandledrejection", …);
window.addEventListener("error", …);
window.addEventListener("vite:preloadError", …);
```

Sin eso, «nada falla en silencio» sería mentira.

## Qué se puede registrar

[`logger.ts`](../src/shared/lib/logger.ts) es la única salida.

**Nunca** registres contraseñas, nombres de usuario ni URLs de grabaciones
privadas. Códigos, conteos y valores de enumeración sí.

## La lista al escribir código

- [ ] ¿El servicio devuelve `Result` en vez de lanzar?
- [ ] ¿Todo `catch` recupera o reporta por `logger`? (`catch {}` está prohibido)
- [ ] ¿Existen los cuatro estados?
- [ ] ¿El de error ofrece reintentar?
- [ ] ¿El mensaje viene de `copy.ts` y no de Firebase?
- [ ] ¿Hay una prueba del camino de fallo?

## Lo siguiente

[Pruebas](./07-pruebas.md).
