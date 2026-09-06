# Talendig Classes Record

Registro y consulta del histórico de clases de Talendig.

**Producción:** https://talendig-dr.web.app

Dos superficies sobre la misma base de datos:

- **Consulta pública** (`/`) — abierta, sin autenticación. Estudiantes y
  profesores buscan una clase por nombre, código o profesor, filtran por fecha,
  profesor o código, y abren la grabación.
- **Administración** (`/admin`) — requiere sesión. CRUD completo de clases.

La interfaz está en español; el código, los comentarios y la documentación
están en inglés. Las reglas de trabajo del repositorio están en
[`CLAUDE.md`](./CLAUDE.md) y son de cumplimiento obligatorio.

---

## Stack

| Área | Elección |
|---|---|
| Build | Vite 8 + React 19 + TypeScript 6 |
| Estilos | Tailwind CSS 4 (tokens en `src/styles/tokens.css`) |
| Rutas | React Router 7, con `React.lazy` por página |
| Formularios | react-hook-form + Zod |
| Datos | Cloud Firestore |
| Sesión | Firebase Authentication |
| Métricas | Firebase Analytics (a través de una fachada tipada) |
| Pruebas | Vitest + Testing Library (jsdom) |
| Paquetes | pnpm |

---

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.local   # y completa los valores de Firebase
pnpm dev
```

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Chequeo de tipos (`tsc -b`) + build de producción |
| `pnpm preview` | Sirve el build de producción |
| `pnpm lint` | oxlint |
| `pnpm test` | Suite de pruebas (Vitest) |
| `pnpm test:watch` | Pruebas en modo watch |
| `pnpm test:coverage` | Pruebas con reporte de cobertura |
| `./scripts/set-github-secrets.sh` | Sube las variables de `.env.local` al environment de GitHub |
| `./scripts/create-deploy-service-account.sh` | Crea la cuenta de servicio de deploy y guarda su llave |

### Variables de entorno

Todas se validan al arrancar en `src/config/env.ts`: si falta una, la
aplicación falla de inmediato con un mensaje claro en vez de reventar más tarde
con un error opaco de Firebase.

| Variable | Requerida | Notas |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | sí | |
| `VITE_FIREBASE_AUTH_DOMAIN` | sí | |
| `VITE_FIREBASE_PROJECT_ID` | sí | |
| `VITE_FIREBASE_STORAGE_BUCKET` | sí | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | sí | |
| `VITE_FIREBASE_APP_ID` | sí | |
| `VITE_FIREBASE_MEASUREMENT_ID` | no | Sin ella, Analytics no se inicializa |
| `VITE_AUTH_USERNAME_DOMAIN` | no | Por defecto `classes.talendig.local` |
| `VITE_ENABLE_ANALYTICS_IN_DEV` | no | `true` para enviar eventos desde `pnpm dev` |

---

## Configuración de Firebase

### 1. Firestore

Colección única `classes`. Cada documento:

| Campo | Tipo | Notas |
|---|---|---|
| `date` | `string` | Día `yyyy-MM-dd`. Es un día de calendario, no un instante: se guarda como texto para que no se corra de día según la zona horaria del lector |
| `code` | `string` | `LETRAS-NÚMEROS`, en mayúsculas, p. ej. `DEV-101` |
| `name` | `string` | Máx. 120 caracteres |
| `teacher` | `string` | |
| `link` | `string` | URL absoluta `https` |
| `comment` | `string` | Máx. 600 caracteres, puede ir vacío |
| `keywords` | `string[]` | Índice de búsqueda, generado al escribir |
| `createdAt` / `updatedAt` | `Timestamp` | |
| `updatedBy` | `string` | Usuario que guardó por última vez |

La base de datos vive en **`us-east1`** (Carolina del Sur), en modo Native. La
ubicación de Firestore es permanente: cambiarla exige crear otro proyecto.

Publica las reglas y los índices:

```bash
pnpm dlx firebase-tools deploy --only firestore:rules,firestore:indexes
```

- [`firestore.rules`](./firestore.rules) — lectura pública, escritura solo
  autenticada, con validación de forma en el servidor. **Este es el límite de
  seguridad real**; el guardia de rutas del cliente es solo comodidad de la
  interfaz.
- [`firestore.indexes.json`](./firestore.indexes.json) — índices compuestos que
  necesitan las consultas filtradas. Sin ellos, Firestore rechaza la consulta.

### 2. Autenticación

Habilita el proveedor **Email/Password** y crea las cuentas de los profesores a
mano en la consola. No hay registro público.

Firebase Auth no tiene proveedor de usuario/contraseña: solo email/contraseña.
Como los profesores entran con un usuario simple, el servicio le agrega un
dominio no enrutable configurable — `yokasta.reyes` inicia sesión como
`yokasta.reyes@classes.talendig.local`. Ese dominio nunca tiene que resolver ni
recibir correo; crea las cuentas con esa forma de email.

### 3. Analytics

Opcional. Si defines `VITE_FIREBASE_MEASUREMENT_ID`, se registran estos eventos:

`class_search_performed`, `class_filters_applied`, `class_filters_cleared`,
`class_detail_opened`, `class_recording_opened`, `class_created`,
`class_updated`, `class_deleted`, `teacher_login_succeeded`,
`teacher_login_failed`, `error_state_shown`.

Las cargas útiles llevan solo ids, códigos, conteos y valores de enumeración —
nunca nombres, correos ni URLs de grabaciones.

---

## CI/CD y secretos

### Antes que nada: la config web de Firebase no es secreta

Las seis variables `VITE_FIREBASE_*` se **compilan dentro del bundle** y
cualquiera puede leerlas abriendo las herramientas de desarrollo. Google lo
documenta explícitamente: la config web es un identificador de proyecto, no una
credencial.

Lo que realmente protege los datos es:

1. **`firestore.rules`** — lectura pública, escritura solo autenticada, con
   validación de forma en el servidor. Ya está en el repositorio.
2. **Restricciones de la API key** en Google Cloud Console → *Credentials*:
   limita la clave web a los dominios de Talendig (referrers HTTP).
3. **Firebase App Check**, si más adelante quieren bloquear clientes que no sean
   la app real.

Guardarlas como secrets sigue valiendo la pena — mantiene los valores fuera del
repositorio y permite apuntar a proyectos distintos por ambiente — pero **no lo
trates como una medida de seguridad**. La única credencial de verdad aquí es
`FIREBASE_SERVICE_ACCOUNT`.

### Qué necesita cada workflow

| Workflow | Cuándo corre | Secrets |
|---|---|---|
| [`ci.yml`](./.github/workflows/ci.yml) | Cada push y PR | **Ninguno** |
| [`deploy.yml`](./.github/workflows/deploy.yml) | Manual (`workflow_dispatch`) | Environment `production` |

CI no necesita secrets porque `pnpm lint`, `pnpm test` y `pnpm build` pasan sin
variables de entorno: las pruebas traen su propia configuración falsa y
`import.meta.env` solo se lee en el navegador. Eso además permite que un PR desde
un fork se verifique igual, sin exponerle nada.

El deploy sí las necesita: Vite las incrusta en el bundle en tiempo de build, y
si falta una la app arranca con pantalla en blanco. Por eso el workflow verifica
que estén completas **antes** de construir.

### El environment `production`

Los valores viven en el environment `production`, no en secrets del repositorio.
Eso da historial de despliegues en GitHub y permite exigir revisores desde
*Settings → Environments → production → Required reviewers* sin tocar el
workflow.

| Secret | Estado | Notas |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | También es el destino del deploy |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | |
| `VITE_FIREBASE_APP_ID` | ✅ | |
| `VITE_FIREBASE_MEASUREMENT_ID` | ✅ | Opcional: sin él Analytics queda apagado |
| `VITE_AUTH_USERNAME_DOMAIN` | ✅ | Ver la advertencia abajo |
| `FIREBASE_SERVICE_ACCOUNT` | ❌ falta | Sin esto el deploy no corre |

Para cargarlos desde tu `.env.local`:

```bash
./scripts/set-github-secrets.sh
```

La cuenta de servicio va aparte. Es la única credencial real del proyecto, así
que tiene su propio script:

```bash
gcloud auth login
./scripts/create-deploy-service-account.sh talendig-dr
```

Crea la cuenta `github-deploy@talendig-dr.iam.gserviceaccount.com`, le da
`roles/firebasehosting.admin` y `roles/firebase.viewer` —nada más—, emite una
llave y la guarda como `FIREBASE_SERVICE_ACCOUNT` en el environment. La llave
nunca se imprime: va a un archivo `chmod 600`, se canaliza a `gh`, y un `trap`
la sobrescribe y la borra en cualquier salida, incluida una interrupción.

Es idempotente: volver a correrlo salta lo que ya existe y emite una llave
nueva, que es también como se rota. Al final lista las llaves vivas de esa
cuenta para que revoques cualquiera que no reconozcas.

#### Renombrar un secret

La UI de GitHub **no renombra**: el lápiz solo cambia el valor. Renombrar es
borrar y volver a crear, y como los secrets son de solo escritura, hay que tener
el valor original a mano. Si el nuevo no llega a guardarse, el valor se pierde
del repositorio y hay que sacarlo otra vez de su origen.

#### Advertencia: `VITE_AUTH_USERNAME_DOMAIN`

Firebase Auth no tiene proveedor de usuario/contraseña, solo email/contraseña.
Como los profesores entran con un usuario simple, el servicio le pega este
dominio para armar la credencial que Firebase espera:

```
yokasta.reyes  →  yokasta.reyes@<VITE_AUTH_USERNAME_DOMAIN>
```

El dominio nunca tiene que resolver ni recibir correo; es solo un espacio de
nombres para cumplir con el formato de email. Sin el secret, la app usa
`classes.talendig.local`.

**Las cuentas en Firebase Auth tienen que crearse con exactamente ese dominio.**
Si el secret dice `classes.talendig.local` pero creas
`yokasta.reyes@talendig.com` en la consola, el login falla con «Usuario o
contraseña incorrectos» y no hay ninguna pista de por qué.

### Activar el deploy automático

`deploy.yml` viene en modo manual a propósito, para que nada se publique por
sorpresa. Cuando el proyecto de Firebase exista y los secrets estén cargados,
cambia el disparador:

```yaml
on:
  push:
    branches: [main]
