# 5. Interfaz

## La regla de oro

**Nunca escribas un color hexadecimal en un componente.**

Todos los colores, tipografías, radios y sombras están en
[`src/styles/tokens.css`](../src/styles/tokens.css) y se usan como utilidades de
Tailwind.

```tsx
<div className="bg-navy-900 text-white" />   // ✅
<div style={{ background: "#110546" }} />    // ❌
```

Está en la definición de «hecho» de [`CLAUDE.md`](../CLAUDE.md).

## La paleta

**Navy es el ancla. Teal es la firma y se usa con cuentagotas.**

| Escala | Para qué |
|---|---|
| `navy-50` … `navy-950` | Fondos oscuros, botones primarios, títulos |
| `teal-50` … `teal-800` | CTAs secundarios, foco, chips activos |
| `ink-50` … `ink-700` | Neutros con tinte azulado |
| `danger`, `success`, `warning` | Semánticos, subordinados a la marca |

### El detalle de accesibilidad que tienes que conocer

**Teal 500 (`#27A5B2`) sobre blanco da 2.7:1 y no pasa AA para texto.**

Por eso:

- Texto y enlaces usan **`teal-700` (`#196A75`)**, que da 4.9:1.
- `teal-500` queda para **fondos, bordes, iconos y anillos de foco**.

Si escribes `text-teal-500` estás creando un problema de accesibilidad.

## Tipografía

La marca es **Gotham**, que es licenciada y no tiene distribución web gratuita.
El stack declarado cae a Montserrat:

```css
--font-sans: Gotham, "Montserrat", "Poppins", system-ui, sans-serif;
```

Si algún día se compra la licencia: los `woff2` a `public/fonts`, el
`@font-face` en [`index.css`](../src/styles/index.css), y no se toca nada más.

La escala (`text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`,
`text-small`, `text-caption`) ya trae tamaño, interlineado, tracking y peso.
`text-h1` es suficiente; no le agregues `font-bold`.

## El anillo de foco

Uno solo, global, en [`index.css`](../src/styles/index.css):

```css
:focus-visible {
  box-shadow: 0 0 0 3px #fff, 0 0 0 6px var(--color-teal-500);
}
```

**No lo quites en un componente.** Los formularios sí lo sustituyen por un
tratamiento más ceñido, en [`controlStyles.ts`](../src/shared/components/ui/controlStyles.ts).

## El catálogo de componentes

Todos en [`src/shared/components/ui/`](../src/shared/components/ui/).

| Componente | Cuándo |
|---|---|
| [`Button`](../src/shared/components/ui/Button.tsx) | Cualquier acción. 6 variantes, 3 tamaños, estado de carga |
| [`Input`](../src/shared/components/ui/Input.tsx) / [`Textarea`](../src/shared/components/ui/Textarea.tsx) / [`Select`](../src/shared/components/ui/Select.tsx) | Controles de formulario |
| [`Field`](../src/shared/components/ui/Field.tsx) | Envuelve un control con label, ayuda y error |
| [`SearchInput`](../src/shared/components/ui/SearchInput.tsx) | Caja de búsqueda con lupa |
| [`Badge`](../src/shared/components/ui/Badge.tsx) | Código de clase |
| [`Alert`](../src/shared/components/ui/Alert.tsx) | Mensaje en línea |
| [`Dialog`](../src/shared/components/ui/Dialog.tsx) | Modal centrado |
| [`Drawer`](../src/shared/components/ui/Drawer.tsx) | Panel lateral; hoja inferior en teléfono |
| [`EmptyState`](../src/shared/components/ui/EmptyState.tsx) / [`ErrorState`](../src/shared/components/ui/ErrorState.tsx) | Estados vacío y de error |
| [`Skeleton`](../src/shared/components/ui/Skeleton.tsx) | Carga |
| [`Pagination`](../src/shared/components/ui/Pagination.tsx) | Navegación entre páginas |
| [`Spinner`](../src/shared/components/ui/Spinner.tsx) | Indicador dentro de botones |

**Antes de crear un componente nuevo, revisa esta lista.** Casi siempre lo que
necesitas es una variante de uno que ya existe, no uno nuevo — es la **O** de
SOLID.

## `Field`: por qué recibe una función

`Field` no recibe el control como hijo normal, sino como función:

```tsx
<Field label="Código de clase" isRequired errorMessage={errors.code?.message}>
  {(control) => <Input isMonospaced {...control} {...register("code")} />}
</Field>
```

Porque `Field` genera el `id`, decide el `aria-describedby` y calcula
`aria-invalid`, y necesita entregárselos al control. Así ningún formulario
repite ese cableado de accesibilidad, y no se puede olvidar.

## Los diálogos usan `<dialog>` nativo

[`Dialog`](../src/shared/components/ui/Dialog.tsx) y
[`Drawer`](../src/shared/components/ui/Drawer.tsx) usan el elemento `<dialog>`
del navegador, manejado por [`useModalDialog`](../src/shared/hooks/useModalDialog.ts).

La plataforma da gratis: atrapar el foco, devolverlo al cerrar, inertizar la
página de atrás y cerrar con Escape. Un modal hecho a mano tiene que
reimplementar todo eso y normalmente lo hace mal.

> jsdom no implementa `showModal()`, así que
> [`src/test/setup.ts`](../src/test/setup.ts) trae un polyfill mínimo con solo
> lo que estos componentes usan.

## Responsive

Sin listeners de ancho: **CSS decide**. Las dos vistas están en el DOM y se
alternan con clases.

| Ancho | Consulta | Administración |
|---|---|---|
| `< lg` (1024) | Cards apiladas | Cards con acciones al pie |
| `≥ lg` | Tabla | Tabla |
| `< sm` (640) | `Drawer` = hoja inferior con handle | |
| `≥ sm` | `Drawer` = panel lateral de 520px | |

Verificado sin desbordamiento horizontal en 320, 375, 667, 768, 1024 y 1440.

Cuando toques layout, revisa además el **teléfono en horizontal** (667×375). Es
donde aparecen los problemas: no de ancho, sino de alto — acciones que quedan
fuera de alcance.

## El copy en español

Todos los textos visibles están en
[`src/shared/i18n/copy.ts`](../src/shared/i18n/copy.ts). Español nunca en
identificadores.

```tsx
<h1>{COPY.publicSearch.title}</h1>   // ✅
<h1>Histórico de clases</h1>         // ❌
```

## Lo siguiente

[Errores](./06-errores.md).
