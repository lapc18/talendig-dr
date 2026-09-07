# 9. Recetas

Tareas concretas, con los archivos exactos que hay que tocar. Sigue el orden:
está pensado para que el compilador te vaya guiando.

---

## Agregar un campo a las clases

Ejemplo: `duracionMinutos`.

1. **El modelo** — [`types.ts`](../src/features/classes/types.ts): agrégalo a
   `ClassRecord`. Si el formulario lo edita, también a `ClassDraft`.
2. **La validación** — [`classSchema.ts`](../src/features/classes/schemas/classSchema.ts):
   agrégalo a `classDraftSchema` con su mensaje de error.
3. **El copy** — [`copy.ts`](../src/shared/i18n/copy.ts): la etiqueta, la ayuda y
   los mensajes de validación.
4. **El mapper** — [`firestoreClassMapper.ts`](../src/features/classes/services/firestoreClassMapper.ts):
   agrégalo a `classDocumentSchema` y al objeto que devuelve `toClassRecord`.
5. **Las reglas** — [`firestore.rules`](../firestore.rules): agrégalo a
   `isValidClass`. **El servidor tiene que validar lo mismo que el cliente.**
6. **El formulario** — [`ClassForm.tsx`](../src/features/classes/components/ClassForm.tsx):
   un `<Field>` más, y súmalo a `BLANK_DRAFT`.
7. **Donde se muestre** — tabla, cards, panel de detalle.
8. **El doble de pruebas** — [`inMemoryClassRepository.ts`](../src/test/doubles/inMemoryClassRepository.ts):
   agrégalo a `buildClassRecord`.
9. **Pruebas** del esquema y del formulario.
10. **Documentación** — la tabla de campos en
    [Modelo de datos](./03-modelo-de-datos.md).

Si el campo es buscable, agrégalo también a `buildSearchKeywords` en
[`searchKeywords.ts`](../src/features/classes/services/searchKeywords.ts).

Publica las reglas al terminar (ver [Despliegue](./08-despliegue.md)).

---

## Agregar un filtro

Ejemplo: filtrar por rango de duración.

1. **`ClassFilters`** en [`types.ts`](../src/features/classes/types.ts), y suma
   el caso a `countActiveFilters` si cuenta como filtro activo.
2. **`EMPTY_CLASS_FILTERS`** — el valor neutro.
3. **`buildFilterConstraints`** en [`firestoreClassRepository.ts`](../src/features/classes/services/firestoreClassRepository.ts):
   la restricción de Firestore. **Antes del `orderBy`.**
4. **El doble** — la misma lógica en `#match` de
   [`inMemoryClassRepository.ts`](../src/test/doubles/inMemoryClassRepository.ts),
   o el doble y el adaptador dejarán de coincidir.
5. **La UI** — [`ClassFilterFields.tsx`](../src/features/classes/components/ClassFilterFields.tsx)
   y el chip en [`ActiveFilterChips.tsx`](../src/features/classes/components/ActiveFilterChips.tsx).
6. **⚠️ El índice** — [`firestore.indexes.json`](../firestore.indexes.json).
   Casi seguro hace falta uno nuevo. Sin él, Firestore **rechaza** la consulta.

**Ojo con `useClassSearch`**: el filtro tiene que entrar en el `useMemo` de
`effectiveFilters` con sus campos individuales como dependencias. Si dependes
del objeto `filters` completo, se rompe el debounce y cada tecla se convierte en
una lectura. Ya pasó una vez.

---

## Agregar una página

1. **La ruta** en [`routes.ts`](../src/app/routes.ts).
2. **La página** en `src/pages/`.
3. **La carga diferida** en [`lazyPages.ts`](../src/app/lazyPages.ts), envuelta
   en `importWithDeploymentRecovery`:

   ```ts
   export const MiPagina = lazy(() =>
     importWithDeploymentRecovery(async () => ({
       default: (await import("@/pages/MiPagina")).MiPagina,
     })),
   );
   ```

4. **La entrada** en [`router.tsx`](../src/app/router.tsx), dentro del padre que
   tiene el `errorElement`. Si requiere sesión, envuélvela en `<ProtectedRoute>`.

---

## Agregar un evento de analytics

1. El nombre en `ANALYTICS_EVENTS` de [`analytics.ts`](../src/shared/lib/analytics.ts),
   en `snake_case`.
2. El payload en `AnalyticsEventPayloads`.
3. Llama a `trackEvent(ANALYTICS_EVENTS.miEvento, { … })`.

**Nunca envíes datos personales**: ni nombres, ni correos, ni URLs de
grabaciones. Ids, códigos, conteos y enums.

Nunca importes `firebase/analytics` fuera de la fachada.

---

## Agregar un tipo de error

1. El código en `AppErrorCode` — [`errors.ts`](../src/shared/lib/errors.ts).
2. El mensaje en español en [`copy.ts`](../src/shared/i18n/copy.ts).
3. La entrada en `MESSAGE_BY_CODE`.
4. Si viene de Firebase, el mapeo en `AUTH_CODE_MAP` o `FIRESTORE_CODE_MAP`.

TypeScript te obliga a completar `MESSAGE_BY_CODE`: es un `Record` sobre la
unión cerrada, así que olvidarlo no compila.

---

## Agregar un componente de UI

Primero, **revisa si ya existe algo parecido**. Casi siempre lo que necesitas es
una variante, no un componente nuevo.

Si de verdad hace falta:

1. En [`src/shared/components/ui/`](../src/shared/components/ui/), un archivo por
   componente.
2. Exporta el componente **y su tipo de props**, nada más.
3. Solo tokens: nada de hex.
4. Acepta `className` y pásalo por [`cn()`](../src/shared/utils/cn.ts) al final,
   para que quien lo use pueda ajustarlo.
5. JSDoc en todo lo exportado.
6. Su prueba al lado.

---

## Cambiar un color o una tipografía

Solo [`tokens.css`](../src/styles/tokens.css). Si te dan ganas de escribir un
hex en un componente, el token que falta es el problema.

---

## Crear una cuenta de profesor

En la consola de Firebase → *Authentication* → *Users* → *Add user*.

El correo tiene que ser `usuario@<VITE_AUTH_USERNAME_DOMAIN>` — hoy
`usuario@talendig.local`. En el formulario se escribe **solo** `usuario`.

Ver [Autenticación](./04-autenticacion.md).

---

## Antes de abrir el PR

```bash
pnpm lint && pnpm test && pnpm build
```

Y la lista de [`CLAUDE.md`](../CLAUDE.md) §12:

- [ ] Todo símbolo exportado con JSDoc
- [ ] Los cuatro estados en cada ruta asíncrona nueva
- [ ] Sin `any`, sin `!` sin justificar, sin `@ts-ignore`
- [ ] `README.md` y `docs/` reflejan el cambio
- [ ] La UI usa tokens, no hex
