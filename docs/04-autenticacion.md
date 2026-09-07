# 4. Autenticación

## El problema de origen

El requisito era **usuario y contraseña**. Firebase Authentication no tiene
proveedor de usuario: solo email y contraseña.

## La solución

El servicio le pega un dominio al usuario para armar la credencial que Firebase
sí acepta. Una función, en
[`firebaseAuthService.ts`](../src/features/auth/services/firebaseAuthService.ts):

```ts
function toAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${env.authUsernameDomain}`;
}
```

```
El profesor escribe:   yokasta.reyes
Firebase recibe:       yokasta.reyes@talendig.local
```

El dominio **nunca tiene que existir, resolver DNS ni recibir correo**. Es solo
un espacio de nombres para cumplir el formato de email.

Es configurable (`VITE_AUTH_USERNAME_DOMAIN`) para que ambientes distintos no
choquen y para que, si algún día Talendig quiere correos reales, sea cambiar una
variable.

## Las dos reglas que tienes que recordar

**1. En el formulario se escribe solo el usuario.**

| En la consola de Firebase creas | En el formulario se escribe |
|---|---|
| `yokasta.reyes@talendig.local` | `yokasta.reyes` |

Si escribes el correo completo, la app le vuelve a pegar el dominio y queda
`yokasta.reyes@talendig.local@talendig.local`. Falla siempre.

**2. Las cuentas se crean con exactamente el dominio configurado.**

Si `VITE_AUTH_USERNAME_DOMAIN` dice `talendig.local` pero creas la cuenta como
`yokasta@talendig.com`, el login falla para todos.

Ese fallo es difícil de diagnosticar porque el mensaje es genérico a propósito
(ver abajo). La pista está en la consola del navegador: un intento fallido
registra el dominio que la app está usando.

```
[talendig] Sign-in attempt failed { accountDomain: "talendig.local" }
```

## No hay registro público

Las cuentas las crea un administrador en la consola de Firebase. La app no tiene
pantalla de alta. Es a propósito: los profesores son un grupo cerrado.

## Por qué el mensaje de error es siempre el mismo

Contraseña incorrecta y usuario inexistente devuelven **el mismo texto**:
«Usuario o contraseña incorrectos.»

Es deliberado. Si dijéramos «ese usuario no existe», cualquiera podría probar
nombres y averiguar quién tiene cuenta. El mapeo está en
[`errors.ts`](../src/shared/lib/errors.ts):

```ts
"auth/invalid-credential": "auth/invalid-credentials",
"auth/user-not-found":     "auth/invalid-credentials",
"auth/wrong-password":     "auth/invalid-credentials",
"auth/user-disabled":      "auth/invalid-credentials",
```

Cuatro códigos distintos de Firebase, un solo mensaje.

Hay una prueba que lo fija, en
[`errors.test.ts`](../src/shared/lib/errors.test.ts): *«maps %s to a single
message, so no code reveals whether a user exists»*.

## Las piezas

| Archivo | Qué hace |
|---|---|
| [`authService.ts`](../src/features/auth/services/authService.ts) | El contrato: `signIn`, `signOut`, `observeSession` |
| [`firebaseAuthService.ts`](../src/features/auth/services/firebaseAuthService.ts) | La implementación con Firebase |
| [`authContext.ts`](../src/features/auth/context/authContext.ts) | La definición del contexto |
| [`AuthProvider.tsx`](../src/features/auth/context/AuthProvider.tsx) | Sostiene la sesión y expone entrar/salir |
| [`useAuth.ts`](../src/features/auth/hooks/useAuth.ts) | Cómo un componente lee la sesión |
| [`ProtectedRoute.tsx`](../src/app/ProtectedRoute.tsx) | Redirige a `/acceso` si no hay sesión |

## `isInitialising`: por qué existe

Firebase restaura la sesión **de forma asíncrona** al cargar la página. Durante
ese instante todavía no sabemos si hay sesión o no.

Si `ProtectedRoute` redirigiera en ese momento, un profesor autenticado que
recarga `/admin` saldría rebotado al login antes de que Firebase respondiera.

Por eso el guardia tiene tres estados, no dos:

```tsx
if (isInitialising) return <div className="min-h-dvh bg-ink-50" aria-busy="true" />;
if (user === null)  return <Navigate to={ROUTES.login} replace />;
return children;
```

El primero renderiza un marco vacío: ni la página ni el login.

## Del nombre a las iniciales

El avatar del header muestra `YR` para «Yokasta Reyes». Eso se deriva en
[`firebaseAuthService.ts`](../src/features/auth/services/firebaseAuthService.ts):

1. Si el administrador puso un `displayName` en Firebase, se usa ese.
2. Si no, se deriva del usuario: `yokasta.reyes` → `Yokasta Reyes`.
3. Las iniciales son las primeras letras de las dos primeras palabras.

## Lo que nunca se registra

El log de un intento fallido **no lleva ni usuario ni contraseña**:

```ts
logger.warn("Sign-in attempt failed", { accountDomain: env.authUsernameDomain });
```

El dominio sí, porque es público (viaja en el bundle) y es el dato que delata el
error de configuración más común.

## Lo siguiente

[Interfaz](./05-interfaz.md).
