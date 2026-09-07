# 3. Modelo de datos

## Una sola colección

Todo vive en `classes`. No hay subcolecciones ni relaciones.

## El documento

Definido en [`firestoreClassMapper.ts`](../src/features/classes/services/firestoreClassMapper.ts).

| Campo | Tipo | Notas |
|---|---|---|
| `date` | `string` | Día en formato `yyyy-MM-dd` |
| `code` | `string` | `LETRAS-NÚMEROS` en mayúsculas, p. ej. `DEV-101` |
| `name` | `string` | Máx. 120 caracteres |
| `teacher` | `string` | |
| `link` | `string` | URL absoluta `https` |
| `comment` | `string` | Máx. 600, puede ir vacío |
| `keywords` | `string[]` | Índice de búsqueda, generado al escribir |
| `createdAt` | `Timestamp` | |
| `updatedAt` | `Timestamp` | |
| `updatedBy` | `string` | Usuario que guardó por última vez |

El modelo que ve la aplicación es
[`ClassRecord`](../src/features/classes/types.ts): igual, pero con `id`, con
`Date` en vez de `Timestamp`, y **sin `keywords`** — eso es maquinaria de
escritura, la interfaz no lo necesita.

## Por qué la fecha es un `string` y no un `Timestamp`

Este es el detalle no obvio del proyecto.

Una clase impartida el 28 de agosto **es** el 28 de agosto, la mire quien la
mire. No es un instante, es un día de calendario.

Si la guardáramos como `Timestamp`, sería un instante en UTC. `2026-01-01` en
UTC es el 31 de diciembre a las 8 p. m. en República Dominicana. La clase
aparecería un día antes.

Guardarla como texto `yyyy-MM-dd` elimina el problema: no hay zona horaria que
la pueda correr. Además ese formato ordena y compara alfabéticamente igual que
cronológicamente, así que `where('date', '>=', '2026-08-01')` funciona tal cual.

Las conversiones viven en [`src/shared/utils/date.ts`](../src/shared/utils/date.ts),
y hay una prueba que fija justo este caso:

```ts
it("keeps the stored day for a date that would roll back in UTC", () => {
  expect(formatShortDate("2026-01-01")).toBe("01 ene 2026");
});
```

## La búsqueda

Firestore **no tiene búsqueda de texto completo**. No existe `LIKE '%react%'`.

La solución es un índice que se construye al escribir. Cuando guardas una
clase, [`searchKeywords.ts`](../src/features/classes/services/searchKeywords.ts)
genera un arreglo de prefijos:

```
"Fundamentos de React"  →  fun, fund, funda, fundam, … fundamentos
                           rea, reac, react
"Rosángela Díaz"        →  ros, rosa, … rosangela   (sin acentos)
"DEV-101"               →  dev, dev-, … + dev101    (también sin guión)
```

Al buscar, [`toSearchKeyword`](../src/features/classes/services/searchKeywords.ts)
convierte lo que escribiste en **una** clave y la consulta es un
`array-contains`. Es del lado del servidor: el navegador nunca descarga filas
que no va a mostrar.

Tres decisiones dentro de eso:

- **Prefijos desde 3 caracteres.** Menos que eso casi todo coincide.
- **Hasta 12 caracteres.** Acota cuánto crece el arreglo por documento.
- **Sin acentos.** Se escribe `rosangela` y encuentra `Rosángela`.

> ⚠️ **Limitación conocida.** Firestore permite un solo `array-contains` por
> consulta, así que `toSearchKeyword` se queda con **el token más largo** y
> descarta el resto. Buscar «python avanzado» devuelve todas las clases de
> Python, aunque ninguna diga «avanzado». Está documentado en el código.

## Los índices compuestos

Cualquier consulta que combine un filtro con `orderBy` necesita un índice
declarado. Sin él Firestore **rechaza la consulta** — no la responde lenta, la
rechaza.

Están en [`firestore.indexes.json`](../firestore.indexes.json) y se publican con:

```bash
pnpm dlx firebase-tools deploy --only firestore:indexes --project talendig-dr
```

**Si agregas un filtro nuevo, casi seguro necesitas un índice nuevo.** El error
de Firestore trae un enlace que te crea el índice; cópialo también al JSON, o
se pierde en el próximo despliegue.

## La paginación

Firestore no tiene `OFFSET`. Se pagina con **cursores**: «dame los siguientes 8
después de este documento».

Eso tiene una consecuencia visible: **solo puedes saltar a una página cuyo
cursor ya conoces**. Por eso en [`Pagination.tsx`](../src/shared/components/ui/Pagination.tsx)
los números más allá de lo alcanzado salen deshabilitados, y se llega a ellos
con «Siguiente» — un clic cada uno, sin lecturas extra.

El rastro de cursores lo lleva
[`useClassSearch`](../src/features/classes/hooks/useClassSearch.ts) en su estado
`cursors`, y se reinicia cuando cambian los filtros, porque los cursores de otro
conjunto de resultados no significan nada.

El total sale de `getCountFromServer`, una agregación del servidor que **no**
transfiere los documentos.

## Las reglas de seguridad

[`firestore.rules`](../firestore.rules) es **el límite de seguridad real**. El
guardia de rutas del cliente es comodidad de interfaz: cualquiera puede abrir la
consola del navegador y llamar a Firestore directamente.

```
allow read: if true;                          // la consulta es pública
allow create, update: if request.auth != null && isValidClass(...);
allow delete: if request.auth != null;
```

`isValidClass` revalida forma y límites **en el servidor**. Zod valida en el
cliente; las reglas validan otra vez. Las dos hacen falta: la primera da buenos
mensajes, la segunda es la que no se puede saltar.

## Lo siguiente

[Autenticación](./04-autenticacion.md).
