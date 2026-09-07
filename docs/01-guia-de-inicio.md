# 1. Guía de inicio

## Qué necesitas instalado

- **Node 22** o superior
- **pnpm** — el proyecto lo fija en `package.json` con
  `"packageManager": "pnpm@10.33.2"`, así que si usas Corepack se instala solo.
  No uses `npm` ni `yarn`: generarían otro lockfile.

## Levantarlo

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

`.env.local` viene vacío. Pídele los valores a quien administre el proyecto de
Firebase, o sácalos de la consola: *Configuración del proyecto* → *Tus apps* →
*Configuración del SDK*.

Si falta alguna variable, la app falla al arrancar con un mensaje claro. Eso es
a propósito — lo hace [`src/config/env.ts`](../src/config/env.ts), que valida
todo al importarse en vez de dejar que revientes más tarde con un error opaco de
Firebase.

## Los comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente |
| `pnpm build` | Chequea tipos (`tsc -b`) y compila para producción |
| `pnpm test` | Corre las pruebas una vez |
| `pnpm test:watch` | Pruebas en modo watch, mientras programas |
| `pnpm test:coverage` | Pruebas con reporte de cobertura |
| `pnpm lint` | oxlint |
| `pnpm preview` | Sirve el build de producción, para verlo como en vivo |

**Antes de dar por terminado cualquier cambio**, los tres tienen que pasar:

```bash
pnpm lint && pnpm test && pnpm build
```

## Qué acabas de levantar

Abre `http://localhost:5173`. Verás dos zonas:

### La consulta pública — `/`

Sin sesión. Cualquiera busca clases por nombre, código o profesor, filtra por
fecha, profesor o código, y abre la grabación.

Vive en [`src/pages/PublicSearchPage.tsx`](../src/pages/PublicSearchPage.tsx).

### La administración — `/admin`

Requiere sesión. Es el CRUD: crear, editar y eliminar clases.

Vive en [`src/pages/AdminDashboardPage.tsx`](../src/pages/AdminDashboardPage.tsx)
y [`src/pages/ClassFormPage.tsx`](../src/pages/ClassFormPage.tsx).

Para entrar necesitas una cuenta creada en Firebase Auth. **En el formulario
escribes solo el usuario, no el correo** — mira
[Autenticación](./04-autenticacion.md), que explica por qué.

## Una advertencia sobre el entorno local

`.env.local` apunta al **mismo proyecto de Firebase que producción**. No hay un
proyecto de staging todavía. Lo que crees o borres desde tu máquina afecta los
datos reales.

Si vas a experimentar, crea clases con un código reconocible (`TEST-001`) y
bórralas al terminar.

## Lo siguiente

[Arquitectura](./02-arquitectura.md) — por qué las carpetas están donde están.