```

[`firebase.json`](./firebase.json) ya trae el rewrite de SPA que necesita React
Router — sin él, recargar `/admin` devuelve 404 — más cabeceras de caché
inmutable para `/assets` y `no-cache` para `index.html`.

---

## Arquitectura

```
src/
├── app/          Raíz, rutas, guardia de sesión, composición de proveedores
├── config/       Entorno validado e inicialización del SDK de Firebase
├── features/
│   ├── auth/     Sesión: contrato, adaptador Firebase, contexto, hook
│   └── classes/  Dominio de clases: tipos, esquemas, repositorio, hooks, UI
├── pages/        Una pantalla por ruta
├── shared/       UI, hooks, utilidades, copy en español, logger, analytics
└── styles/       Tokens de diseño y hoja global
```

Las decisiones que sostienen la estructura:

- **Repositorio + adaptador.** `ClassRepository` es una interfaz; la
  implementación de Firestore es un detalle. Los componentes y hooks nunca
  importan el SDK. Cambiar de backend toca un archivo.
- **Inyección por contexto.** `AppProviders` construye las implementaciones
  concretas y las inyecta. Un test monta un subárbol con dobles sin necesidad de
  mockear módulos.
- **Errores como valores.** Los servicios devuelven `Result<T, AppError>`. Los
  fallos esperados se manejan; los inesperados los atrapa el `ErrorBoundary`.
  Ningún mensaje crudo de Firebase llega a la pantalla.
- **Validación en la frontera.** Zod valida el formulario y también cada
  documento leído de Firestore. Un documento malformado se reporta, no se pinta
  como `undefined`.
- **Cuatro estados en toda ruta asíncrona.** Cargando, con datos, vacío y error
  con reintento. El diseño los define y todos están construidos.

### Búsqueda y paginación

Firestore no tiene búsqueda de texto completo. Al escribir una clase se genera
un arreglo `keywords` con los prefijos de su nombre, profesor y código
(normalizados, sin acentos), y la consulta usa un `array-contains`. La búsqueda
es del lado del servidor e indexada: el navegador nunca descarga filas que no va
a mostrar.

La paginación usa cursores, no offsets. Una página solo es alcanzable
directamente cuando ya se conoce el cursor que la inicia, así que los números
más allá del alcance actual se muestran deshabilitados y se llega a ellos con
«Siguiente» — un clic cada uno, sin lecturas extra. El total sale de
`getCountFromServer`, una agregación del servidor que no transfiere documentos.

---

## Pruebas

```bash
pnpm test
```

247 pruebas en 26 archivos, ~91% de líneas cubiertas. Conviven con el código que
prueban (`*.test.ts` / `*.test.tsx`); los dobles compartidos están en
`src/test/doubles/`.

El principio que sostiene la suite: **sustituir, no mockear**. Como las páginas
y los hooks dependen de interfaces, las pruebas inyectan
`InMemoryClassRepository` y `FakeAuthService` por los mismos proveedores que usa
la aplicación real. `vi.mock` queda reservado para la frontera del SDK —
`firebase/auth`, `firebase/firestore`, `firebase/analytics` — donde no hay una
costura nuestra.

Qué se cubre:

| Capa | Qué se verifica |
|---|---|
| Lógica pura | Generación de keywords y su ida y vuelta contra el índice, esquema de validación, formato de fechas dominicanas, normalización de errores de Firebase |
| Repositorio | Qué restricciones de Firestore genera cada filtro, el documento extra que detecta la página siguiente, el índice de búsqueda que se reescribe en cada update |
| Adaptador de sesión | El mapeo usuario → email sintético, la derivación de nombre e iniciales, y que las credenciales nunca llegan al log |
| Hooks | Los cuatro estados asíncronos, el debounce, el reinicio de paginación al cambiar filtros, el rechazo de escrituras sin sesión |
| Pantallas | Consulta pública, login, dashboard y formularios de punta a punta, incluidos los caminos de error |

Dos defectos reales aparecieron al escribir estas pruebas y quedaron corregidos:

1. **El debounce no evitaba lecturas.** `effectiveFilters` se reconstruía en cada
   pulsación, así que el efecto de consulta se re-ejecutaba letra por letra pese
   al retardo de 300 ms. Ahora depende de los campos individuales.
2. **La pantalla de edición repetía el mismo mensaje** como título y como
   detalle cuando la clase no existía, y ofrecía un botón «Reintentar» que en
   realidad navegaba al listado.

Lo que queda sin cubrir es cableado: `App.tsx`, `router.tsx` y `AppProviders.tsx`
solo componen piezas ya probadas.

---

## Diseño

El sistema visual viene del canvas de Claude Design, archivado en
[`docs/design/talendig-classes-record.dc.html`](./docs/design/talendig-classes-record.dc.html)
(10 artboards: consulta escritorio y móvil, detalle, estados, login, dashboard,
formularios crear y editar, diálogo destructivo y style tile). El prompt que lo
generó está en [`docs/design-prompt.md`](./docs/design-prompt.md).

- **Navy `#110546`** es el ancla; **teal `#27A5B2`** es la firma y se usa con
  cuentagotas.
