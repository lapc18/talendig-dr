# Prompt para Claude Design — Talendig Classes Record

> Cómo usarlo: en Claude Code / Claude.ai ejecuta el skill `design` y pega todo el bloque de abajo.
> Adjunta también las imágenes de `public/brand/` (logo navy, logo blanco) si la sesión lo permite.

---

Crea un design canvas para **Talendig Classes Record**, una app web interna de Talendig
(comunidad dominicana de talento y tecnología) para registrar y consultar el histórico de
clases impartidas. Toda la UI va **en español**.

## Sistema de diseño (obligatorio, no lo cambies)

**Colores de marca**
- Navy primario `#110546` — fondos oscuros, header, botones primarios, títulos
- Teal acento `#27A5B2` — CTAs secundarios, links, chips activos, foco, badges
- Blanco `#FFFFFF` — superficie principal
- Deriva del navy y del teal una escala 50–900 para bordes, hovers y fondos suaves
  (ej. navy-50 `#F2F1F7`, teal-50 `#E9F6F8`) en vez de inventar grises fríos random.
- Neutros: usa grises con un tinte azulado sutil para que peguen con el navy.
- Semánticos: éxito, advertencia y error discretos, subordinados a la marca — que nunca
  compitan con el teal.

**Tipografía**
- Familia de marca: **Gotham** (geométrica sans). Como Gotham es licenciada, especifica el
  stack `Gotham, "Montserrat", "Poppins", system-ui, sans-serif` y diseña con Montserrat.
- Titulares en peso Bold/Black, bastante tight en tracking. Cuerpo en Regular/Medium.
- Define una escala tipográfica explícita (display, h1–h3, body, small, caption) con tamaños
  y line-heights concretos.

**Logo**
- `public/brand/talendig-logo.png` — wordmark navy, sobre fondos claros
- `public/brand/talendig-logo-white.png` — wordmark blanco, sobre navy `#110546`
- No lo estires, no lo recolorees fuera de esas dos variantes, respeta un margen de
  protección igual a la altura de la "T".

**Lenguaje visual**
- Limpio, con aire, un punto institucional-educativo pero moderno. Cards con esquinas
  redondeadas (radio consistente, ~12–16px), sombras suaves y de baja opacidad.
- El navy es el ancla; el teal aparece **poco y con intención** (esa es la firma de marca).
- Densidad de datos legible: la pantalla de consulta se usa a diario para buscar, tiene que
  escanearse rápido.

## Modelo de datos (una clase)

| Campo | Tipo | Notas |
|---|---|---|
| `fecha` | fecha | día en que se impartió la clase |
| `classCode` | texto corto | ej. `DEV-101`, se muestra como badge monoespaciado |
| `className` | texto | nombre de la clase / tema |
| `profesor` | texto | nombre del docente |
| `link` | URL | grabación o material — se abre en pestaña nueva |
| `comentario` | texto largo | opcional, notas de la sesión |

## Artboards que necesito

**Público (sin autenticación) — la parte de consulta que usan profesores y estudiantes**

1. **Consulta / Búsqueda — desktop.** Header navy con logo blanco y un botón discreto de
   "Acceso docente". Un buscador prominente (busca por nombre, código o profesor) con
   filtros: rango de fechas, profesor, código de clase. Resultados en tabla/cards
   mostrando los 6 campos, con el link como botón de "Ver grabación". Muestra el estado
   con ~8 resultados y contador tipo "24 clases encontradas".
2. **Consulta / Búsqueda — mobile (390px).** Misma pantalla adaptada: filtros colapsados en
   un bottom sheet o acordeón, resultados como cards apiladas.
3. **Detalle de clase.** Modal o panel lateral con toda la información de una clase,
   incluyendo el comentario completo.
4. **Estado vacío** de la búsqueda ("No encontramos clases con esos criterios") + variantes
   de **loading** (skeletons) y **error de conexión**.

**Privado (autenticado) — el CRUD administrativo**

5. **Login.** Pantalla centrada sobre fondo navy con el logo blanco. Campos usuario y
   contraseña, botón primario, mensaje de error de credenciales inválidas.
6. **Dashboard / Listado de clases.** Tabla administrativa con búsqueda, ordenamiento por
   fecha, paginación, botón primario "Nueva clase", y acciones por fila (editar, eliminar).
   Incluye una barra superior con el usuario logueado y "Cerrar sesión".
7. **Formulario de clase (crear).** Los 6 campos con labels, helper text, validación
   inline visible (ej. link con formato inválido, campos requeridos) y botones
   Guardar / Cancelar.
8. **Formulario de clase (editar)** con datos precargados.
9. **Confirmación de eliminación.** Diálogo destructivo que nombra la clase que se va a
   borrar.
10. **Hoja de estilos / style tile.** Un artboard final documentando: paleta con hex,
    escala tipográfica, botones en todos sus estados (default, hover, active, disabled,
    loading), inputs (default, focus, error, disabled), badges de código de clase, y el
    uso correcto de ambas variantes del logo.

## Restricciones

- Diseña **desktop primero** salvo donde pido mobile explícitamente, pero deja claro cómo
  colapsa cada layout.
- Todo el texto de la UI en español dominicano neutro y profesional; nada de lorem ipsum —
  usa nombres de clases y profesores plausibles (ej. "Fundamentos de React", "Introducción
  a Python", profesores con nombres dominicanos).
- Contraste accesible AA: cuidado especial con el teal `#27A5B2` sobre blanco para texto
  pequeño — si no pasa, úsalo solo en fondos, bordes e iconografía y oscurece la variante
  de texto.
- Estados de foco visibles en todo elemento interactivo (se va a usar mucho con teclado).
- No inventes campos ni pantallas fuera de esta lista.
