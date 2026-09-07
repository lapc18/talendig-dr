# 2. Arquitectura

## La idea central

**La interfaz nunca habla con Firebase.** Habla con *interfaces*, y alguien más
decide qué las implementa.

Eso suena a ceremonia hasta que ves lo que te compra:

- Las pruebas montan la app real contra una implementación en memoria, sin
  mockear módulos.
- Cambiar de Firestore a otra base de datos toca **un archivo**.
- Un componente no puede, ni por accidente, meter una consulta a la base.

## El mapa de carpetas

```
src/
├── app/          Arranque: rutas, guardia de sesión, proveedores
├── config/       Entorno validado e inicialización del SDK de Firebase
├── features/     El dominio, separado por área
│   ├── auth/     Sesión
│   └── classes/  Clases
├── pages/        Una pantalla por ruta
├── shared/       Lo que usan varias features
└── styles/       Tokens de diseño y hoja global
```

### La regla para saber dónde va algo

| Si lo que escribes… | Va en |
|---|---|
| Dibuja algo en pantalla | `components/` |
| Coordina estado y llama servicios | `hooks/` |
| Habla con Firebase o con la red | `services/` |
| Valida datos | `schemas/` |
| Lo usan dos o más features | `shared/` |
| Es una pantalla completa de una ruta | `pages/` |

Si un archivo empieza a hacer dos de esas cosas, pártelo. Es la **S** de SOLID y
está en [`CLAUDE.md`](../CLAUDE.md) §5.

## Las cuatro capas, de arriba abajo

```
  Página            PublicSearchPage, AdminDashboardPage…
     │              solo compone y renderiza
     ▼
  Hook              useClassSearch, useClassMutations…
     │              orquesta estado, decide cuándo pedir datos
     ▼
  Interfaz          ClassRepository, AuthService
     │              un contrato; NO tiene implementación
     ▼
  Adaptador         FirestoreClassRepository, FirebaseAuthService
                    la única capa que importa el SDK
```

La flecha importante es la tercera: **el hook depende de la interfaz, no del
adaptador**. Eso es inversión de dependencias, la **D** de SOLID.

### Cómo se conectan

[`src/app/providers/AppProviders.tsx`](../src/app/providers/AppProviders.tsx)
es el único lugar donde se construyen las implementaciones concretas:

```tsx
const authService: AuthService = new FirebaseAuthService();
const classRepository: ClassRepository = new FirestoreClassRepository();
```

y las inyecta por contexto. Un hook las recibe así:

```ts
const repository = useClassRepository();   // te da la interfaz, no la clase
```

En una prueba, el mismo árbol se monta con otra implementación
([`src/test/renderWithProviders.tsx`](../src/test/renderWithProviders.tsx)):

```tsx
renderWithProviders(<PublicSearchPage />, {
  repository: new InMemoryClassRepository({ records: [...] }),
});
```

El componente no se entera. Ese es todo el truco.

## Los patrones y dónde viven

| Patrón | Archivo | Qué problema resuelve |
|---|---|---|
| **Repositorio** | [`classRepository.ts`](../src/features/classes/services/classRepository.ts) | Define *qué* se puede hacer con las clases, sin decir *cómo* |
| **Adaptador** | [`firestoreClassRepository.ts`](../src/features/classes/services/firestoreClassRepository.ts) | La implementación con Firestore |
| **Adaptador (datos)** | [`firestoreClassMapper.ts`](../src/features/classes/services/firestoreClassMapper.ts) | Traduce documentos de Firestore al modelo del dominio |
| **Inyección** | [`AppProviders.tsx`](../src/app/providers/AppProviders.tsx) | Conecta interfaces con implementaciones |
| **Fachada** | [`analytics.ts`](../src/shared/lib/analytics.ts) | Una sola superficie tipada sobre Firebase Analytics |
| **Result** | [`result.ts`](../src/shared/lib/result.ts) | Los fallos esperados se devuelven, no se lanzan |
| **Error Boundary** | [`ErrorBoundary.tsx`](../src/shared/components/ErrorBoundary.tsx) | Un render que revienta cae en una pantalla diseñada |

### Interfaces segregadas

Fíjate que [`classRepository.ts`](../src/features/classes/services/classRepository.ts)
declara **tres** interfaces, no una:

```ts
export interface ClassReader { findPage, countAll, findById, listFacets }
export interface ClassWriter { create, update, remove }
export interface ClassRepository extends ClassReader, ClassWriter {}
```

La consulta pública solo necesita leer. Declarar las dos por separado permite
que un consumidor de solo lectura dependa solo de lo que usa. Es la **I** de
SOLID.

## Por qué `Timestamp` nunca llega a un componente

Firestore devuelve fechas como `Timestamp`, un tipo de su SDK. Si eso llegara a
un componente, el componente quedaría acoplado a Firebase.

[`firestoreClassMapper.ts`](../src/features/classes/services/firestoreClassMapper.ts)
es la frontera: convierte el documento a
[`ClassRecord`](../src/features/classes/types.ts) y ahí `createdAt` ya es un
`Date` normal. Es **el único** archivo que conoce la forma del documento.

Además valida con Zod al leer. Un documento malformado se reporta, no se pinta
como `undefined`.

## Lo siguiente

[Modelo de datos](./03-modelo-de-datos.md) — cómo se guardan y se buscan las clases.
