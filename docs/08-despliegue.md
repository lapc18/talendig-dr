# 8. Despliegue

**Producción:** https://talendig-dr.web.app
**Proyecto Firebase:** `talendig-dr` · **Repositorio:** `lapc18/talendig-dr`

## Los dos workflows

| Workflow | Cuándo corre | Secrets |
|---|---|---|
| [`ci.yml`](../.github/workflows/ci.yml) | Cada push y PR | **Ninguno** |
| [`deploy.yml`](../.github/workflows/deploy.yml) | Manual (`workflow_dispatch`) | Environment `production` |

### Por qué CI no lleva secrets

Porque no los necesita: `pnpm lint`, `pnpm test` y `pnpm build` pasan sin
ninguna variable de entorno. Las pruebas traen su configuración falsa y
`import.meta.env` solo se lee en el navegador, no al compilar.

Eso además permite que un PR desde un fork se verifique igual, sin exponerle
nada.

### Por qué deploy sí

Vite **incrusta** las variables en el bundle al compilar. Si falta una, la app
arranca con pantalla en blanco. Por eso el workflow verifica que estén completas
**antes** de construir, y falla ahí en vez de publicar algo roto.

## Los secrets

Viven en el environment `production` de GitHub, no como secrets del repositorio.
Eso da historial de despliegues y permite exigir revisores sin tocar el workflow.

| Secret | Notas |
|---|---|
| `VITE_FIREBASE_API_KEY` | |
| `VITE_FIREBASE_AUTH_DOMAIN` | |
| `VITE_FIREBASE_PROJECT_ID` | También es el destino del deploy |
| `VITE_FIREBASE_STORAGE_BUCKET` | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | |
| `VITE_FIREBASE_APP_ID` | |
| `VITE_FIREBASE_MEASUREMENT_ID` | Opcional: sin él Analytics queda apagado |
| `VITE_AUTH_USERNAME_DOMAIN` | El dominio del login |
| `FIREBASE_SERVICE_ACCOUNT` | **La única credencial real** |

### La config web de Firebase no es secreta

Las `VITE_FIREBASE_*` se compilan dentro del bundle: cualquiera las lee abriendo
las herramientas de desarrollo. Google lo documenta así — es un identificador de
proyecto, no una credencial.

Guardarlas como secrets sirve para separar ambientes y no versionar valores,
**no como medida de seguridad**. Lo que de verdad protege los datos:

1. [`firestore.rules`](../firestore.rules)
2. Restringir la API key a los dominios de Talendig, en Google Cloud Console
3. App Check, si más adelante hace falta

## Los scripts

```bash
./scripts/set-github-secrets.sh              # sube .env.local al environment
./scripts/create-deploy-service-account.sh talendig-dr
```

El segundo crea `github-deploy@talendig-dr.iam.gserviceaccount.com` con solo dos
roles —`firebasehosting.admin` y `firebase.viewer`—, emite una llave y la guarda.
La llave nunca se imprime: archivo `chmod 600`, se canaliza a `gh`, y un `trap`
la sobrescribe y borra en cualquier salida.

Es idempotente: volver a correrlo rota la llave.

## Hosting

[`firebase.json`](../firebase.json):

- **Rewrite de SPA**: todo va a `index.html`. Sin él, recargar `/admin` da 404.
- **`/assets/**` → `immutable`** un año: los nombres llevan hash de contenido.
- **Todo lo demás → `no-cache`**: el shell tiene que revalidar siempre.

> Cuidado con los headers: **matchean el path que se pide, no el reescrito.**
> Una regla sobre `/index.html` nunca se dispara, porque nadie pide
> `/index.html` — piden `/` y `/admin`. Eso ya nos costó un bug: el shell se
> servía con `max-age=3600` y un despliegue tardaba una hora en llegar.

## Publicar reglas e índices

No van en el deploy de la app:

```bash
pnpm dlx firebase-tools deploy --only firestore:rules,firestore:indexes --project talendig-dr
```

> Las reglas tardan **uno o dos minutos** en propagarse. Si justo después ves
> «Missing or insufficient permissions», espera y reintenta antes de buscar el
> bug en otra parte.

## Activar el deploy automático

Está en manual a propósito. Cuando quieras, cambia el disparador:

```yaml
on:
  push:
    branches: [main]
```

## Base de datos

Firestore en **`us-east1`** (Carolina del Sur), modo Native. **La ubicación es
permanente**: cambiarla exige otro proyecto.

## Lo siguiente

[Recetas](./09-recetas.md).