- Teal 500 sobre blanco da 2.7:1 y **no pasa AA para texto**, así que texto y
  enlaces usan **Teal 700 `#196A75`** (4.9:1); el teal puro queda para fondos,
  bordes e iconos.
- El anillo de foco es 2px blanco + 3px teal 500 en todo elemento interactivo.
- Los tokens viven en `src/styles/tokens.css`. **No se escriben hex en los
  componentes.**

### Tipografía

La marca es **Gotham**, que es licenciada y no tiene distribución web gratuita.
El stack declarado es `Gotham, "Montserrat", "Poppins", system-ui, sans-serif` y
la interfaz está diseñada sobre Montserrat. Si Talendig adquiere la licencia,
basta con poner los `woff2` en `public/fonts` y declarar el `@font-face` en
`src/styles/index.css`.

### Logo

`public/brand/talendig-logo.png` (navy, sobre claro) y
`talendig-logo-white.png` (sobre navy `#110546`), ambos descargados del sitio
oficial. No se estiran, no se recolorean y no se colocan sobre teal.

### Desviación deliberada del diseño

El campo **Profesor** del formulario aparece como desplegable en el artboard,
pero está implementado como input con `<datalist>`: sugiere los profesores ya
registrados y permite escribir uno nuevo. Con una lista cerrada sería imposible
crear la primera clase, y cada profesor nuevo sería un cambio de código.

---

## Estado

Construido y verificado contra el diseño: consulta pública (escritorio y móvil),
hoja de filtros, estado vacío, tabla de resultados, panel de detalle, login con
error de credenciales, dashboard administrativo, paginación, formulario de
creación con validación inline y diálogo de eliminación.

`pnpm build`, `pnpm lint` y `pnpm test` pasan limpios.

Pendiente antes de producción:

- [x] Publicar el repositorio en GitHub
- [x] Cargar la config de Firebase en el environment `production`
- [x] Crear la cuenta de servicio y su llave (`FIREBASE_SERVICE_ACCOUNT`)
- [x] Desplegar a Firebase Hosting — **https://talendig-dr.web.app**
- [x] Crear la base de datos de Firestore (`us-east1`, Native mode)
- [x] Publicar reglas e índices de Firestore
- [ ] Restringir la API key web a `talendig-dr.web.app` y a los dominios de
      Talendig, en Google Cloud Console → *Credentials*
- [ ] Crear las cuentas de los profesores en Firebase Auth, como
      `usuario@classes.talendig.local` (habilitar el proveedor Email/Password)
- [ ] Cargar el histórico de clases existente
- [ ] Cambiar `deploy.yml` a disparo por push en `main`
