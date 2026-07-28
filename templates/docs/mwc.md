---
name: mwc
description: Implements components from the maxi-web-components library in React, Angular or Vanilla JS projects. Use when the user wants to add, install or use components like ms-button, ms-table, ms-dropdown, ms-calendar, ms-input-field, ms-dialog, ms-chart, ms-carousel, ms-accordion, ms-tabs, ms-navbar, ms-sidebar, ms-chips, ms-autocomplete, ms-multiselect, ms-file-upload, ms-gauge-chart, ms-scroll-top or any other ms-* component from the maxi library. Also use when the user mentions "maxi components", "project web components", wants to configure .npmrc for Nexus, or asks what components are available.
---

# MAXI Web Components — Complete Reference

> UI component library built with [Stencil.js](https://stenciljs.com/), distributed as three separate packages for use in Vanilla JS, React and Angular. Current version: **9.0.0**.

---

## ⚠️ Excepciones ZEUS — single-spa + React 17

Estos patrones son **obligatorios** en microfrontends ZEUS. Los componentes que usan portales o manipulan `document.body` directamente pueden causar el error `NotFoundError: removeChild` si se montan/actualizan mientras single-spa gestiona el ciclo de vida del microfrontend.

### `MsDialog` — nunca renderizar antes de tener los datos

**Problema**: `MsDialog` adjunta un overlay a `document.body` al montarse. Si el componente se monta con `visible=true` y luego React hace un re-render (p. ej. porque un `useEffect` resuelve y llama a `setState`), el overlay queda en un estado inconsistente con el árbol de React → `removeChild` error.

**Patrón correcto en ZEUS:**

```jsx
// ✅ CORRECTO — MsDialog se monta UNA SOLA VEZ con todos los datos listos
const [visible, setVisible] = useState(false);  // empieza oculto
const [data, setData] = useState("");

useEffect(() => {
  fetchData()
    .then((result) => setData(result))
    .finally(() => setVisible(true));  // muestra DESPUÉS de tener los datos
}, []);

if (!visible) return null;  // no renderiza nada hasta que haya datos

return (
  <MsDialog visible header="..." onHide={() => setVisible(false)}>
    <p>{data}</p>
  </MsDialog>
);
```

```jsx
// ❌ INCORRECTO — monta el dialog antes de tener datos, luego re-renderiza
const [visible] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  fetchData().then(setData);  // re-render mientras MsDialog ya está en el DOM → crash
}, []);

return (
  <MsDialog visible={visible}>
    {data === null ? <MsSpinner /> : <p>{data}</p>}
  </MsDialog>
);
```

**Componentes afectados por este patrón**: `MsDialog`, potencialmente `MsSidebar` y otros que usen portales internos.

---

### `MsDialog` — scroll lock robusto ante múltiples diálogos y otros modales

`MsDialog` bloquea el scroll general de la página (`<html>` y `<body>`) mientras cualquier instancia esté `visible`, usando un contador de referencias compartido entre **todas** las instancias — soporta diálogos simultáneos/en secuencia sin desbloquear el scroll hasta que cierre el último. El bloqueo se hace agregando/quitando una clase CSS propia (`ms-dialog-scroll-lock`, definida en `global.css`/`global-zeclio.css`), **nunca** leyendo ni escribiendo el `overflow` inline directamente — así que convive de forma segura con cualquier otro bloqueador de scroll independiente que ya exista en el microfront (por ejemplo el `Modal`/`Offcanvas` de `react-bootstrap`, usado en varios microfronts de ZEUS).

> Si ves el scroll general "atascado" después de cerrar un diálogo, o que no se bloquea al abrir uno, verifica primero que el CSS del proyecto (`global.css`/`global-zeclio.css`) esté reconstruido — no solo el JS/TSX del componente. Ambos deben regenerarse juntos.

---

### `MsTable` — siempre usar `size="small"`

El default del componente es `size="normal"`, pero en ZEUS todos los usos deben ser `size="small"`.

```tsx
// ✅ CORRECTO en ZEUS
<MsTable columns={columns} data={rows} size="small" />

// ❌ INCORRECTO — el default 'normal' produce filas demasiado altas
<MsTable columns={columns} data={rows} />
```

---

### `MsTable` — elementos clicables en celdas: obligatorio `class="ms-table-actions"`

Cuando una celda contiene elementos clicables (botones, íconos, links, menús), el click del elemento **también dispara `rowClick`** de la fila (o el toggle de `expandableRow`). Para evitarlo, el contenedor de acciones **debe** llevar la clase `ms-table-actions`.

El componente tiene este guard en su handler de fila (fuente: `ms-table.tsx`):

```tsx
if (target.closest('.ms-table-actions')) {
  return; // cancela rowClick / expand
}
```

```tsx
// ✅ CORRECTO — el click en el botón NO dispara rowClick
render: (row) => (
  <div class="ms-table-actions">
    <MsButton label="Editar" onClickEvent={() => openEdit(row)} />
    <MsButton label="Eliminar" variant="danger" onClickEvent={() => openDelete(row)} />
  </div>
)

// ❌ INCORRECTO — el click en el botón también dispara rowClick de la fila
render: (row) => (
  <div>
    <MsButton label="Editar" onClickEvent={() => openEdit(row)} />
  </div>
)
```

Aplica a: `MsButton`, íconos clicables, `<a>`, `MsDropdown`, cualquier elemento con `onClick`/`onClickEvent` dentro de una columna `render`.

---

### `MsDialog` — contenido condicional: usar `key` para forzar remount

Cuando el contenido de un `MsDialog` depende de datos que cambian entre aperturas (ej: un modal de edición que muestra distintos registros según cuál se seleccionó en una tabla), React reutiliza la instancia existente del componente y el contenido interno queda desactualizado.

**Solución:** agregar `key` igual al identificador del dato que cambia. React destruye y remonta el componente cuando `key` cambia, forzando un render limpio.

```tsx
// ✅ CORRECTO — key fuerza remount cuando cambia el registro seleccionado
<MsDialog
  key={selectedUser?.id}
  visible={visible}
  header="Editar usuario"
  onHide={() => setVisible(false)}
>
  <MsInputField label="Nombre" value={selectedUser?.name} />
</MsDialog>

// ❌ INCORRECTO — sin key, React reutiliza la instancia y el contenido queda stale
<MsDialog visible={visible} header="Editar usuario" onHide={() => setVisible(false)}>
  <MsInputField label="Nombre" value={selectedUser?.name} />
</MsDialog>
```

**Aplica cuando:** el mismo `MsDialog` se reutiliza para distintos registros (tabla con edición por fila, listas de items editables), o cuando el contenido cambia completamente entre aperturas.

---

### `removeChild` en componentes con popup/overlay — estado de la librería

**Causa raíz:** los componentes con `shadow: false` que usan renderizado condicional (`{condition && <div>}`) para mostrar/ocultar un popup o overlay pueden lanzar `NotFoundError: Failed to execute 'removeChild' on 'Node'` cuando Stencil intenta reconciliar el vdom justo mientras un evento externo (click-outside, touchstart) todavía propaga sobre el mismo nodo.

**Patrón seguro** (usado en `MsDialog` y `MsNotification`):
```tsx
// ✅ El nodo siempre está en el DOM — Stencil nunca llama removeChild
<div class={{ 'ms-dialog-backdrop': true, 'visible': this.visible }}>
```

**Patrón problemático** — genera el error en race conditions:
```tsx
// ❌ Stencil intenta removeChild cuando condition cambia a false
{condition && <div ref={el => (this.popupRef = el)}>...</div>}
```

**Estado actual por componente:**

| Componente | Elemento afectado | Estado |
|---|---|---|
| `MsDialog` | backdrop overlay | ✅ **Corregido** — usa CSS class toggle |
| `MsNotification` | elemento completo | ✅ **Seguro** — usa CSS class toggle |
| `MsPopover` | contenido del popover | ✅ **Seguro** — usa CSS class `ms-popover-open` |
| `MsDropdown` | `ms-dropdown-menu` (×2 paths) | ⚠️ **Pendiente** — renderizado condicional + `menuRef` |
| `MsAutocomplete` | `ms-autocomplete-list` (×2 paths) | ⚠️ **Pendiente** — renderizado condicional + `listRef` |
| `MsMultiselect` | `ms-multiselect-menu` (×2 paths) | ⚠️ **Pendiente** — renderizado condicional + `menuRef` |
| `MsCalendar` | popup completo (×2 paths) | ⚠️ **Pendiente** — condicional + `calendarRef` + resize listener |
| `MsSidebar` | `ms-sidebar-overlay` | ⚠️ **Pendiente** — el panel es seguro; el overlay no |
| `MsNavbar` | submenús + toggle tooltip/button | ⚠️ **Pendiente** — condicional en submenús expandibles |
| `MsTooltip` | `ms-tooltip-content` | ⚠️ **Pendiente** — condicional (sin ref, menor riesgo) |
| `MsInputPassword` | feedback overlay | 🔵 **Bajo riesgo** — `shadow: true`, DOM gestionado solo por Stencil |

**Fix estándar para los pendientes** — reemplazar renderizado condicional por `display: none`:
```tsx
// Cambiar esto:
{this.isOpen && <div class="ms-dropdown-menu" ref={el => (this.menuRef = el)}>...</div>}

// Por esto:
<div
  class="ms-dropdown-menu"
  ref={el => (this.menuRef = el)}
  style={{ display: this.isOpen ? undefined : 'none' }}
>
  ...
</div>
```
Y agregar guard en métodos que usen los refs de posición:
```tsx
private calculateMenuPosition() {
  if (!this.isOpen || !this.menuRef) return;  // guard
  ...
}
```

---

### CSS global en ZEUS — ya incluido en `@maxi/styleguide`

**No importar** `global.css` ni `global-zeclio.css` en ningún microfrontend ZEUS. El módulo `@maxi/styleguide` importa `global-zeclio.css` al arrancar el single-spa, antes de que cualquier app se monte. Todas las variables `--maxi-*` ya están disponibles en el DOM.

```tsx
// ❌ INCORRECTO en ZEUS — doble importación, puede generar conflictos
import "maxi-web-components/global.css";
import "maxi-web-components/global-zeclio.css";

// ✅ CORRECTO en ZEUS — no agregar nada en main.tsx / index.tsx
```

Para overrides de variables o clases internas, ver [Sección 3 — CSS variables reference](#3-theming-system-and-css-variables).

---

---

## Table of Contents

1. [General architecture](#1-general-architecture)
2. [Installation](#2-installation)
   - [Configure Nexus registry](#21-configure-nexus-registry)
   - [Vanilla JS / Web Components](#22-vanilla-js--web-components)
   - [React](#23-react)
   - [Angular](#24-angular)
3. [Theming system and CSS variables](#3-theming-system-and-css-variables)
4. [Icon system](#4-icon-system)
5. [Common types and interfaces](#5-common-types-and-interfaces)
6. [Components — Complete reference](#6-components--complete-reference)
   - [Forms](#61-forms)
   - [Selection](#62-selection)
   - [Navigation and layout](#63-navigation-and-layout)
   - [Display / Visualization](#64-display--visualization)
   - [Interactive and complex](#65-interactive-and-complex)
   - [Feedback and progress](#66-feedback-and-progress)
   - [Utilities](#67-utilities)
   - [New in 8.0.2](#68-new-in-802)
7. [Advanced patterns](#7-advanced-patterns)
8. [Storybook](#8-storybook)

---

## 1. General architecture

```
maxi-libs/web-components/
├── core/                        # Stencil JS source → publishes: maxi-web-components
├── react/                       # Auto-generated React wrappers → publishes: maxi-react-components
└── angular-workspace/
    └── projects/
        └── maxi-angular-components/   # Angular directives → publishes: maxi-angular-components
```

- **`maxi-web-components`** — The base package. Contains native Custom Elements (standard Web Components). **Included as a dependency** inside `maxi-react-components` and `maxi-angular-components`, so it does not need to be installed separately when using those wrappers. Only install directly for Vanilla JS projects.
- **`maxi-react-components`** — React proxies auto-generated by `@stencil/react-output-target`. Includes `maxi-web-components` and handles Custom Element registration internally.
- **`maxi-angular-components`** — Angular directives auto-generated by `@stencil/angular-output-target`. Includes `maxi-web-components` and handles Custom Element registration internally.

> **Important:** all three packages are published to Nexus (private npm registry). They are not available in the public npmjs.com registry.

---

## 2. Installation

### 2.1 Configure Nexus registry

Before installing any package, point the registry to the private Nexus. Create or edit `.npmrc` at the project root:

```ini
# .npmrc
registry=https://artifacts.maxilabs.net/repository/npm-group/
//artifacts.maxilabs.net/repository/npm-group/:_authToken=<TOKEN>
```

Replace `<TOKEN>` with the access token provided by the infrastructure team.

---

### 2.2 Vanilla JS / Web Components

```bash
npm install maxi-web-components
```

**Register components and load styles in the entry point:**

```html
<!-- Option A: ESM script directly in HTML -->
<script type="module">
  import { defineCustomElements } from "maxi-web-components/loader";

  defineCustomElements();
</script>

<!-- Global CSS (base theme or Zeclio theme) -->
<link rel="stylesheet" href="node_modules/maxi-web-components/global.css" />
```

```javascript
// Option B: In a bundler (Webpack, Vite, etc.)
import { defineCustomElements } from "maxi-web-components/loader";
import "maxi-web-components/global.css";

// base theme
// import "maxi-web-components/global-zeclio.css"; // Zeclio theme (alternative)

defineCustomElements();
```

**Usage in HTML:**

```html
<ms-button label="Save" variant="primary"></ms-button>
<ms-input-field label="Name" placeholder="Enter your name"></ms-input-field>
```

**Listening to events:**

```javascript
const btn = document.querySelector("ms-button");
btn.addEventListener("clickEvent", (e) => {
  console.log("Click:", e.detail);
});
```

---

### 2.3 React

```bash
npm install maxi-react-components
```

> `maxi-web-components` is included inside `maxi-react-components`. There is no need to install it separately or call `defineCustomElements()` — the wrapper handles it internally.

**Import the global CSS in the entry point (`main.tsx` / `index.tsx`):**

```tsx
import "maxi-web-components/global.css";

// base theme
// import "maxi-web-components/global-zeclio.css"; // Zeclio theme (alternative)
```

**Using components:**

```tsx
import { MsButton, MsDropdown, MsInputField } from "maxi-react-components";

function MyForm() {
  return (
    <div>
      <MsInputField
        label="Name"
        placeholder="Enter your name"
        onInputEvent={(e) => console.log(e.detail)}
      />
      <MsButton
        label="Save"
        variant="primary"
        onClickEvent={() => console.log("saved")}
      />
    </div>
  );
}
```

> **Events in React:** component events are exposed as props with the `on` prefix. For example: `clickEvent` → `onClickEvent`, `selected` → `onSelected`, `validationChange` → `onValidationChange`.

**Passing objects/arrays as props:**

```tsx
const options = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
];

<MsDropdown
  options={options}
  value="1"
  onSelected={(e) => console.log(e.detail)}
/>;
```

---

### 2.4 Angular

```bash
npm install maxi-angular-components
```

> `maxi-web-components` is included inside `maxi-angular-components`. There is no need to install it separately or call `defineCustomElements()` — the wrapper handles it internally.

**Import the module in `app.module.ts`:**

```typescript
import { MaxiAngularComponentsModule } from "maxi-angular-components";

@NgModule({
  imports: [MaxiAngularComponentsModule],
})
export class AppModule {}
```

**For standalone applications (Angular 17+):**

```typescript
// main.ts
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";

bootstrapApplication(AppComponent);
```

```typescript
// app.component.ts
import { Component } from "@angular/core";
import {
  MsButtonComponent,
  MsInputFieldComponent,
} from "maxi-angular-components";

@Component({
  standalone: true,
  imports: [MsButtonComponent, MsInputFieldComponent],
  template: `
    <ms-input-field
      label="Name"
      [value]="name"
      (inputEvent)="onInput($event)"
    ></ms-input-field>
    <ms-button
      label="Save"
      variant="primary"
      (clickEvent)="onSave()"
    ></ms-button>
  `,
})
export class AppComponent {
  name = "";
  onInput(e: CustomEvent) {
    this.name = e.detail;
  }
  onSave() {
    console.log(this.name);
  }
}
```

**Import global styles in `angular.json`:**

```json
"styles": [
  "node_modules/maxi-web-components/global.css",
  "src/styles.scss"
]
```

> You can also import the CSS from the project's `styles.scss`:
>
> ```scss
> @import "maxi-web-components/global.css";
> // or for the Zeclio theme:
> @import "maxi-web-components/global-zeclio.css";
> ```

---

## 3. Theming system and CSS variables

The library uses CSS Custom Properties (variables) for theming, defined on `:root`. There are two available themes — **only one should be active at a time**.

| File                                    | When to use                   |
| --------------------------------------- | ----------------------------- |
| `maxi-web-components/global.css`        | Base theme (standard project) |
| `maxi-web-components/global-zeclio.css` | Zeclio theme (ZEUS)           |

> **En proyectos ZEUS — no importar nada.** El módulo `@maxi/styleguide` ya importa `global-zeclio.css` a nivel de single-spa, antes de que cualquier microfrontend se monte. Importarlo en el microfrontend genera una doble carga y puede producir conflictos.

**Ways to import the theme (standalone / non-ZEUS projects only):**

```javascript
// In JS/TS (React, bundler, Vite, Webpack)
import "maxi-web-components/global.css";
// or Zeclio theme:
import "maxi-web-components/global-zeclio.css";
```

```scss
// In SCSS / CSS
@import "maxi-web-components/global.css";
// or
@import "maxi-web-components/global-zeclio.css";
```

```json
// In angular.json → architect → build → options → styles
"styles": [
  "node_modules/maxi-web-components/global.css"
]
```

### CSS variables reference (`--maxi-*`)

Every component consumes CSS custom properties defined in `global.css` / `global-zeclio.css`. In ZEUS these variables are already available in the full DOM via the styleguide. Override them in your project's global stylesheet to change component appearance without touching component code.

**Why these variables matter — the two-tier fallback pattern.** Almost every color/spacing value inside a component's own `.css` file is written as `var(--maxi-x, <hardcoded-fallback>)`, e.g. `ms-navbar.css`: `--ms-navbar-sidebar-bg: var(--maxi-navbar-sidebar-bg, #ffffff)`. This means:
- If `--maxi-navbar-sidebar-bg` is **not** defined anywhere in the page's CSS, the component silently uses its own hardcoded fallback — nothing breaks, but you're not theming through the system.
- The moment you declare that same variable name anywhere in scope (`:root`, a parent element, or the component's own `class`), the component picks it up automatically — **you can override a variable even if it never appears in `global.css`/`global-zeclio.css`**, because the fallback pattern is what makes it overridable, not the global file. The global stylesheets only *pre-seed* the most commonly-themed ones; check the component's own `.css` source for the full list of `--maxi-<component>-*` names it actually reads if you need one that isn't in the table below.
- Prefer overriding the **semantic** tokens (`--maxi-color-primary`, `--maxi-color-action-button`, etc.) over component-specific ones whenever possible — most component tokens default to `var(--maxi-color-x)` themselves (see the table below), so one semantic override cascades everywhere instead of having to repeat it per component.

**Two themes exist — pick one, never both.** `global.css` (base/standard) and `global-zeclio.css` (ZUS/Zeclio) define the **same variable names with different values** — this is what lets the exact same component code render differently per project. Side-by-side for the core palette:

| Variable | `global.css` (base) | `global-zeclio.css` (ZEUS) |
|---|---|---|
| `--maxi-color-primary` | `#043F8F` | `#213A71` |
| `--maxi-color-secondary` | `#AAD156` | `#425CC7` |
| `--maxi-color-action-button` | `#458C44` | `#458C44` (same) |
| `--maxi-color-disabled` | `#777777` | `#F0F3F6` |
| `--maxi-color-disabled-text` | `#FFFFFF` | `#757575` |
| `--maxi-color-info` / `-text` | `#CFE2FF` / `#0252BF` | `#E7F1FF` / `#0D6EFD` |
| `--maxi-color-success` / `-text` | `#ECF4EC` / `#1A7832` | `#EDFAF3` / `#45CB85` |
| `--maxi-color-warning` / `-text` | `#FCF5EA` / `#965F0B` | `#FFF9E7` / `#FFBE0B` |
| `--maxi-color-alert` / `-text` | `#F4CFCF` / `#911E1E` | `#FEF0ED` / `#F65252` |

> Don't hardcode either column's hex values in a microfront's own CSS as "the" primary color — read `var(--maxi-color-primary)` instead, so switching themes (or the theme itself being retuned later) doesn't silently desync your custom styles from the component library's.

**Per-component override variables** (defaults shown are from `global.css`; `global-zeclio.css` overrides several of these too — check that file directly for the exact ZEUS value before assuming):

| Group | Variable | Default |
|---|---|---|
| **Inputs** | `--maxi-input-border-color` | `#E0E1E0` |
| | `--maxi-input-text-color` | `#2C2B2C` |
| | `--maxi-input-placeholder-color` | `#777777` |
| | `--maxi-input-focus-border-color` | `#006CFF` |
| | `--maxi-input-invalid-border-color` | `#C81010` |
| | `--maxi-input-label-color` | `#2C2B2C` |
| | `--maxi-input-disabled-background` / `-text-color` | `#F5F5F5` / `#777777` |
| | `--maxi-input-dropdown-hover-background` | `#E8F4EA` |
| | `--maxi-input-dropdown-active-background-color` | `#C3DF89` |
| **Checkbox / Radio** | `--maxi-checkbox-disabled-background` | `#C2C2C2` |
| | `--maxi-radio-disabled-background-color` | `#C2C2C2` |
| **Button** | `--maxi-button-primary-background` | `var(--maxi-color-primary)` |
| | `--maxi-button-primary-hover-background` | `#133787` |
| | `--maxi-button-secondary-background` | `#425CC7` |
| | `--maxi-button-success-background` | `var(--maxi-color-action-button)` |
| | `--maxi-button-warning-background` | `#F0C42B` |
| | `--maxi-button-alert-background` | `#C81010` |
| | `--maxi-button-disabled-background` / `-text-color` | `var(--maxi-color-disabled)` / `var(--maxi-color-disabled-text)` |
| | `--maxi-button-outline-<variant>-*` | transparent bg + colored border/text per variant (primary/secondary/success/warning/alert), same hover/disabled families as above |
| **Tooltip** | `--maxi-tooltip-background` | `var(--maxi-color-secondary)` |
| | `--maxi-tooltip-text-color` | `#000000` |
| | `--maxi-tooltip-font-weight` | `500` |
| **Accordion** | `--maxi-accordion-header-background` | `var(--maxi-color-secondary)` |
| | `--maxi-accordion-header-text-color` | `var(--maxi-color-primary)` |
| | `--maxi-accordion-content-text-color` | `#131313` |
| **Badge** | `--maxi-badge-info-background` / `-text-color` | `var(--maxi-color-info)` / `var(--maxi-color-info-text)` |
| | `--maxi-badge-success-background` / `-text-color` | `var(--maxi-color-success)` / `var(--maxi-color-success-text)` |
| | `--maxi-badge-warning-background` / `-text-color` | `var(--maxi-color-warning)` / `var(--maxi-color-warning-text)` |
| | `--maxi-badge-alert-background` / `-text-color` | `var(--maxi-color-alert)` / `var(--maxi-color-alert-text)` |
| | `--maxi-badge-basic-background` / `-default-background` | `var(--maxi-color-basic)` / `#F4F6F8` |
| **Table** | `--maxi-table-header-background` / `-text-color` | `#3577D2` / `var(--maxi-color-white)` |
| | `--maxi-table-header-nested-background` | `#f8f8f8` |
| | `--maxi-table-border-color` | `#b4b4b4` |
| **Paginator** | `--maxi-paginator-background` | `var(--maxi-color-white)` |
| | `--maxi-paginator-active-text-color` | `#F0F5FF` |
| **Calendar** | `--maxi-calendar-header-background` / `-text-color` | `transparent` / `#000000` |
| | `--maxi-calendar-days-background` / `-text-color` | `transparent` / `#777777` |
| | `--maxi-calendar-today-background` | `var(--maxi-color-action-button)` |
| | `--maxi-calendar-active-background-color` | `var(--maxi-color-secondary)` |
| | `--maxi-calendar-arrow-color` / `-border-color` | `#006CFF` / `var(--maxi-calendar-arrow-color)` |
| **Chips** | `--maxi-chips-background` / `-input-background` | `#F0F5FF` / `#f3f4f6` |
| | `--maxi-chips-input-text-color` / `-border-color` | `#376BCF` / `#376BCF` |
| **Menubar** | `--maxi-menubar-background` / `-text-color` | `var(--maxi-color-primary)` / `var(--maxi-color-white)` |
| | `--maxi-menubar-hover-background` / `-active-text-color` | `var(--maxi-color-secondary)` |
| **Cascade menu** | `--maxi-cascade-menu-background` / `-text-color` | `var(--maxi-color-primary)` / `var(--maxi-color-white)` |
| | `--maxi-cascade-menu-hover-background` / `-active-background` | `var(--maxi-color-secondary)` |
| **Carousel** | `--maxi-carousel-nav-background` | `var(--maxi-color-action-button)` |
| | `--maxi-carousel-indicator-background` / `-hover-background` | `#d1d5db` / `#9ca3af` |
| **Popover** | `--maxi-popover-bg` | `var(--maxi-color-white)` |
| | `--maxi-popover-border` / `-arrow-border` | `#e2e8f0` / `#cbd5e1` |
| | `--maxi-popover-shadow` | `0 4px 12px rgba(0,0,0,0.15)` |
| | `--maxi-popover-close-color` / `-hover-color` / `-hover-bg` | `#64748b` / `#334155` / `#f1f5f9` |
| **Text editor** | `--maxi-text-editor-border-color` / `-background` | `#B2BED9` / `var(--maxi-color-white)` |
| | `--maxi-text-editor-toolbar-background` | `#F2F2F2` |
| | `--maxi-text-editor-toolbar-button-hover-background` / `-active-background` | `#e5e7eb` / `#d1d5db` |
| **Timeline** | `--maxi-timeline-event-separator-marker-background` | `#6f80a7` |
| | `--maxi-timeline-event-separator-connector-background` | `#dee2e6` |
| **Breadcrumb** | `--maxi-breadcrumb-icon-width` | `14px` |
| **Global backgrounds** | `--maxi-background` | `#F2F6FC` |

**Responsive breakpoints** — the library ships its own breakpoint tokens so a microfront's own responsive CSS can stay consistent with the library's internal media queries (`ms-navbar`, `ms-paginator`, `ms-table`, etc. all key their own `@media` rules off these same pixel values):

| Variable | Value |
|---|---|
| `--maxi-breakpoint-xs` | `480px` |
| `--maxi-breakpoint-sm` | `640px` |
| `--maxi-breakpoint-md` | `768px` |
| `--maxi-breakpoint-lg` | `1024px` |

> These are plain CSS custom properties, not real media-query breakpoints — CSS can't yet interpolate a variable into a `@media (max-width: ...)` rule. Use them as documentation/consistency reference (read the value, hardcode the same number in your own media query) rather than expecting `@media (max-width: var(--maxi-breakpoint-md))` to work.

**How to override — global vs scoped (recommended pattern in ZEUS):**

```css
/* In src/index.css or src/styles.scss of the microfrontend */

/* Global override — affects all instances in this project */
:root {
  --maxi-table-header-background: #1a2d5a;
}

/* Scoped override — affects only the instance with this class (recommended) */
.my-custom-table {
  --maxi-table-header-background: #2d5a3d;
}
```

```tsx
/* Pass the class prop to scope the variable override */
<MsTable class="my-custom-table" columns={columns} data={rows} size="small" />
```

> Use `class` or `customClass` on the component — never target internal component classes globally (e.g. `.ms-table-header`) as it affects all instances. See [Section 7 — Advanced patterns](#7-advanced-patterns) for the full scoping rule.

---

## 4. Icon system

The library includes 100+ SVG icons accessible via the `ms-icon` component.

**Basic usage:**

```html
<ms-icon name="home" size="24" color="currentColor"></ms-icon>
```

**Available icon names (selection):**

```
home, search, close, check, arrow-up, arrow-down, arrow-left, arrow-right,
edit, delete, add, remove, save, upload, download, settings, user, users,
email, phone, calendar, clock, filter, sort, refresh, loading, warning,
error, success, info, chevron-up, chevron-down, chevron-left, chevron-right,
menu, more-vertical, more-horizontal, lock, unlock, eye, eye-off, copy
```

> The TypeScript type `IconName` lists all valid names for IDE autocompletion.

**Registering custom icons:**

```typescript
import { IconCore } from "maxi-web-components";

IconCore.add("my-icon", `<svg viewBox="0 0 24 24">...</svg>`);
```

---

## 5. Common types and interfaces

```typescript
// Item — used in Dropdown, Multiselect, Autocomplete, Chips, Paginator
interface Item {
  label: string;
  value: string | number;
  icon?: string; // CSS class or HTML for the icon
  disabled?: boolean;
}

// GroupItem — for grouped options
interface GroupItem {
  label: string; // group name
  items: Item[];
}

// ValidationDetail — emitted in validationChange
interface ValidationDetail {
  isValid: boolean;
  fieldId: string;
  value: any;
  errorMessage: string;
}

// CascadeMenuItem — cascade menu structure
// IMPORTANT: use `text` (not `label`) and `children` (not `items`)
interface CascadeMenuItem {
  id: string;
  text: string; // item label — NOT `label`
  icon?: string;
  disabled?: boolean;
  type?: "divider"; // renders a separator line — NOT `divider: true`
  children?: CascadeMenuItem[]; // subitems — NOT `items`
}

// MeterValue — for ms-meter-group (prop: `values`, not `value`)
interface MeterValue {
  label: string;
  value: number;
  color?: string;
  icon?: string;
}

// StepItem — for ms-steps (prop: `steps`, not `model`)
interface StepItem {
  label: string;
}

// ResponsiveOption — for Carousel
interface ResponsiveOption {
  breakpoint: string; // e.g. '768px'
  numVisible: number;
  numScroll: number;
}

// ColumnDef — for ms-table
interface ColumnDef {
  field: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  alignHeader?: "left" | "center" | "right";
  width?: string;
  frozen?: boolean;
  disabled?: boolean;
  render?: (row: any) => string | HTMLElement | JSX.Element;
  footer?: string;
  footerAggregate?: "sum" | "avg" | "min" | "max" | "count";
}

// NavbarItem — for ms-navbar
interface NavbarItem {
  id: string;
  label: string;
  icon?: string; // HTML string or CSS class
  url?: string;
  action?: (event: Event) => void;
  disabled?: boolean;
  customClass?: string;
  type?: "divider"; // Renders a visual separator instead of a link
  children?: NavbarChildItem[];
}

interface NavbarChildItem {
  id: string;
  text: string;
  icon?: string;
  url?: string;
  disabled?: boolean;
  type?: "divider";
  action?: (event: Event) => void;
  children?: NavbarChildItem[]; // Recursive — supports multiple nesting levels
}

// GaugeArc — for ms-gauge-chart
interface GaugeArc {
  limit: number; // fraction [0-1] of the full range where this color zone ends
  color: string; // any CSS color value (hex, rgb, hsl, named)
}
```

---

## 6. Components — Complete reference

---

### 6.1 Forms

---

#### `ms-input-field`

Text field with floating label, validation and error states. `shadow: false`. Always renders `type="text"` — no `type` prop.

| Prop           | Type      | Default            | Description                                  |
| -------------- | --------- | ------------------ | -------------------------------------------- |
| `idComponent`  | `string`  | `'ms-input-field'` | HTML `id` for the input                      |
| `class`        | `string`  | `null`             | Extra CSS class on the `<input>` element     |
| `label`        | `string`  | `null`             | Floating label (see render modes below)      |
| `placeholder`  | `string`  | `null`             | Placeholder text                             |
| `value`        | `any`     | `null`             | Current value (mutable — updated on input)   |
| `maxLength`    | `number`  | `null`             | Maximum character count                      |
| `disabled`     | `boolean` | `null`             | Disabled state                               |
| `readonly`     | `boolean` | `false`            | Focusable/submitted with a form but not user-editable |
| `name`         | `string`  | `null`             | Native HTML `name` attribute                 |
| `required`     | `boolean` | `false`            | Required field; triggers built-in validation |
| `requiredMessage` | `string` | `'This field is required'` | Overrides the default required-field error text |
| `invalid`      | `boolean` | `false`            | External error state                         |
| `errorMessage` | `string`  | `null`             | Error text (only shown when `invalid=true`)  |

**Render modes:**
- **With `label`**: floating label pattern. Placeholder is only shown when the field is focused.
- **Without `label`**: standard input. Placeholder always visible.

**Validation logic:**
- `isInvalid = invalid || internalInvalid` (either external flag or required-check failure)
- When `required=true` and field is empty → shows `requiredMessage` (default `"This field is required"`, override via the `requiredMessage` prop)
- When `invalid=true` and `errorMessage` is set → shows `errorMessage`
- `errorMessage` is **ignored** if only `required` validation fails (the built-in message takes over)

**Accessibility:** the `<input>` gets `aria-invalid="true"/"false"` reflecting `isInvalid`, and `aria-describedby` pointing at the error message element only while an error is shown. That error element has `role="alert"` so screen readers announce it the moment it appears (e.g. on blur-triggered validation), not only once the input already has focus.

**Events:**

| Event              | Payload                                              | Description                                |
| ------------------ | ---------------------------------------------------- | ------------------------------------------ |
| `focusEvent`       | `string`                                             | Current value when field receives focus    |
| `clickEvent`       | `string`                                             | Current value on click                     |
| `inputEvent`       | `string`                                             | Current value on every keystroke           |
| `changeEvent`      | `string`                                             | Current value on blur/commit               |
| `blurEvent`        | `string`                                             | Current value when focus leaves            |
| `keyDownEvent`     | `{ value: string; event: KeyboardEvent }`            | Value + native event on key press          |
| `validationChange` | `{ isValid: boolean; fieldId: string; value: any; errorMessage: string }` | Emitted when validity changes |

> All single-value events emit the **current string value of the input**, not a DOM event object.

```html
<!-- Vanilla -->
<ms-input-field
  label="Email"
  placeholder="user@example.com"
  required
></ms-input-field>
```

```tsx
// React
<MsInputField
  label="Email"
  placeholder="user@example.com"
  required
  invalid={isInvalid}
  errorMessage="Invalid email format"
  onInputEvent={(e) => setEmail(e.detail)}
  onValidationChange={(e) => setValid(e.detail.isValid)}
/>
```

---

#### `ms-input-password`

Password input with optional strength indicator and show/hide toggle. **`shadow: true`** — CSS is encapsulated.

| Prop          | Type               | Default                     | Description                                          |
| ------------- | ------------------ | --------------------------- | ---------------------------------------------------- |
| `label`       | `string`           | `''`                        | Floating label (floats when focused or has value)    |
| `placeholder` | `string`           | `''`                        | Input placeholder                                    |
| `value`       | `string`           | `''`                        | Controlled value — **not mutable**; component tracks input internally via `internalValue` state |
| `disabled`    | `boolean`          | `false`                     | Disabled state                                       |
| `invalid`     | `boolean`          | `false`                     | Visual error state                                   |
| `completed`   | `boolean`          | `false`                     | Mark as completed/confirmed (adds `.completed` host class) |
| `toggleMask`  | `boolean`          | `false`                     | Show eye icon to reveal/hide the password            |
| `feedback`    | `boolean`          | `false`                     | Show strength overlay — **only visible when focused** |
| `promptLabel` | `string`           | `'Please enter a password'` | Label shown before typing (strength = `none`)        |
| `weakLabel`   | `string`           | `'Weak'`                    | Strength label — weak                                |
| `mediumLabel` | `string`           | `'Medium'`                  | Strength label — medium                              |
| `strongLabel` | `string`           | `'Strong'`                  | Strength label — strong                              |
| `mediumRegex` | `RegExp \| string` | see defaults below          | Regex that classifies the password as medium         |
| `strongRegex` | `RegExp \| string` | see defaults below          | Regex that classifies the password as strong         |

**Strength evaluation** (checked in order: strong → medium → weak):
- `strong` default: `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,}).*$` (8+ chars, lower + upper + digit)
- `medium` default: `^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,}).*$` (6+ chars, 2 of: lower/upper/digit)
- Empty value → `'none'` (shows `promptLabel`)

**`mediumRegex`/`strongRegex` accepted string formats** (via HTML attribute, since `RegExp` is JS-only):
- `/pattern/flags` — e.g. `medium-regex="/^.{8,}$/i"`
- `{"pattern":"...","flags":"..."}` — JSON object string
- Plain string — treated as pattern with no flags

**Slots** (inside the `feedback` strength overlay):

| Slot     | Description                              |
| -------- | ---------------------------------------- |
| `header` | Content above the strength bar           |
| `footer` | Content below the strength bar           |

**Host CSS classes** (for external styling when `shadow: true` doesn't cover it):
`invalid` · `completed` · `disabled` · `strength-none` · `strength-weak` · `strength-medium` · `strength-strong`

**Accessibility:** the input carries `aria-invalid`/`aria-disabled`, plus `aria-describedby` pointing at the strength overlay when `feedback` is set; the show/hide toggle button has `aria-label` ("Show password"/"Hide password") and `aria-pressed`; the strength overlay itself is `role="status"` so strength changes get announced.

**Events:**

| Event            | Payload             | Description                                   |
| ---------------- | ------------------- | --------------------------------------------- |
| `passwordChange` | `{ value: string }` | Emitted on every keystroke with the new value |

```html
<ms-input-password label="Password" toggle-mask feedback></ms-input-password>
```

```tsx
// React
<MsInputPassword
  label="Password"
  toggleMask
  feedback
  onPasswordChange={(e) => setPassword(e.detail.value)}
/>
```

---

#### `ms-input-number`

Numeric input with locale formatting, currency support, and optional +/− spinner controls. `shadow: false`. Renders `type="text"` internally — formatting is managed in JS.

| Prop                | Type                     | Default             | Description                                                          |
| ------------------- | ------------------------ | ------------------- | -------------------------------------------------------------------- |
| `idComponent`       | `string`                 | `'ms-input-number'` | HTML `id`                                                            |
| `class`             | `string`                 | `undefined`         | Extra CSS class on the `<input>` element                             |
| `label`             | `string \| null`         | `null`              | Floating label (see render modes below)                              |
| `value`             | `number`                 | `undefined`         | Current value (mutable — updated on input)                           |
| `mode`              | `'currency' \| 'number'` | `undefined`         | Formatting mode. If omitted, formats as plain number (no currency)   |
| `currency`          | `string`                 | `'USD'`             | ISO 4217 code — only used when `mode='currency'`                     |
| `locale`            | `string`                 | `'en-US'`           | BCP 47 locale for `Intl.NumberFormat`                                |
| `min`               | `number`                 | `undefined`         | Minimum value — clamped **on blur**, not during typing               |
| `max`               | `number`                 | `undefined`         | Maximum value — clamped **on blur**, not during typing               |
| `maxLength`         | `number`                 | `20`                | Max character length of the raw input string                         |
| `maxFractionDigits` | `number`                 | `2`                 | Maximum decimal places                                               |
| `minFractionDigits` | `number`                 | `0`                 | Minimum decimal places (pads with zeros)                             |
| `useGrouping`       | `boolean`                | `true`              | Show thousands separator                                             |
| `showControls`      | `boolean`                | `false`             | Show ▲/▼ spinner buttons. Step is **±1** (not configurable)         |
| `prefixInput`       | `string`                 | `undefined`         | Text prepended inside the input value string (not a DOM element)     |
| `suffix`            | `string`                 | `undefined`         | Text appended inside the input value string (not a DOM element)      |
| `placeholder`       | `string`                 | `undefined`         | Placeholder (only visible when focused, if `label` is set)           |
| `disabled`          | `boolean`                | `false`             | Disabled state                                                       |
| `readonly`          | `boolean`                | `false`             | Focusable/submitted with a form but not user-editable                |
| `name`              | `string`                 | `undefined`         | Native HTML `name` attribute                                         |
| `required`          | `boolean`                | `false`             | Required field — triggers built-in validation                        |
| `requiredMessage`   | `string`                 | `'This field is required'` | Overrides the default required-field error text               |
| `invalid`           | `boolean`                | `false`             | External error state                                                 |
| `errorMessage`      | `string \| null`         | `null`              | Error text — only shown when `invalid=true`                          |

**Render modes:**
- **With `label`**: floating label. Placeholder only shown when focused.
- **Without `label`**: standard input. Placeholder always visible.

**Validation logic** (identical to `ms-input-field`):
- `required=true` + empty → shows `requiredMessage` (default `"This field is required"`, override via the `requiredMessage` prop)
- `invalid=true` + `errorMessage` set → shows `errorMessage`
- `errorMessage` is ignored when only `required` fails

**Accessibility:** same `aria-invalid`/`aria-describedby` + `role="alert"` error wiring as `ms-input-field`.

**Events:**

| Event              | Payload                                                                   | Description                                  |
| ------------------ | ------------------------------------------------------------------------- | -------------------------------------------- |
| `focusEvent`       | `number \| undefined`                                                     | Current numeric value on focus               |
| `clickEvent`       | `number \| undefined`                                                     | Current numeric value on click               |
| `inputEvent`       | `number \| null`                                                          | Parsed numeric value on each keystroke       |
| `changeEvent`      | `number \| null`                                                          | Parsed numeric value on blur/spinner click   |
| `blurEvent`        | `number \| undefined`                                                     | Current value (after clamp) when focus leaves |
| `validationChange` | `{ isValid: boolean; fieldId: string; value: any; errorMessage: string }` | Emitted when validity changes                |

> Events emit `null` when the field is empty (parsed result of empty string is `null`).

```html
<ms-input-number
  label="Amount"
  mode="currency"
  currency="USD"
  locale="en-US"
  max-fraction-digits="2"
></ms-input-number>
```

```tsx
// React
<MsInputNumber
  label="Quantity"
  mode="number"
  min={1}
  max={100}
  showControls
  onInputEvent={(e) => setQty(e.detail)}
  onChangeEvent={(e) => commitQty(e.detail)}
/>
```

---

#### `ms-input-otp`

OTP (One-Time Password) input. Renders N individual single-character boxes. `shadow: false`.

| Prop           | Type                                | Default          | Description                                          |
| -------------- | ----------------------------------- | ---------------- | ---------------------------------------------------- |
| `idComponent`  | `string \| null`                    | `'ms-input-otp'` | HTML `id`                                            |
| `length`       | `number`                            | `4`              | Number of input boxes                                |
| `type`         | `'numeric' \| 'text' \| 'password'` | `'text'`         | Character type (see below)                           |
| `value`        | `any \| null`                       | `null`           | Full code as string (mutable, reactive via `@Watch`) |
| `disabled`     | `boolean`                           | `false`          | Disabled state (sets `readOnly` + `disabled`)        |
| `readonly`     | `boolean`                           | `false`          | Focusable/submitted with a form but not user-editable |
| `name`         | `string`                            | `null`           | Native HTML `name` attribute                         |
| `invalid`      | `boolean`                           | `false`          | External error state                                 |
| `autoFocus`    | `boolean`                           | `false`          | Focus first box on mount (100 ms delay)              |
| `placeholder`  | `string`                            | `''`             | Placeholder character shown in each empty box        |
| `errorMessage` | `string \| null`                    | `null`           | Error text — only shown when `invalid=true`          |
| `required`     | `boolean`                           | `false`          | Required — valid only when **all** boxes are filled  |
| `requiredMessage` | `string`                         | `'This field is required'` | Overrides the default required-field error text |
| `customClass`  | `string`                            | `''`             | Extra CSS class on each box                          |

**`type` rendering:**
- `'text'` → `type="text"` on each input
- `'password'` → `type="password"` on each input (chars masked)
- `'numeric'` → `type="text"` + `inputMode="numeric"` (numeric mobile keyboard) + strips non-digits on input and paste

**Keyboard behavior:**
- Typing a character auto-advances focus to the next box
- `Backspace` on an empty box moves focus back to the previous box

**Paste:**
- Handles `paste` on the container; fills boxes left-to-right up to `length`
- If `type='numeric'`, non-digit characters are stripped before filling
- Fires `completeEvent` with the resulting joined string after paste

**Validation (`required`):**
- Valid only when `value.trim().length === length` (all boxes filled)
- Falls back to `requiredMessage` (default `"This field is required"`) when incomplete
- `errorMessage` only shown when `invalid=true`

**Events:**

| Event              | Payload                                                                   | Description                                              |
| ------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| `inputEvent`       | `string`                                                                  | Joined **partial or full** value on every keystroke       |
| `completeEvent`    | `string`                                                                  | Joined value — fires **only once all boxes are filled** (on the completing keystroke, or after a paste that fills every box) |
| `focusEvent`       | `number`                                                                  | Index of the box that received focus                     |
| `blurEvent`        | `number`                                                                  | Index of the box that lost focus                         |
| `validationChange` | `{ isValid: boolean; fieldId: string; value: string; errorMessage: string }` | Emitted when validity changes                         |

> `completeEvent` only fires once the code is fully filled — use `inputEvent` instead if you need the partial value on every keystroke. No length check is needed on `completeEvent`'s payload.

```html
<ms-input-otp length="6" type="numeric"></ms-input-otp>
<script>
  const otp = document.querySelector("ms-input-otp");
  otp.addEventListener("completeEvent", (e) => verifyCode(e.detail));
</script>
```

```tsx
// React
<MsInputOtp
  length={6}
  type="numeric"
  autoFocus
  onCompleteEvent={(e) => verifyCode(e.detail)}
/>
```

---

#### `ms-input-switch`

Toggle switch (on/off). `shadow: false`.

| Prop              | Type                            | Default     | Description                                                   |
| ----------------- | ------------------------------- | ----------- | ------------------------------------------------------------- |
| `checked`         | `boolean`                       | `false`     | Checked state — `reflect: true`, `mutable: true`              |
| `class`           | `string`                        | `undefined` | Extra CSS class — **only applied when `tooltip` is also set** |
| `disabled`        | `boolean`                       | `undefined` | Disabled state                                                |
| `readonly`        | `boolean`                       | `false`     | Focusable/submitted with a form but not user-togglable (sets `aria-readonly`) |
| `name`            | `string`                        | `undefined` | Native HTML form `name`                                       |
| `value`           | `string`                        | `undefined` | Value submitted when checked (native default `"on"`)          |
| `tooltip`         | `string`                        | `undefined` | Tooltip text. When not set, `ms-tooltip` is not rendered      |
| `tooltipPosition` | `Position` (`'top'\|'bottom'\|'left'\|'right'`) | `undefined` | Tooltip placement — all 4 values work at runtime |

> **No `label` prop.** Place a `<label>` element next to the component manually if a label is needed.

> **`class` bug:** `class` is only applied to the inner `<label>` when `tooltip` is present. Without `tooltip`, the label hardcodes `class="ms-switch"` and `class` is ignored.

**Events:**

| Event         | Payload   | Description                           |
| ------------- | --------- | ------------------------------------- |
| `changeEvent` | `boolean` | New checked state on every toggle     |

```html
<ms-input-switch checked></ms-input-switch>

<!-- With tooltip -->
<ms-input-switch tooltip="Enable notifications" tooltip-position="right"></ms-input-switch>
```

```tsx
// React
<MsInputSwitch
  checked={isEnabled}
  onChangeEvent={(e) => setIsEnabled(e.detail)}
/>
```

---

#### `ms-checkbox`

Styled checkbox with label support.

| Prop       | Attribute  | Type      | Default     | Description                                                           |
| ---------- | ---------- | --------- | ----------- | --------------------------------------------------------------------- |
| `checked`  | `checked`  | `boolean` | `false`     | Checked state. Reflected to HTML attribute; can be set programmatically |
| `disabled` | `disabled` | `boolean` | `undefined` | Disabled state                                                        |
| `readonly` | `readonly` | `boolean` | `false`     | Focusable/submitted with a form but not user-togglable (sets `aria-readonly`) |
| `label`    | `label`    | `string`  | `undefined` | Label text rendered as `<label htmlFor={inputId}>`                   |
| `inputId`  | `input-id` | `string`  | `undefined` | `id` on the inner `<input>` — required for label click to work       |
| `name`     | `name`     | `string`  | `undefined` | HTML `name` attribute — use to group in forms                        |
| `value`    | `value`    | `string`  | `undefined` | HTML `value` attribute on the inner `<input>`                        |
| `class`    | `class`    | `string`  | `undefined` | Extra CSS class applied to the inner `<input>` element               |
| `required` | `required` | `boolean` | `false`     | Required field — triggers built-in validation on toggle/blur         |
| `invalid`  | `invalid`  | `boolean` | `false`     | External error state                                                  |
| `errorMessage` | `error-message` | `string` | `undefined` | Error text — only shown when `invalid=true`                      |
| `requiredMessage` | `required-message` | `string` | `'This field is required'` | Overrides the default required-field error text |

`ms-checkbox` supports the **same validation pattern as `ms-input-field`/`ms-radio`**: set `required` to validate on toggle/blur, `invalid`+`errorMessage` for externally-driven error state, `requiredMessage` to customize the default message, and listen for `validationChange`.

**Events:**

| Event | Payload | Description |
|---|---|---|
| `checkboxChange` | `boolean` | New `checked` state |
| `validationChange` | `{ isValid: boolean; fieldId: string; value: boolean; errorMessage: string }` | Emitted when validity changes |

```tsx
// React
<MsCheckbox
  inputId="agree"
  name="agree"
  label="I accept the terms"
  checked={accepted}
  onCheckboxChange={(e) => setAccepted(e.detail)} // e.detail = boolean
/>
```

---

#### `ms-radio`

Styled radio button. `shadow: false` — external CSS penetrates.

| Prop       | Type                | Default     | Description                                                           |
| ---------- | ------------------- | ----------- | --------------------------------------------------------------------- |
| `idRadio`  | `string`            | `undefined` | HTML `id` for the input — required to link `<label>` via `htmlFor`    |
| `name`     | `string`            | `undefined` | Group name for HTML radio grouping — used as the native input's `value` **only when `value` is left unset** |
| `label`    | `string`            | `undefined` | Label text                                                            |
| `value`    | `string`            | `undefined` | Passed straight through to the native `<input value>` whenever set — falls back to `name` only if omitted |
| `checked`  | `boolean` (reflect, mutable) | `undefined` | Selected state                                         |
| `disabled` | `boolean`           | `undefined` | Disabled                                                              |
| `readonly` | `boolean`           | `false`     | Focusable/submitted with a form but not user-selectable (sets `aria-readonly`) |
| `required` | `boolean`           | `false`     | Required — validated **per radio** (invalid while this radio is unchecked), not per-group |
| `invalid`  | `boolean`           | `false`     | External error state                                                  |
| `errorMessage` | `string`        | `undefined` | Error text — only shown when `invalid=true`                          |
| `requiredMessage` | `string`     | `'This field is required'` | Overrides the default required-field error text          |
| `class`    | `string`            | `undefined` | Extra CSS class on the native `<input>` element                       |

> **`radioChange` emits `boolean`, not a value string.** The event emits `isChecked` (`true` when the radio is selected). It does NOT emit the `value` prop. To identify which radio was selected, use the `name` or `value` props in your handler's context.

> **`required`/`invalid`/`errorMessage`/`requiredMessage` validate per radio, not per group.** There's no built-in "at least one of these N radios is checked" group validation — for that, rely on the native `required` attribute forwarded to the input inside a real `<form>`, or validate the group's selection yourself.

**Events:**

| Event | Payload | Description |
|---|---|---|
| `radioChange` | `boolean` | `true` when this radio becomes selected |
| `validationChange` | `{ isValid: boolean; fieldId: string; value: boolean; errorMessage: string }` | Emitted when validity changes |

```tsx
// React — radio group
{options.map(opt => (
  <MsRadio
    key={opt.id}
    idRadio={opt.id}
    name="payment-method"
    label={opt.label}
    value={opt.id}
    checked={selected === opt.id}
    onRadioChange={() => setSelected(opt.id)}  // use closure, not e.detail
  />
))}
```

---

#### `ms-control-number`

Integer stepper with + and − buttons. Uses **`shadow: true`** — element styles are encapsulated. However, CSS custom properties **do** cascade into shadow DOM — the component exposes `--ms-cn-width` and other theming variables that can be set from outside.

> **Input restriction:** keyboard input accepts only non-negative integers (digits 0–9). Negative values are reachable via the − button only if `min` is negative; you cannot type a minus sign. Empty input falls back to `min` (or `0` if `min` is unset).

| Prop           | Attribute        | Type               | Default | Description                                                              |
| -------------- | ---------------- | ------------------ | ------- | ------------------------------------------------------------------------ |
| `label`        | `label`          | `string`           | `''`    | Floating label shown above the control                                   |
| `value`        | `value`          | `number \| string` | —       | Current value — `mutable + reflect`. Initialized to `defaultValue` or `0` on mount |
| `defaultValue` | `default-value`  | `number \| string` | —       | Initial value; only used if `value` is not set at mount                  |
| `min`          | `min`            | `number \| string` | —       | Minimum bound; − button disabled when value equals `min`                 |
| `max`          | `max`            | `number \| string` | —       | Maximum bound; + button disabled when value equals `max`                 |
| `disabled`     | `disabled`       | `boolean`          | `false` | Disables both buttons and the input                                      |
| `error`        | `error`          | `boolean`          | `false` | Renders red error border                                                 |
| `errorMessage` | `error-message`  | `string \| null`   | `null`  | Error text below — only visible when `error=true`                        |
| `customClass`  | `custom-class`   | `string`           | —       | Extra CSS class applied to the host wrapper                              |

**CSS custom properties (set on the host element — cascade into shadow DOM):**

| Variable           | Default   | Description                                           |
| ------------------ | --------- | ----------------------------------------------------- |
| `--ms-cn-width`    | `160px`   | Total width of the control (buttons + input combined) |
| `--ms-cn-input-height` | `40px` | Height of the control row                            |

**Events:**

| Event         | Payload  | Fires when                                                              |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `changeEvent` | `number` | On button click, blur, or ArrowUp/Down key (NOT on each keystroke)      |
| `inputEvent`  | `number` | On every value change, including individual keystrokes while typing     |

**Accessibility:** the host has `role="group"` and `aria-invalid` (reflecting `error`); the `<input>` exposes `aria-valuemin`/`aria-valuemax`/`aria-valuenow`; the floating label is `aria-live="polite"`; the +/− buttons have `aria-label="Increase value"`/`"Decrease value"`; the error text has `role="alert"`.

**Paste behavior:** pasted text is sanitized the same way as typed input — non-digit characters are stripped and the result is inserted at the cursor position, capped at 16 digits (to stay within `Number.MAX_SAFE_INTEGER`).

```tsx
// React — basic usage
<MsControlNumber
  label="Cantidad"
  min={1}
  max={99}
  defaultValue={1}
  onChangeEvent={(e) => setQty(e.detail)}
/>
```

**Full-width pattern in grid/flex layouts:**

The `:host` defaults to `display: inline-block` and `--ms-cn-width: 160px`. To make the control fill a grid column or flex item, override both from outside — CSS custom properties cascade through the shadow boundary:

```css
/* Wrapper div takes the full column width */
.my-wrapper {
  width: 100%;
}

/* Override host display + pass --ms-cn-width into the shadow */
.my-wrapper ms-control-number {
  display: block;       /* overrides shadow :host display: inline-block */
  width: 100%;
  --ms-cn-width: 100%;  /* cascades into shadow → .ms-cn-field uses this var */
}
```

```tsx
// React — full-width MsControlNumber in a grid field
<div className="my-wrapper">
  <MsControlNumber
    value={ficoScore}
    min={0}
    max={850}
    onChangeEvent={(e) => setFicoScore(e.detail)}
  />
</div>
```

> **Why this works:** CSS custom properties (CSS variables) are inherited properties — they cascade across shadow DOM boundaries by design. The internal `.ms-cn-field` div uses `width: var(--ms-cn-width)`, so setting `--ms-cn-width: 100%` on the host element makes the field fill the host. External author styles also override shadow `:host()` rules per the CSS shadow cascade specification.

---

#### `ms-knob`

Rotary dial control for selecting numeric values. **`shadow: true`** — CSS is encapsulated. Interaction is **drag-based** (mouse and touch) **and fully keyboard-accessible**.

| Prop            | Type      | Default     | Description                                                 |
| --------------- | --------- | ----------- | ----------------------------------------------------------- |
| `value`         | `number`  | `0`         | Current value (mutable)                                     |
| `min`           | `number`  | `0`         | Minimum value                                               |
| `max`           | `number`  | `100`       | Maximum value                                               |
| `step`          | `number`  | `1`         | Step increment                                              |
| `disabled`      | `boolean` | `false`     | Disabled — no interaction                                   |
| `readOnly`      | `boolean` | `false`     | Read-only — value displayed, no interaction                 |
| `size`          | `number`  | `100`       | Dial diameter in px                                         |
| `strokeWidth`   | `number`  | `14`        | Arc thickness in px                                         |
| `valueTemplate` | `string`  | `'{value}'` | Template for center label — `{value}` is replaced at render |
| `textColor`     | `string`  | `undefined` | Color of the center value text                              |
| `rangeColor`    | `string`  | `undefined` | Color of the **background track arc** (inactive portion)    |
| `valueColor`    | `string`  | `undefined` | Color of the **progress arc** (filled/value portion)        |

> Arc geometry is fixed: **270° arc**, starts at **135°** — not configurable.

> `changeValue` only emits when the value actually changes (`newValue !== this.value`).

> **`shadow: true`** — `rangeColor`, `valueColor`, `textColor` are the only way to customize colors from outside. Host classes `ms-knob--disabled` and `ms-knob--readonly` are available for external CSS targeting.

**Keyboard support:** focus the dial (the inner `<svg>` carries `tabIndex=0`, or `-1` when `disabled`) and use `ArrowUp`/`ArrowRight` to increment by `step`, `ArrowDown`/`ArrowLeft` to decrement by `step`, `Home` to jump to `min`, `End` to jump to `max`. The dial exposes `role="slider"` with `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext` (driven by `valueTemplate`) for screen readers, plus `aria-disabled`/`aria-readonly`. `readOnly` disables both drag and keyboard interaction while still displaying the value and exposing it to assistive tech — combine with `disabled` as needed.

**Events:**

| Event         | Payload  | Description                                       |
| ------------- | -------- | ------------------------------------------------- |
| `changeValue` | `number` | New value on drag — only emits when value changes |

```tsx
// React
<MsKnob
  value={volume}
  min={0}
  max={100}
  valueTemplate="{value}%"
  rangeColor="#e0e0e0"
  valueColor="#4f46e5"
  onChangeValue={(e) => setVolume(e.detail)}
/>
```

---

#### `ms-input-group`

**Now a real web component (not just a CSS convention).** Groups inputs with addons (text, icons, buttons, selects) in a single flex row. Layout still comes from two CSS classes (`.ms-input-group` container, `.ms-input-group-addon` non-input cell — plain `<div class="ms-input-group">` markup keeps working with zero changes), but the `<ms-input-group>` tag now also propagates group-level `disabled`/`invalid` state to its recognized `ms-*` form children.

| Prop       | Attribute  | Type      | Default     | Description                                                           |
| ---------- | ---------- | --------- | ----------- | ---------------------------------------------------------------------|
| `disabled` | `disabled` | `boolean` | `undefined` | When set, propagated to every recognized `ms-*` child. Leave `undefined` to control children individually. |
| `invalid`  | `invalid`  | `boolean` | `undefined` | When set, propagated to children that support an invalid state (all recognized children **except** `ms-button` and `ms-input-switch`). Leave `undefined` to control individually. |

Propagation runs on initial mount and again via a `MutationObserver` watching for children added/removed later — dynamically-inserted children still get `disabled`/`invalid` applied. Setting either prop back to `undefined` stops the group from touching that attribute at all (it does **not** force children back to `false`); explicitly set `false` if you need to force-clear it.

**Recognized child tags for propagation:** `ms-input-field`, `ms-input-number`, `ms-autocomplete`, `ms-dropdown`, `ms-multiselect`, `ms-calendar`, `ms-chips`, `ms-select-button`, `ms-control-number`, `ms-checkbox`, `ms-radio`, `ms-input-switch`, `ms-button`.

**CSS classes (still apply regardless of whether you use the `<ms-input-group>` tag or a plain `<div>`):**

| Class                  | Element | Description                                                   |
| ---------------------- | ------- | ------------------------------------------------------------- |
| `.ms-input-group`      | `div`   | Flex row container. Adapts to 100% width of its parent.       |
| `.ms-input-group-addon`| `span`  | Non-input cell (text, SVG, `ms-checkbox`, `ms-input-switch`). |

**Rules:**
- `ms-button` placed directly in the group integrates flush (no border-radius gap).
- Use the `<ms-input-group>` tag (not a plain `<div>`) when you want group-level `disabled`/`invalid` propagation; a plain `<div class="ms-input-group">` still works for layout-only usage.
- Multiple consecutive `.ms-input-group-addon` spans are valid (icon + label).
- Multiple input children in the same group are valid (e.g. First name / Last name).

```html
<!-- Text addon -->
<div class="ms-input-group">
  <span class="ms-input-group-addon">@</span>
  <ms-input-field placeholder="Username"></ms-input-field>
</div>

<!-- Input + button -->
<div class="ms-input-group">
  <ms-input-field placeholder="Search..."></ms-input-field>
  <ms-button>Search</ms-button>
</div>

<!-- Dropdown prefix + input -->
<div class="ms-input-group">
  <ms-dropdown style="width:150px" placeholder="+1"></ms-dropdown>
  <ms-input-field placeholder="(555) 000-0000"></ms-input-field>
</div>

<!-- Two inputs side by side -->
<div class="ms-input-group">
  <ms-input-field placeholder="First name"></ms-input-field>
  <ms-input-field placeholder="Last name"></ms-input-field>
</div>

<!-- Checkbox as addon -->
<div class="ms-input-group">
  <span class="ms-input-group-addon"><ms-checkbox></ms-checkbox></span>
  <ms-input-field placeholder="I accept the terms"></ms-input-field>
</div>

<!-- Group-level disabled/invalid propagation (use the <ms-input-group> tag, not a plain div) -->
<ms-input-group disabled="{isSubmitting}" invalid="{hasGroupError}">
  <ms-input-field placeholder="First name"></ms-input-field>
  <ms-input-field placeholder="Last name"></ms-input-field>
</ms-input-group>
```

---

### 6.2 Selection

---

#### `ms-dropdown`

Select/dropdown with floating label, optional search, and group support. `shadow: false`.

| Prop           | Attribute        | Type                       | Default           | Description                                     |
| -------------- | ---------------- | -------------------------- | ----------------- | ----------------------------------------------- |
| `options`      | **JS only**      | `Item[] \| GroupItem[]`    | `[]`              | Available options — must be set as JS property  |
| `value`        | `value`          | `string \| number \| null` | `null`            | Selected value (mutable)                        |
| `label`        | `label`          | `string \| null`           | `null`            | Floating label                                  |
| `placeholder`  | `placeholder`    | `string`                   | `'Select option'` | Placeholder when nothing is selected            |
| `filter`       | `filter`         | `boolean`                  | `false`           | Enable search within options                    |
| `optionGroup`  | `option-group`   | `boolean`                  | `false`           | Treat `options` as `GroupItem[]`                |
| `disabled`     | `disabled`       | `boolean`                  | `false`           | Disabled (mutable)                              |
| `required`     | `required`       | `boolean`                  | `false`           | Required — validates on selection change        |
| `invalid`      | `invalid`        | `boolean`                  | `false`           | Force error state from outside                  |
| `errorMessage` | `error-message`  | `string \| null`           | `null`            | Error text — shown when `invalid=true` or `required` fails |
| `requiredMessage` | `required-message` | `string`                | `'This field is required'` | Overrides the default required-field error text |
| `class`        | `class`          | `string \| null`           | `null`            | Extra CSS class on the dropdown box             |
| `idComponent`  | `id-component`   | `string \| null`           | `'ms-dropdown'`   | `id` used for label linkage and `validationChange.fieldId` |

**Accessibility and keyboard navigation:** follows the ARIA listbox combobox pattern. The trigger has `role="button"`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` (pointing at the highlighted option), `aria-disabled`, and `aria-labelledby` (when `label` is set). The option list is `role="listbox"` with each option as `role="option"`/`aria-selected`; groups get `role="group"`/`aria-label`. Keyboard: `ArrowDown`/`ArrowUp` open the menu and move the highlighted option, `Home`/`End` jump to the first/last visible option, `Enter`/`Space` selects the highlighted option (or opens a closed menu), `Escape` closes the menu (and, from inside the search input, also returns focus to the trigger).

**Interfaces:**

```ts
interface Item {
  label: string;
  value: number | string;
  icon?: string;      // URL to <img> displayed before label
  disabled?: boolean;
  tooltip?: string;
}

interface GroupItem extends Item {
  items: Item[];      // child items when optionGroup=true
  // GroupItem.value is inherited but ignored during selection
}

interface ValidationDetail {
  isValid: boolean;
  fieldId: string;    // matches idComponent
  value: any;
  errorMessage: string;
}
```

**Events:**

| Event              | Payload            | Description                                                        |
| ------------------ | ------------------ | ------------------------------------------------------------------ |
| `selected`         | `Item`             | Full `Item` object of the selected option (not just the value)     |
| `validationChange` | `ValidationDetail` | Fires on selection, `required` toggle, and `invalid` prop change   |

**Behavior:** auto-positions the option panel above or below based on available viewport space.

> When `required=true` and the field is empty, the component auto-validates and shows `'This field is required'` — no need to set `invalid` manually.

```tsx
// React
const options = [
  { label: "United States", value: "US" },
  { label: "Mexico", value: "MX" },
  { label: "Colombia", value: "CO" },
];

<MsDropdown
  label="Country"
  options={options}
  value={selectedCountry}
  filter
  onSelected={(e) => setSelectedCountry(e.detail.value)}
/>
```

```tsx
// React — grouped options (optionGroup must be true)
const grouped = [
  { label: "North America", value: "na", items: [
    { label: "United States", value: "US" },
    { label: "Mexico", value: "MX" },
  ]},
  { label: "South America", value: "sa", items: [
    { label: "Colombia", value: "CO" },
  ]},
];

<MsDropdown
  label="Region"
  options={grouped}
  optionGroup
  onSelected={(e) => setRegion(e.detail.value)}
/>
```

---

#### `ms-multiselect`

Multi-select with search, select-all and groups. `shadow: false` — external CSS penetrates.

| Prop                  | Type                         | Default              | Description                                              |
| --------------------- | ---------------------------- | -------------------- | -------------------------------------------------------- |
| `idComponent`         | `string \| null`             | `'ms-multiselect'`   | HTML `id`                                                |
| `label`               | `string \| null`             | `null`               | Floating label. When `null`, renders without label mode  |
| `placeholder`         | `string`                     | `'Select an item'`   | Placeholder text                                         |
| `options`             | `Item[] \| GroupItem[]`      | `[]`                 | Available options — **JS-only** (array can't be set via HTML attribute) |
| `value`               | `Item[] \| GroupItem[]`      | `undefined`          | Selected items — **JS-only**                             |
| `display`             | `'comma' \| 'chip'`          | `'comma'`            | `'comma'` joins labels with ", "; `'chip'` renders removable `ms-chips` |
| `showFilter`          | `boolean`                    | `false`              | Show search input inside dropdown                        |
| `showSelectAll`       | `boolean`                    | `true`               | Show "Select all" checkbox                               |
| `selectAllOptionText` | `string`                     | `''`                 | Label for the "Select all" checkbox (empty = no label)   |
| `optionGroup`         | `boolean`                    | `false`              | Group mode — `options` must be `GroupItem[]`             |
| `class`               | `string \| null`             | `null`               | Extra CSS class on the trigger box element               |
| `disabled`            | `boolean`                    | `false`              | Disabled                                                 |
| `required`            | `boolean` (mutable)          | `false`              | Required — validated on selection change                 |
| `requiredMessage`     | `string`                     | `'This field is required'` | Overrides the default required-field error text    |
| `invalid`             | `boolean`                    | `false`              | Visual error state                                       |
| `errorMessage`        | `string \| null`             | `null`               | Error message shown when `invalid=true`                  |
| `remoteFilter`        | `boolean`                    | `false`              | Disables built-in client-side filtering — filter `options` yourself server-side in response to the `filter` event |
| `debounceTime`        | `number`                     | `300`                | Debounce (ms) applied to the `filter` event               |
| `loading`             | `boolean` (mutable)          | `false`              | Shows a "Loading..." row in place of items (e.g. while awaiting a remote filter) |

> **"N items selected"** — when more than 3 items are selected the trigger shows `"N items selected"` regardless of the `display` value. This is automatic, not configurable.

> **Validation:** `errorMessage` only shown when `invalid=true`. When `required` fails, shows `requiredMessage` (default `"This field is required"`).

> **`display='chip'`** — uses `ms-chips` internally. Chips are removable by the user. Does **not** work correctly with `optionGroup=true`.

> **Dropdown position** — menu is rendered `position: fixed` at `zIndex: 9999`. Auto-flips above trigger if there is no space below.

**Accessibility and keyboard navigation:** same ARIA combobox pattern as `ms-dropdown` (`role="button"` trigger with `aria-haspopup`/`aria-expanded`/`aria-controls`/`aria-activedescendant`; `role="listbox"`/`role="option"` list), plus `aria-multiselectable="true"` on the listbox since multiple items can be selected. Keyboard: `ArrowDown`/`ArrowUp` move the highlighted option, `Home`/`End` jump to first/last, `Enter`/`Space` **toggles** the highlighted item (doesn't close the menu), `Escape` closes.

**Events:**

| Event              | Payload            | Description                                                  |
| ------------------ | ------------------ | ------------------------------------------------------------ |
| `selected`         | `Item[]`           | Current selected items after any change (item toggle or select-all) |
| `selectAll`        | `Item[]`           | Items selected/deselected via "Select all" checkbox          |
| `hide`             | `boolean`          | Emits `false` when dropdown closes (always `false`)          |
| `filter`           | `string`           | Search text as user types in the filter input                |
| `validationChange` | `ValidationDetail` | `{ isValid, fieldId, value, errorMessage }` — emits on selection change when `required=true` or `invalid` changes |

```tsx
// React
<MsMultiselect
  label="Permissions"
  options={permissionOptions}
  value={selectedPermissions}
  showFilter
  showSelectAll
  onSelected={(e) => setPermissions(e.detail)}
  onValidationChange={(e) => setValid(e.detail.isValid)}
/>
```

---

#### `ms-autocomplete`

Text field with dynamic suggestions (typeahead).

| Prop           | Type                       | Default               | Description                                              |
| -------------- | -------------------------- | --------------------- | -------------------------------------------------------- |
| `idComponent`  | `string`                   | `'ms-autocomplete'`   | HTML `id` for the input                                  |
| `label`        | `string \| null`           | `null`                | Floating label. When `null`, renders without floating label |
| `placeholder`  | `string`                   | `'Type to search...'` | Placeholder text                                         |
| `value`        | `string \| number \| null` | `null`                | Current selected value (pre-fills the input text)        |
| `class`        | `string \| null`           | `null`                | Extra CSS class on the input element                     |
| `showIcon`     | `boolean`                  | `false`               | Show search icon inside the input                        |
| `optionGroup`  | `boolean`                  | `false`               | Grouped suggestions — pass `GroupItem[]` via `resolve`   |
| `disabled`     | `boolean`                  | `false`               | Disabled                                                 |
| `required`     | `boolean`                  | `false`               | Required field                                           |
| `requiredMessage` | `string`                | `'This field is required'` | Overrides the default required-field error text     |
| `invalid`      | `boolean`                  | `false`               | Visual error state                                       |
| `errorMessage` | `string \| null`           | `null`                | Error message shown below the input when invalid         |
| `suggestions`  | `{ label, value }[]`       | `[]`                  | Declared prop but **NOT used for display** — pass results via `resolve` (see below) |
| `debounceTime` | `number`                   | `300`                 | Debounces `completeMethod` while typing (ms) instead of firing on every keystroke |

**Events:**

| Event              | Payload                                                                              | Description                                       |
| ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `completeMethod`   | `{ query: string; resolve: (results: { label: string; value: string }[]) => void }` | User typed (debounced by `debounceTime`) — **must call `e.detail.resolve(results)`** to populate dropdown |
| `selected`         | `{ label: string; value: string }`                                                   | Item selected from the dropdown                   |
| `validationChange` | `ValidationDetail`                                                                   | Validation state changed                          |

> **`completeMethod` usa un callback Promise-based.** El componente espera `e.detail.resolve(results)` para mostrar las sugerencias. Llamar `setSuggestions()` o cualquier setState externo **no tiene efecto** — el prop `suggestions` no está conectado a la lista del dropdown.

> **Race-condition guard:** if the user types again (or clears the input) before a slower `completeMethod` call resolves, the stale response is automatically discarded instead of overwriting the newer one — safe to fire real network requests directly from `completeMethod` without your own request-sequencing logic. While waiting for `resolve()`, the dropdown shows a `Loading...` row.

**Item shape:**

```typescript
// Flat item
{ label: string; value: string; icon?: string }  // icon = URL, renders as 24px image

// Grouped item (optionGroup=true)
{ label: string; icon?: string; items: { label: string; value: string }[] }
```

**Keyboard navigation:** `↑ ↓` navigate · `Enter` select · `Esc` close

```tsx
// React — correct pattern: resolve callback
<MsAutocomplete
  label="Search user"
  showIcon
  required
  errorMessage="Select a user"
  onCompleteMethod={async (e) => {
    const { query, resolve } = e.detail;
    const results = await api.searchUsers(query);
    resolve(results.map(u => ({ label: u.name, value: u.id })));
  }}
  onSelected={(e) => setUser(e.detail)}
  onValidationChange={(e) => setValid(e.detail.isValid)}
/>

// ❌ INCORRECTO — setSuggestions no tiene efecto, el componente ignora el prop suggestions
const [suggestions, setSuggestions] = useState([]);
<MsAutocomplete
  suggestions={suggestions}  // no conectado al dropdown
  onCompleteMethod={async (e) => {
    const results = await api.search(e.detail); // e.detail es { query, resolve }, no un string
    setSuggestions(results);  // no actualiza el dropdown
  }}
/>

// React — grouped mode
<MsAutocomplete
  label="Search location"
  optionGroup
  onCompleteMethod={async (e) => {
    const { resolve } = e.detail;
    resolve([
      { label: 'USA', items: [{ label: 'New York', value: 'ny' }] },
      { label: 'Mexico', items: [{ label: 'CDMX', value: 'mx' }] },
    ]);
  }}
  onSelected={(e) => console.log(e.detail)}
/>
```

---

#### `ms-chips`

Tag/chip input with optional autocomplete.

| Prop          | Attribute     | Type                    | Default     | Description                                                           |
| ------------- | ------------- | ----------------------- | ----------- | --------------------------------------------------------------------- |
| `value`       | **JS only**   | `string[]`              | `undefined` | Initial chips array — must be a JS prop                               |
| `suggestions` | **JS only**   | `string[]`              | `undefined` | Autocomplete suggestions — must be a JS prop. Presence switches mode  |
| `placeholder` | `placeholder` | `string`                | `undefined` | Input placeholder (hidden once chips exist)                           |
| `max`         | `max`         | `number`                | `undefined` | Maximum chips — input is disabled once reached                        |
| `removable`   | `removable`   | `boolean`               | `true`      | Show × button on each chip; Backspace also removes last chip          |
| `disabled`    | `disabled`    | `boolean`               | `false`     | Disabled                                                              |
| `invalid`     | `invalid`     | `boolean`               | `false`     | Visual error state                                                    |
| `separator`   | `separator`   | `'default' \| ','`      | `'default'` | `'default'` = Enter adds chip; `','` = comma adds chip               |
| `variant`     | `variant`     | `'outlined' \| 'filled'`| `'outlined'`| Visual variant                                                        |
| `class`       | `class`       | `string`                | `undefined` | Extra CSS class on the outer container                                |

> **`separator` value:** the comma mode uses the literal string `","` (not `"comma"`). Pass `separator=","`.

**Events:** `changeEvent` — emits `string[]` with all current chips after any add/remove.

**Two operating modes (based on `suggestions` prop):**

- **Free entry** (`suggestions` not set): Enter or `,` (per `separator`) adds the typed text as a chip directly.
- **Autocomplete** (`suggestions` is an array): shows a dropdown filtered by input; Enter/click selects from the list. Input is cleared on blur, already-added items are excluded from suggestions. The suggestion list renders in a viewport-positioned portal (flips above/below the input based on available space, same as `ms-dropdown`) and shows "Records not found" when nothing matches.

**Keyboard (autocomplete mode):**

- `↓ / ↑` — navigate dropdown
- `Enter` — select highlighted suggestion
- `Backspace` on empty input — removes last chip
- `Escape` — close dropdown

```tsx
// React — free entry
<MsChips
  value={tags}
  placeholder="Add tag"
  onChangeEvent={(e) => setTags(e.detail)} // e.detail = string[]
/>

// React — autocomplete mode
<MsChips
  value={selected}
  suggestions={["React", "Angular", "Vue", "Stencil"]}
  placeholder="Add technology"
  max={5}
  onChangeEvent={(e) => setSelected(e.detail)}
/>

// Comma separator (note: literal "," not "comma")
<MsChips value={tags} separator="," onChangeEvent={(e) => setTags(e.detail)} />
```

---

#### `ms-select-button`

Segmented control-style selection buttons. Single or multiple selection. `shadow: false` — external CSS penetrates.

| Prop              | Type                    | Default              | Description                                                                 |
| ----------------- | ----------------------- | -------------------- | --------------------------------------------------------------------------- |
| `options`         | `Item[] \| string[]`    | `[]`                 | Available options. `string[]` is auto-normalized to `{label, value}[]`      |
| `value`           | `any` (mutable)         | `null`               | Selected value (single) or `any[]` (multiple)                               |
| `multiple`        | `boolean`               | `false`              | Allow multiple selection                                                    |
| `label`           | `string \| null`        | `null`               | Label above the button group                                                |
| `tooltip`         | `string \| null`        | `null`               | Tooltip on the entire group (wraps in `ms-tooltip`)                         |
| `tooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Position for both group and per-item tooltips            |
| `disabled`        | `boolean`               | `false`              | Disables all buttons                                                        |
| `required`        | `boolean`               | `false`              | Required — validated on change                                              |
| `requiredMessage` | `string`                | `'This field is required'` | Overrides the default required-field error text                     |
| `invalid`         | `boolean`               | `false`              | Visual error state                                                          |
| `errorMessage`    | `string \| null`        | `null`               | Error message shown when `invalid=true`                                     |
| `idComponent`     | `string \| null`        | `'ms-select-button'` | HTML `id`                                                                   |
| `class`           | `string \| null`        | `null`               | Extra CSS class on the wrapper element                                      |

> **Event name is `changeValue`, not `changeEvent`.**

> **`changeValue` payload differs by mode:**
> - Single mode → emits the selected **value** (primitive), or `null` when deselected
> - Multiple mode → emits **`Item[]`** (full objects of selected items)

> **Single mode toggles:** clicking the already-selected button deselects it (emits `null`).

> **Validation:** `errorMessage` shown only when `invalid=true`. `required` failure → `requiredMessage` (default `"This field is required"`).

> **Per-item tooltip:** if an `Item` has a `tooltip` property, that item is individually wrapped in `ms-tooltip`.

**Accessibility:** each button carries `role="radio"` (single mode) or `role="checkbox"` (multiple mode) with `aria-pressed`/`aria-disabled`/`aria-label={item.label}`; the group wrapper has `role="group"` with `aria-label`/`aria-required`/`aria-invalid`.

**Keyboard navigation:** `←`/`↑` focus previous · `→`/`↓` focus next · `Home` first · `End` last. (Arrow keys only move focus — they don't select; press Enter/Space or click to select.)

**Touch behavior:** tapping a button selects it, but dragging past ~10px before release (e.g. swipe-scrolling a horizontal row of buttons) suppresses the selection instead of accidentally selecting whatever was under the finger.

**Events:**

| Event              | Payload                        | Description                              |
| ------------------ | ------------------------------ | ---------------------------------------- |
| `changeValue`      | `any` (single) \| `Item[]` (multiple) | Selection changed                 |
| `validationChange` | `ValidationDetail`             | `{ isValid, fieldId, value, errorMessage }` |

**Slots:** `item-{value}` — custom content for a specific button (e.g. icon + label).

```tsx
// React — single mode (view toggle)
<MsSelectButton
  options={[
    { label: "List", value: "list" },
    { label: "Grid", value: "grid" },
  ]}
  value={viewMode}
  onChangeValue={(e) => setViewMode(e.detail)}
/>

// React — multiple mode
<MsSelectButton
  options={["Mon", "Tue", "Wed", "Thu", "Fri"]}
  multiple
  value={selectedDays}
  onChangeValue={(e) => setSelectedDays(e.detail.map(i => i.value))}
/>
```

---

### 6.3 Navigation and layout

---

#### `ms-accordion`

Collapsible sections accordion.

| Prop           | Type                 | Default | Description                                              |
| -------------- | -------------------- | ------- | -------------------------------------------------------- |
| `activeIndex`  | `number \| number[]` | `-1`    | Index(es) of initially open section(s). `-1` = all closed |
| `multiple`     | `boolean`            | `false` | Allow multiple open sections simultaneously              |
| `disabled`     | `number[]`           | `[]`    | Indexes of disabled sections — **JS prop only, not HTML attribute** |
| `headerClass`  | `string`             | `''`    | Extra CSS class applied to every header button           |
| `contentClass` | `string`             | `''`    | Extra CSS class applied to every content panel           |

**Events:**

| Event       | Payload                                                       | Description      |
| ----------- | ------------------------------------------------------------- | ---------------- |
| `tabOpen`   | `{ index: number; activeIndexes: number[] }`                  | Section opened   |
| `tabClose`  | `{ index: number; activeIndexes: number[] }`                  | Section closed   |
| `tabChange` | `{ index: number; isOpen: boolean; activeIndexes: number[] }` | Any state change |

**Slots:**

- `header-{n}` — header content for section n (zero-based)
- `content-{n}` — body content for section n

> **No `ms-accordion-tab` child component.** The accordion detects sections by counting `header-*` slots in the DOM. Use named slots `header-{n}` / `content-{n}` directly.

> **`disabled` must be a JS prop.** It is not reflected to an HTML attribute. Pass it as a property: `disabled={[1, 3]}` in React, `.disabled="${[1, 3]}"` in lit-html. Setting it as a string attribute has no effect.

**Accessibility and keyboard navigation:** each header `<button>` has `aria-expanded`/`aria-controls`; each content panel has `role="region"`/`aria-labelledby`. Headers stay in normal Tab order — arrow keys are an enhancement on top of that, not a replacement: when a header has focus, `ArrowUp`/`ArrowDown` (wrapping) and `Home`/`End` move focus between enabled headers.

```html
<!-- Vanilla — all sections closed by default (activeIndex defaults to -1) -->
<ms-accordion>
  <span slot="header-0">Section 1</span>
  <div slot="content-0">Content of the first section</div>

  <span slot="header-1">Section 2</span>
  <div slot="content-1">Content of the second section</div>
</ms-accordion>
```

```tsx
// React — open section 0 on load
<MsAccordion activeIndex={0} onTabChange={(e) => console.log(e.detail)}>
  <span slot="header-0">Section 1</span>
  <div slot="content-0">Content of the first section</div>
  <span slot="header-1">Section 2</span>
  <div slot="content-1">Content of the second section</div>
</MsAccordion>

// React — multiple mode, sections 0 and 2 open, section 1 disabled
<MsAccordion multiple activeIndex={[0, 2]} disabled={[1]}>
  <span slot="header-0">Section 1</span>
  <div slot="content-0">Content 1</div>
  <span slot="header-1">Section 2 (disabled)</span>
  <div slot="content-1">Content 2</div>
  <span slot="header-2">Section 3</span>
  <div slot="content-2">Content 3</div>
</MsAccordion>
```

---

#### `ms-tabs`

Tab interface. `shadow: false` — external CSS penetrates.

| Prop           | Type                                        | Default     | Description                                       |
| -------------- | ------------------------------------------- | ----------- | ------------------------------------------------- |
| `activeTab`    | `number` (mutable)                          | `0`         | Index of the active tab (zero-based)              |
| `hierarchy`    | `'primary' \| 'secondary' \| 'tertiary'`   | `'primary'` | Visual variant of the tab bar                     |
| `disabledTabs` | `number[]`                                  | `[]`        | Indexes of disabled tabs — **JS-only, not HTML attribute** |

> **Tab list is read once at `componentWillLoad`.** Dynamically adding or removing child elements after mount will not update the tab buttons or panels.

**Accessibility and keyboard navigation:** the tab bar is `role="tablist"`; each button is `role="tab"` with `aria-selected`/`aria-controls`/`aria-disabled` and a roving `tabIndex` (only the active tab is `0`, the rest are `-1` — so Tab moves focus to the tab bar once, not through every tab). Panels are `role="tabpanel"`/`aria-labelledby`. Once a tab button has focus, `ArrowLeft`/`ArrowRight` move focus **and immediately activate** that tab (automatic-activation model — no separate confirm step), wrapping around the ends and skipping disabled tabs; `Home`/`End` jump to the first/last enabled tab.

**Events:** `tabChange` — emits `{ index: number }`.

**Child element attributes** (set on direct children — read at load time to build tab buttons):

| Attribute   | Description                                    |
| ----------- | ---------------------------------------------- |
| `label`     | Tab header label text                          |
| `iconLeft`  | URL of an icon shown to the left of the label  |
| `iconRight` | URL of an icon shown to the right of the label |

**Slots:** `tab-{n}` — content panel for tab n (zero-based). The same child element provides both the `label` attribute (for the header button) and `slot="tab-n"` (for its content).

```html
<!-- Vanilla -->
<ms-tabs>
  <div label="Home" slot="tab-0">Home content</div>
  <div label="Profile" slot="tab-1">Profile content</div>
</ms-tabs>
```

```tsx
// React
<MsTabs
  activeTab={activeTab}
  disabledTabs={[2]}
  onTabChange={(e) => setActiveTab(e.detail.index)}
>
  <div label="Home" slot="tab-0">
    Home content
  </div>
  <div label="Profile" slot="tab-1">
    Profile content
  </div>
  <div label="Settings" slot="tab-2">
    Settings content
  </div>
</MsTabs>
```

---

#### `ms-breadcrumb`

Breadcrumb navigation.

| Prop            | Type               | Default                  | Description                                       |
| --------------- | ------------------ | ------------------------ | ------------------------------------------------- |
| `home`          | `BreadcrumbItem`   | `null`                   | Home item — **JS prop only, not HTML attribute**  |
| `model`         | `BreadcrumbItem[]` | `[]`                     | Route items — **JS prop only, not HTML attribute** |
| `separatorIcon` | `IconName`         | `'breadcrumb-separator'` | Icon between items (any icon from the registry)   |
| `idPrefix`      | `string`           | `'ms-breadcrumb'`        | Prefix for generated item IDs                     |
| `customClass`   | `string`           | `''`                     | Extra CSS class on the `<nav>` element            |

**Event:** `itemSelect` — `CustomEvent<BreadcrumbItem>`, emitted on click of any non-disabled item (home or model), **before** `item.command()` runs. Call `event.preventDefault()` to cancel the built-in `<a href>` navigation — e.g. to hand the URL to an SPA router instead of a full page load. `item.command()` is still the way to run custom logic per item; `itemSelect` is the simpler hook when you just need to intercept navigation globally.

**`BreadcrumbItem` interface:**

```typescript
interface BreadcrumbItem {
  id?: string;        // explicit element id
  label?: string;     // display text
  icon?: IconName;    // icon from the registry (e.g. 'home', 'search')
  url?: string;       // navigation link; omit for non-navigable items
  target?: string;    // link target ('_blank', etc.)
  disabled?: boolean; // disables click and applies disabled style
  hidden?: boolean;   // removes item from the rendered breadcrumb
  slotName?: string;  // named slot to inject custom content for this item
  template?: string | ((item, options) => string);  // HTML string or function
  command?(event: { originalEvent: Event; item: BreadcrumbItem }): void;  // click callback
}
```

> **`home` and `model` must be set as JS properties**, not HTML attributes. The component ignores string attributes for these props.

> **Slots:** use `slotName` on the item + a matching `slot="..."` child element for fully custom item content.
> - Home item: `slotName: 'home'` → `<span slot="home">...</span>`
> - Model items: `slotName: 'my-slot'` → `<span slot="my-slot">...</span>` (or auto `link-{n}` if omitted)

```tsx
// React — set props via ref
import { useRef, useEffect } from 'react';

function AppBreadcrumb({ section, page }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.home = { icon: 'home', command: () => navigate('/') };
    ref.current.model = [
      { label: section, url: `/${section}` },
      { label: page, disabled: true },
    ];
  }, [section, page]);

  return <ms-breadcrumb ref={ref} />;
}

// React — with hidden items and custom click handler
ref.current.model = [
  { label: 'Users', url: '/users' },
  { label: 'Reports', hidden: true },       // excluded from render
  { label: 'Profile', disabled: true },     // shown but not clickable
  {
    label: 'Settings',
    command: ({ originalEvent, item }) => {
      originalEvent.preventDefault();
      navigate(item.url);
    },
  },
];
```

---

#### `ms-navbar`

Collapsible lateral navigation sidebar with nested menus, accordion behavior and programmatic control. `shadow: false` — external CSS penetrates. This is a **full page layout component** — the default slot is the main content area that sits next to the sidebar.

| Prop               | Type                     | Default | Description                                      |
| ------------------ | ------------------------ | ------- | ------------------------------------------------ |
| `items`            | `NavbarItem[] \| string` | `[]`    | Navigation items (JS array or JSON string)       |
| `activeItemId`     | `string` (mutable)       | `''`    | ID of the currently active item (highlighted); reactive via `@Watch` |
| `defaultCollapsed` | `boolean`                | `true`  | Start the sidebar collapsed                      |
| `showToggleButton` | `boolean`                | `false` | Show a built-in toggle chevron button at the bottom of the sidebar |
| `accordion`        | `boolean`                | `true`  | Auto-close sibling submenus when one opens       |
| `customClass`      | `string`                 | `''`    | Extra CSS class on the host element              |

**Events:**

| Event           | Payload   | Description                                                    |
| --------------- | --------- | -------------------------------------------------------------- |
| `sidebarToggle` | `boolean` | Emits `isCollapsed` — `true` when sidebar just collapsed       |
| `itemSelect`    | `string`  | Emits the `id` of the leaf item clicked (not parent/group items). Call `event.preventDefault()` to cancel the built-in `window.location.href` navigation for items that have a `url` — e.g. to hand the URL to an SPA router instead |

**Public methods:**

| Method       | Description                     |
| ------------ | ------------------------------- |
| `collapse()` | Collapse the sidebar            |
| `expand()`   | Expand the sidebar              |
| `toggle()`   | Toggle collapsed/expanded state |

**Slots:**

| Slot      | Description                                                                         |
| --------- | ----------------------------------------------------------------------------------- |
| `brand`   | Brand/logo area in the header — clicking it also toggles the sidebar               |
| `end`     | Right side of the header (e.g. user avatar, icons)                                  |
| default   | Main content area rendered next to the sidebar (`ms-navbar-main` div)              |

**Behavior:**
- **Collapsed + desktop**: items show as icon-only buttons with `ms-tooltip` (label on hover)
- **Mobile (`< 768px`)**: sidebar becomes an overlay drawer; no tooltip shown in collapsed state
- **Click outside**: clicking anywhere outside the sidebar while it is open collapses it automatically

**`NavbarItem` / `NavbarChildItem` interfaces:**

```typescript
interface NavbarItem {
  id?: string;                       // optional — but required for activeItemId and itemSelect to work
  label: string;
  icon?: string;                     // HTML string (e.g. '<ms-icon>') or CSS class string
  url?: string;                      // navigates via window.location.href; '#' is ignored
  action?: (event: Event) => void;   // receives CustomEvent with { id, label, originalEvent }
  disabled?: boolean;
  customClass?: string;              // applied to the item button element
  type?: 'divider' | 'item';        // 'divider' renders a separator line
  children?: NavbarChildItem[];
}

interface NavbarChildItem {
  id?: string;
  text?: string;                     // display text (not label)
  icon?: string;
  url?: string;
  disabled?: boolean;
  type?: 'divider' | 'item';
  action?: (event: Event) => void;   // receives CustomEvent with { id, text, originalEvent }
  children?: NavbarChildItem[];      // supports recursive nesting
}
```

```tsx
// React — full layout with slots and programmatic control
import { useRef } from "react";

const navRef = useRef<HTMLMsNavbarElement>(null);

const items = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: '<ms-icon name="home"></ms-icon>',
    url: "/dashboard",
  },
  {
    id: "reports",
    label: "Reports",
    icon: '<ms-icon name="chart"></ms-icon>',
    children: [
      { id: "sales", text: "Sales", url: "/reports/sales" },
      { id: "users", text: "Users", url: "/reports/users" },
      { type: "divider" },
      { id: "export", text: "Export", action: (e) => handleExport(e) },
    ],
  },
];

<MsNavbar
  ref={navRef}
  items={items}
  activeItemId={activeId}
  showToggleButton
  onItemSelect={(e) => setActiveId(e.detail)}
  onSidebarToggle={(e) => setCollapsed(e.detail)}
>
  <span slot="brand"><img src="/logo.svg" /></span>
  <span slot="end"><UserAvatar /></span>
  <MainContent />  {/* default slot = main content area */}
</MsNavbar>

// Programmatic control:
navRef.current?.collapse();
navRef.current?.expand();
navRef.current?.toggle();
```

---

#### `ms-sidebar`

Off-canvas panel (drawer) that slides in from any edge of the screen. `shadow: false` — external CSS penetrates.

| Prop          | Type                                     | Default  | Description                                                                                                      |
| ------------- | ---------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `visible`     | `boolean` (mutable)                      | `false`  | Show/hide the panel; component sets it to `false` internally when closing                                        |
| `position`    | `'left' \| 'right' \| 'top' \| 'bottom'` | `'left'` | Edge from which the panel slides in                                                                              |
| `dismissible` | `boolean`                                | `true`   | Close the panel when clicking the backdrop overlay                                                               |
| `fullScreen`  | `boolean`                                | `false`  | Expand to fill the entire viewport                                                                               |
| `content`     | `boolean`                                | `false`  | When `true`, use the named slot `content` instead of the default layout (which includes a built-in close button) |
| `idComponent` | `string`                                 | —        | HTML `id` applied to the outer container `div` (not the panel itself)                                           |
| `class`       | `string`                                 | —        | Extra CSS class on the panel element                                                                             |

**Events:** `hide` — emits `false` when the panel closes (always `false`).

**Slots:**

- default — panel content rendered with a built-in close button header
- `content` — full control over panel content (only when `content=true`)

```tsx
// React
<MsSidebar
  visible={drawerOpen}
  position="right"
  onHide={() => setDrawerOpen(false)}
>
  <p>Drawer content here</p>
</MsSidebar>
```

> **⚠️ ZEUS — `removeChild` crash:** El overlay (`ms-sidebar-overlay`) usa renderizado condicional en Stencil y puede lanzar `NotFoundError: removeChild` en race conditions durante el ciclo de vida de single-spa. El panel en sí es seguro; solo el overlay tiene el problema. Fix pendiente en la librería (ver [removeChild en componentes con popup/overlay](#removechild-en-componentes-con-popupoverlay--estado-de-la-librería)). **Workaround:** implementar el panel lateral como `<aside>` nativo con `position: fixed` en lugar de `MsSidebar`.

```tsx
// Workaround ZEUS — panel lateral sin MsSidebar para evitar el crash
const [open, setOpen] = useState(false);

<>
  {/* Overlay semitransparente */}
  {open && (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }}
      onClick={() => setOpen(false)}
    />
  )}
  <aside
    style={{
      position: 'fixed',
      top: 0,
      right: open ? 0 : '-420px',
      width: '400px',
      height: '100vh',
      background: 'white',
      boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
      transition: 'right 0.3s ease',
      zIndex: 1000,
      overflow: 'auto',
      padding: '1.5rem',
    }}
  >
    <p>Contenido del panel</p>
  </aside>
</>
```

---

#### `ms-steps`

Step indicator for a wizard or process. `shadow: false` — external CSS penetrates.

| Prop          | Type         | Default     | Description                                                   |
| ------------- | ------------ | ----------- | ------------------------------------------------------------- |
| `steps`       | `StepItem[]` | `undefined` | Steps data. When omitted the component uses named slots instead |
| `activeIndex` | `number` (mutable) | `0`  | Current active step index (0-based); reactive via `@Watch`    |
| `readonly`    | `boolean`    | `true`      | When `true`, all steps are non-clickable (disabled)           |
| `customClass` | `string`     | `undefined` | Extra CSS class on the `<nav>` element                        |

**`StepItem` interface:**

```typescript
interface StepItem {
  label?: string;                       // step label text
  icon?: string;                        // CSS class for an icon (e.g. 'pi pi-user')
  disabled?: boolean;                   // disables this specific step
  command?: (event?: any) => void;      // callback fired on click; receives { originalEvent, item, index }
  template?: string;                    // HTML string — replaces the default number + icon + label marker
}
```

> **Two rendering modes:**
> - **`steps` prop provided** → renders from the array using `renderStepMarker` (number, icon, label)
> - **`steps` not provided** → counts named slot elements and renders slots `step-{0}`, `step-{1}`, etc.

> **Clicking active or disabled step does nothing.** No event is emitted.

**Accessibility and keyboard navigation:** the active step has `aria-current="step"`; disabled/readonly steps get `aria-disabled="true"`. When `readonly={false}`, step buttons form a roving-tabindex arrow-key group (only the clickable step is `tabIndex=0`): `ArrowRight`/`ArrowDown` moves to the next enabled step, `ArrowLeft`/`ArrowUp` to the previous, `Home`/`End` jump to the first/last enabled step, wrapping around. In the default `readonly={true}` mode nothing is interactive by mouse or keyboard.

**Events:**

| Event        | Payload                                       | Description                                     |
| ------------ | --------------------------------------------- | ----------------------------------------------- |
| `stepChange` | `number`                                      | Emitted on click; the new active step index     |
| `stepSelect` | `{ originalEvent: Event, item: StepItem \| null, index: number }` | Same click, full context |

**Slots:** `step-{n}` — custom marker for step n (slot mode only, when `steps` prop is not set).

```tsx
// React — props mode
const steps = [
  { label: "Personal data" },
  { label: "Address", icon: "pi pi-map-marker" },
  { label: "Confirmation" },
];

<MsSteps
  steps={steps}
  activeIndex={currentStep}
  readonly={false}
  onStepChange={(e) => setCurrentStep(e.detail)}
/>

// React — slot mode (no steps prop)
<MsSteps activeIndex={currentStep} readonly={false} onStepChange={(e) => setCurrentStep(e.detail)}>
  <span slot="step-0">Personal data</span>
  <span slot="step-1">Address</span>
  <span slot="step-2">Confirmation</span>
</MsSteps>
```

---

### 6.4 Display / Visualization

---

#### `ms-badge`

Status badge/label.

| Prop       | Type                                           | Default   | Description                             |
| ---------- | ---------------------------------------------- | --------- | --------------------------------------- |
| `value`    | `string`                                       | —         | Badge text                              |
| `severity` | `'info' \| 'success' \| 'warning' \| 'danger'` | —         | Color variant                           |
| `size`     | `'small' \| 'medium' \| 'large'`               | `'small'` | Size — **no `'xlarge'` option**         |
| `class`    | `string`                                       | —         | Extra CSS class on the badge element    |

> **Severity omitida:** aplica la clase CSS `badge-default` (color neutro). No usar `severity="default"` — ese valor no existe; simplemente omitir el prop.

**Accessibility:** severity is conveyed by color alone visually, so when `severity` is one of `info`/`success`/`warning`/`danger`, a visually-hidden screen-reader-only label is prepended to the announced text (e.g. "Success: Active"). This does **not** happen when `severity` is omitted or set to any non-recognized string. Because of this, always give `value` real, self-describing text (e.g. `"Active"`) rather than relying on `severity` alone to convey meaning — a bare color swatch with no descriptive text is still inaccessible even with the severity label.

```html
<ms-badge value="Active" severity="success"></ms-badge>
<ms-badge value="3" severity="danger" size="small"></ms-badge>
<ms-badge value="Pending"></ms-badge>  <!-- sin severity → badge-default -->
```

```tsx
// React
<MsBadge value={row.status} severity={row.active ? 'success' : 'danger'} />
<MsBadge value="New" severity="info" size="medium" />
```

---

#### `ms-icon`

Displays an SVG icon from the internal registry. `shadow: false`.

| Prop          | Attribute      | Type               | Default          | Description                                               |
| ------------- | -------------- | ------------------ | ---------------- | --------------------------------------------------------- |
| `name`        | `name`         | `IconName`         | —                | Icon name — invalid names log a warning and render nothing |
| `size`        | `size`         | `number \| string` | `24`             | Icon size: number → px, string → used as-is (e.g. `'2rem'`, `'100%'`) |
| `color`       | `color`        | `string`           | `'currentColor'` | Sets SVG **stroke** color (`fill="none"` — fill colors have no effect) |
| `customClass` | `custom-class` | `string`           | —                | Extra CSS class on the host element                       |

**Available icon names:**

```
// General
filter · info · copy · menu · download · x · home · search · calendar
alert-circle · alert-triangle · arrow-left · arrow-right · bell · check
check-circle · chevron-down · chevron-up · chevron-left · chevron-right
edit · eye · eye-off · lock · mail · minus · plus · refresh · settings
trash · unlock · upload · user

// Navigation (ZEUS sidebar)
nav-administration · nav-agent · nav-business-intelligence · nav-callcenter-ai
nav-compliance · nav-customer · nav-finance · nav-home · nav-operations
nav-owner · nav-product · nav-sales · nav-zeus-lab
```

```html
<ms-icon name="home" size="32" color="#007bff"></ms-icon>
<ms-icon name="check" color="green"></ms-icon>
<ms-icon name="trash" size="1.5rem"></ms-icon>
```

```tsx
// React
<MsIcon name="settings" size={20} color="var(--maxi-color-primary)" />
```

---

#### `ms-image`

Image component with optional click-to-preview modal (zoom + rotate). Uses **`shadow: true`**.

| Prop            | Attribute        | Type               | Default | Description                                                                         |
| --------------- | ---------------- | ------------------ | ------- | ----------------------------------------------------------------------------------- |
| `src` *         | `src`            | `string`           | —       | Image URL — **required**                                                            |
| `alt` *         | `alt`            | `string`           | —       | Alt text — **required**                                                             |
| `width`         | `width`          | `number \| string` | —       | Container width — accepts number (→ px) or `'200'` / `'200px'`; `'50%'`/`'auto'` silently ignored |
| `height`        | `height`         | `number \| string` | —       | Container height — same rules as `width`                                            |
| `preview`       | `preview`        | `boolean`          | `false` | Enable click-to-preview modal; shows a magnifier overlay on hover                  |
| `zoomSrc`       | `zoom-src`       | `string`           | —       | URL for the higher-res image shown in the modal; falls back to `src` if not set    |
| `indicatorIcon` | `indicator-icon` | `string`           | —       | URL for a custom overlay indicator icon; defaults to a built-in magnifier SVG      |
| `loading`       | `loading`        | `'lazy' \| 'eager'`| `'lazy'`| Passed straight through to the native `<img loading>` attribute                     |
| `srcset`        | `srcset`         | `string`           | —       | Passed straight through to `<img srcset>`                                          |
| `sizes`         | `sizes`          | `string`           | —       | Passed straight through to `<img sizes>` — **only applied when `srcset` is also set** |
| `fallbackSrc`   | `fallback-src`   | `string`           | —       | Swapped into `<img src>` if the main image fails to load                            |

> **`width`/`height` only accept px values.** Passing `'50%'`, `'auto'`, or `'2rem'` is silently ignored — the dimension will be unset.

**Error handling:** if the image fails to load, `ms-image` swaps to `fallbackSrc` (when set) and emits `imageError` with `{ src }` (the URL that failed); `srcset` is suppressed while in the error state (falls back to plain `src`/`fallbackSrc`). Changing `src` afterward automatically clears the error state — no consumer-side bookkeeping needed to retry with a new URL.

**Preview modal** (requires `preview=true`):
- Click image → opens modal with zoom and rotation controls
- Zoom range: 0.4× – 1.5× (step 0.1)
- Keyboard shortcuts inside the open modal: `Escape` close · `←`/`→` rotate ±90° · `+`/`-` zoom in/out
- **Known accessibility gap:** the image gets `tabindex="0"`/`aria-haspopup="dialog"` when `preview` is set, but there is currently no keyboard handler to *open* the modal (Enter/Space) — only a mouse click opens it — and the opened modal (`role="dialog" aria-modal="true"`) is never given focus, so there's no focus trap. Don't rely on the preview modal being keyboard-operable end-to-end yet.

**Events:** `imageError` — `{ src: string }`, emitted once per failed load (guarded so it doesn't re-fire for the same error state).

**Slots:** `indicatorIcon` — custom overlay indicator content (overrides `indicatorIcon` prop)

**Shadow parts:** `image` · `indicator` · `indicator-icon` · `modal-image`

```html
<!-- Basic -->
<ms-image src="/photo.jpg" alt="Product photo" width="300" height="200"></ms-image>

<!-- Preview with separate zoom image -->
<ms-image
  src="/thumb.jpg"
  alt="Certificate"
  width="200"
  preview
  zoom-src="/certificate-hires.jpg"
></ms-image>
```

```tsx
// React
<MsImage src="/photo.jpg" alt="Product" width={300} height={200} preview />
```

---

#### `ms-message`

Inline alert / message banner. `shadow: true` — external CSS does not penetrate; use CSS custom properties for theming.

| Prop          | Type                                                          | Default  | Description              |
| ------------- | ------------------------------------------------------------- | -------- | ------------------------ |
| `variant`     | `'danger' \| 'success' \| 'warning' \| 'info' \| 'secondary'` | `'info'` | Color / semantic variant |
| `noIcon`      | `boolean`                                                     | `false`  | Hide the built-in icon   |
| `closable`    | `boolean`                                                     | `false`  | Shows a close button; clicking it un-renders the message entirely and emits `closeEvent` |
| `customClass` | `string`                                                      | `''`     | Extra CSS class on inner container |

> **Content via slot:** there is no `text` prop. Place content in the **default slot**.

> **No `severity` prop, no `life`.** Use `variant` instead of `severity`. (There **is** a `closable` prop — see below.)

> **`secondary` icon:** `secondary` variant uses the same icon as `info` (both fall to the default case internally).

**Closing:** set `closable` to show a dismiss button (uses the shared `CloseIcon`). Clicking it sets internal state so the component renders `<Host></Host>` (fully empty) and emits `closeEvent` (no payload). There's no prop to bring it back afterward — remount the component or gate it behind your own state if you need to show it again.

**Accessibility:** `variant="danger"` renders with `role="alert" aria-live="assertive"` (interrupts screen readers immediately); every other variant uses `role="status" aria-live="polite"`. Both also get `aria-atomic="true"`.

**Events:** `closeEvent` — no payload, fired once when the close button (shown via `closable`) is clicked.

**Slots:** default — message content (text, HTML, or other components).

```html
<ms-message variant="success"> Changes saved successfully </ms-message>

<ms-message variant="danger">
  <strong>Error:</strong> Could not connect to the server.
</ms-message>

<ms-message variant="warning" closable>
  This action cannot be undone.
</ms-message>
```

```tsx
// React
<MsMessage variant="warning">
  Please review the highlighted fields before continuing.
</MsMessage>

// React — closable
<MsMessage variant="danger" closable onCloseEvent={() => setShowError(false)}>
  Could not connect to the server.
</MsMessage>
```

---

#### `ms-notification`

Floating toast notification. Controlled entirely via **props** — there is no `show()` method. `shadow: false` — external CSS penetrates.

| Prop          | Type                                                                                                          | Default       | Description                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------- |
| `idComponent` | `string`                                                                                                      | `undefined`   | HTML `id` for the element                                |
| `visible`     | `boolean`                                                                                                     | `false`       | Show/hide the notification (`reflect: true`, `mutable: true`) |
| `severity`    | `'info' \| 'success' \| 'warning' \| 'alert'`                                                                 | `'info'`      | Semantic type                                            |
| `summary`     | `string \| null`                                                                                              | `null`        | Title / summary text                                     |
| `detail`      | `string \| null`                                                                                              | `null`        | Body / detail text                                       |
| `life`        | `number \| null`                                                                                              | `3000`        | Auto-hide delay in ms — see "persistent toasts" below     |
| `position`    | `'top-left' \| 'top-center' \| 'top-right' \| 'center' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'top-right'` | Screen position                                          |
| `closable`    | `boolean`                                                                                                     | `false`       | Shows a manual close button                              |
| `stackIndex`  | `number`                                                                                                      | `0`           | Manual stacking offset — see "stacking multiple toasts" below |

> **Severity values:** `'info'`, `'success'`, `'warning'`, `'alert'`. Not `'warn'` or `'error'`.

> **No `show()` method.** Toggle `visible` to show/hide.

**Persistent toasts:** `life={null}` (or `0`, or a negative number) now makes the toast **persistent** — no auto-dismiss timer is ever started. It only hides via the close button (`closable`) or by externally setting `visible={false}`. Use this instead of any manual `setTimeout` workaround.

**Recommended pattern — listen to `visibleChange`, don't manually reset state:**

```tsx
const [notif, setNotif] = useState({
  visible: false,
  severity: "info",
  summary: "",
  detail: "",
});

function showSuccess(msg: string) {
  setNotif({ visible: true, severity: "success", summary: "Done", detail: msg });
}

<MsNotification
  visible={notif.visible}
  severity={notif.severity as any}
  summary={notif.summary}
  detail={notif.detail}
  life={3000}
  closable
  onVisibleChange={(e) => setNotif((n) => ({ ...n, visible: e.detail }))}
  onCloseEvent={() => setNotif((n) => ({ ...n, visible: false }))}
/>;
```

**Stacking multiple toasts:** showing several `ms-notification` instances at the same `position` simultaneously **auto-cascades** them even with no `stackIndex` set (an internal per-position registry computes the offset). Set `stackIndex` explicitly only if you need manual control over the cascade order. Whether the stack visually cascades up or down is derived from `position` (any `bottom-*` position stacks upward).

**Interaction:** hovering a notification pauses its auto-dismiss countdown; moving the pointer away resumes it with the remaining time.

**Accessibility:** `severity="alert"` renders with `role="alert" aria-live="assertive"`; every other severity uses `role="status" aria-live="polite"` (both also `aria-atomic="true"`). The summary/detail/icon content is only mounted in the DOM while the toast is visible (rather than just CSS-hidden) — this is intentional: a live region whose text never actually changes often isn't (re-)announced by assistive tech, so showing the same message twice needs a genuine DOM insertion each time, not just a visibility toggle.

**Events:**

| Event           | Payload   | Description                                                                 |
| --------------- | --------- | ---------------------------------------------------------------------------- |
| `visibleChange` | `boolean` | Fires every time `visible` changes, for **any** reason (life timeout, close button, or an external prop change) — keep your own state in sync from this instead of manually re-arming a timer |
| `closeEvent`    | —         | Fires once when the manual close button (shown via `closable`) is clicked; closes instantly, skipping the fade-out transition |

---

#### `ms-skeleton`

Loading skeleton placeholder. `shadow: true` — external CSS does not penetrate.

| Prop           | Type             | Default | Rendered default | Description                                  |
| -------------- | ---------------- | ------- | ---------------- | -------------------------------------------- |
| `width`        | `string \| null` | `null`  | `'100%'`         | CSS width                                    |
| `height`       | `string \| null` | `null`  | `'1rem'`         | CSS height                                   |
| `borderRadius` | `string \| null` | `null`  | `'4px'`          | CSS border-radius                            |
| `shape`        | `string \| null` | `null`  | —                | `'text'`, `'avatar'`, or `'card'` apply a built-in preset (see below); any other value has no style effect and is only useful as an HTML attribute for a CSS selector hook |
| `class`        | `string \| null` | `null`  | —                | Extra CSS class on the inner div             |

> **No `animation` prop.** The shimmer animation is always active.

> **`shape` presets:** `'text'` (100% × 1rem, 4px radius — same as the component's own defaults), `'avatar'` (40px × 40px, 50% radius — a circle), `'card'` (100% × 200px, 8px radius). Any explicit `width`/`height`/`borderRadius` you pass overrides the matching preset dimension. Any other/unrecognized `shape` value falls through with zero style effect.

```html
<ms-skeleton height="200px"></ms-skeleton>
<ms-skeleton height="1rem" width="60%"></ms-skeleton>

<!-- Presets -->
<ms-skeleton shape="avatar"></ms-skeleton>
<ms-skeleton shape="card"></ms-skeleton>

<!-- Circle via explicit borderRadius (equivalent to shape="avatar" at custom size) -->
<ms-skeleton width="50px" height="50px" borderRadius="50%"></ms-skeleton>
```

---

#### `ms-spinner`

12-dot pulsing loading indicator. `shadow: true` — external CSS does not penetrate.

| Prop     | Type     | Default     | Description                      |
| -------- | -------- | ----------- | -------------------------------- |
| `width`  | `string` | `'2rem'`    | CSS width of the spinner         |
| `height` | `string` | `'2rem'`    | CSS height of the spinner        |
| `color`  | `string` | `'#8CA2D4'` | Fill color of the animation dots |
| `label`  | `string` | `'Loading'` | Accessible name announced to screen readers |

**Accessibility:** the host renders `role="status" aria-live="polite" aria-label={label}` — the spinner announces itself to assistive tech with zero extra markup needed from the consumer. `ms-button`'s `loading` state renders an internal `ms-spinner` without setting `label`, so a loading button already announces "Loading" for free.

```html
<ms-spinner></ms-spinner>
<ms-spinner width="3rem" height="3rem" color="#007bff"></ms-spinner>
<ms-spinner label="Loading results..."></ms-spinner>
```

---

### 6.5 Interactive and complex

---

#### `ms-button`

Main button component. Uses **shadow DOM** for full encapsulation.

| Prop          | Type                                                                                                                                              | Default     | Description                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| `label`       | `string`                                                                                                                                          | —           | Button text. When omitted, renders a `<slot>` for custom content |
| `variant`     | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'outline-primary' \| 'outline-secondary' \| 'outline-success' \| 'outline-warning' \| 'outline-danger'` | `'primary'` | Visual variant — **no `'info'`, `'text'` or `'outlined'`** |
| `size`        | `'small' \| 'medium' \| 'large'`                                                                                                                  | `'medium'`  | Size                                                         |
| `type`        | `'button' \| 'submit' \| 'reset'`                                                                                                                 | `'button'`  | HTML button type                                             |
| `disabled`    | `boolean`                                                                                                                                         | `false`     | Disabled state                                               |
| `loading`     | `boolean`                                                                                                                                         | `false`     | Shows `MsSpinner` (1.5rem) and disables the button           |
| `icon`        | `string`                                                                                                                                          | —           | Image URL rendered as `<img>` inside the button              |
| `class`       | `string`                                                                                                                                          | —           | Applied to the host element **and** injected into shadow DOM |
| `customClass` | `string`                                                                                                                                          | —           | Injected into shadow DOM **only** — not duplicated on host   |

**Events:** `clickEvent` — emits `MouseEvent`. Not fired when `disabled` or `loading`.

> **Shadow DOM + external CSS injection.** When `class` or `customClass` is set, the component reads all rules from `document.styleSheets` matching those class names and re-injects them inside the shadow root (scoped to `.ms-button.{className}`). This allows external utility classes (Tailwind, project utilities) to style the inner button.

> **Icon-only mode.** When `icon` is set and `label` is omitted, the component adds the `only-icon` CSS class to the inner button for compact square styling.

> **Slot.** When `label` is omitted, the button renders a `<slot />` — pass custom JSX content as children.

```tsx
// React — standard variants
<MsButton label="Save" variant="primary" size="large" type="submit" loading={isSaving} onClickEvent={handleSave} />
<MsButton label="Cancel" variant="outline-primary" onClickEvent={() => router.back()} />
<MsButton label="Delete" variant="danger" onClickEvent={handleDelete} />
<MsButton label="Approve" variant="outline-success" onClickEvent={handleApprove} />

// React — icon-only (no label → only-icon mode)
<MsButton variant="secondary" icon="/icons/edit.svg" onClickEvent={handleEdit} />

// React — label + icon
<MsButton label="Export" variant="outline-primary" icon="/icons/download.svg" onClickEvent={handleExport} />

// React — custom slot content (no label prop)
<MsButton variant="primary" onClickEvent={handleClick}>
  <span>📄 Download PDF</span>
</MsButton>
```

---

#### `ms-calendar`

Date and time picker (datepicker).

| Prop                 | Attribute              | Type                                   | Default          | Description                                                                         |
| -------------------- | ---------------------- | -------------------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| `idComponent`        | `id-component`         | `string`                               | `'ms-calendar'`  | HTML `id`                                                                           |
| `class`              | `class`                | `string \| null`                       | `null`           | Extra CSS class on host wrapper                                                     |
| `label`              | `label`                | `string \| null`                       | `null`           | Floating label (enables label-floating layout)                                      |
| `placeholder`        | `placeholder`          | `string`                               | `'Select a date'`| Input placeholder                                                                   |
| `value`              | `value`                | `string \| number \| string[] \| null` | `null`           | Selected date(s). Single: `'MM/DD/YYYY'` or `'MM/DD/YYYY HH:mm'`. Range: `string[]`|
| `selectionMode`      | `selection-mode`       | `'single' \| 'range'`                  | `'single'`       | Selection mode — only these two values exist                                        |
| `minDate`            | **JS only**            | `Date \| null`                         | `null`           | Minimum selectable date — must be set as JS prop, no HTML attribute                 |
| `maxDate`            | **JS only**            | `Date \| null`                         | `null`           | Maximum selectable date — must be set as JS prop, no HTML attribute                 |
| `showIcon`           | `show-icon`            | `boolean`                              | `false`          | Show calendar icon button inside the input                                          |
| `showTime`           | `show-time`            | `boolean`                              | `false`          | Show hour/minute time picker below the calendar                                     |
| `hourFormat`         | `hour-format`          | `'12' \| '24'`                         | `'24'`           | Time format — `'12'` shows AM/PM toggle                                             |
| `stepHour`           | `step-hour`            | `number`                               | `1`              | Hour increment step                                                                 |
| `stepMinute`         | `step-minute`          | `number`                               | `1`              | Minute increment step                                                               |
| `showHourControls`   | `show-hour-controls`   | `boolean`                              | `true`           | Show +/− buttons for hours                                                          |
| `showMinuteControls` | `show-minute-controls` | `boolean`                              | `true`           | Show +/− buttons for minutes                                                        |
| `showAmPmControls`   | `show-am-pm-controls`  | `boolean`                              | `true`           | Show AM/PM toggle (only when `hourFormat='12'`)                                     |
| `closeOnSelect`      | `close-on-select`      | `boolean`                              | `false`          | Auto-close after selection. Ignored when `showTime=true`. Range: closes after end date |
| `disabled`           | `disabled`             | `boolean`                              | `false`          | Disabled                                                                            |
| `required`           | `required`             | `boolean`                              | `false`          | Required — validates automatically on blur/select                                   |
| `requiredMessage`    | `required-message`     | `string`                               | `'This field is required'` | Overrides the default required-field error text                          |
| `invalid`            | `invalid`              | `boolean`                              | `false`          | Force error state                                                                   |
| `errorMessage`       | `error-message`        | `string \| null`                       | `null`           | Error message shown when `invalid=true`                                             |

**Accessibility and keyboard navigation (day-grid view only):** the day grid is `role="grid"` (`aria-label` = the visible "Month Year"), with `role="row"` per week, `role="columnheader"` for weekday headers, and `role="gridcell"` per day (`aria-selected`, `aria-current="date"` on today, `aria-disabled` on out-of-range days). Only one cell is ever tab-stoppable (roving `tabindex`) — the focused date, or today/start date by default. Keyboard, once the grid has focus:

| Key | Action |
|---|---|
| `←` / `→` | Move focus ±1 day (crosses month boundaries automatically) |
| `↑` / `↓` | Move focus ±1 week (±7 days) |
| `Home` / `End` | Jump to the start/end of the current week |
| `PageUp` / `PageDown` | Move ±1 month |
| `Shift+PageUp` / `Shift+PageDown` | Move ±1 year |
| `Enter` / `Space` | Select the focused day (no-op if disabled by `minDate`/`maxDate`) |

> This keyboard/ARIA model applies **only to the day-grid view**. The month-list and year-list pickers (opened by clicking the header) are plain unstyled `<ul>`/`<li>` with no roles or keyboard support of their own.

**Events:**

| Event              | Payload                        | Description                                                                              |
| ------------------ | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `update`           | `string \| string[] \| null`   | Date value. Single: `'MM/DD/YYYY'` or `'MM/DD/YYYY HH:mm'`. Range: `['MM/DD/YYYY', 'MM/DD/YYYY']`. Reset: `null` |
| `validationChange` | `ValidationDetail`             | Fires on blur, select, and required/invalid changes                                      |

**Important:**
- `minDate` / `maxDate` are **JS-only props** — they cannot be set as HTML attributes. Always assign via JavaScript (React prop or `.minDate = new Date(...)`).
- `value` format emitted/expected is `MM/DD/YYYY`, not ISO 8601. Parse accordingly.
- Calendar auto-positions top/bottom based on available viewport space.

```tsx
// React — single date
<MsCalendar
  label="Birth date"
  selectionMode="single"
  showIcon
  onUpdate={(e) => setValue(e.detail)} // e.detail = 'MM/DD/YYYY'
/>

// React — range with JS-only minDate/maxDate
<MsCalendar
  label="Vacation period"
  selectionMode="range"
  showIcon
  ref={(el) => {
    if (el) {
      el.minDate = new Date();
      el.maxDate = new Date(Date.now() + 30 * 86400000);
    }
  }}
  onUpdate={(e) => setRange(e.detail)} // e.detail = ['MM/DD/YYYY', 'MM/DD/YYYY']
/>

// React — with time picker
<MsCalendar
  selectionMode="single"
  showTime
  showIcon
  hourFormat="12"
  stepMinute={15}
  onUpdate={(e) => setDateTime(e.detail)} // e.detail = 'MM/DD/YYYY HH:mm'
/>
```

---

#### `ms-carousel`

Item carousel with drag support and responsive design.

| Prop                | Attribute           | Type                 | Default     | Description                                        |
| ------------------- | ------------------- | -------------------- | ----------- | -------------------------------------------------- |
| `value`             | **JS only**         | `any[]`              | `[]`        | Array of items to display — must be a JS prop      |
| `numVisible`        | `num-visible`       | `number`             | `1`         | Number of visible items at once                    |
| `numScroll`         | `num-scroll`        | `number`             | `1`         | Items advanced per navigation step                 |
| `infinite`          | `infinite`          | `boolean`            | `false`     | Wrap around at ends                                |
| `showNavigators`    | `show-navigators`   | `boolean`            | `true`      | Previous/next arrow buttons                        |
| `showIndicators`    | `show-indicators`   | `boolean`            | `true`      | Dot indicators (hidden when only 1 page)           |
| `autoplay`          | `autoplay`          | `boolean`            | `false`     | Auto-advance slides                                |
| `autoplayInterval`  | `autoplay-interval` | `number`             | `3000`      | Autoplay interval in ms                            |
| `responsiveOptions` | **JS only**         | `ResponsiveOption[]` | `undefined` | Breakpoint overrides — must be a JS prop           |
| `customClass`       | `custom-class`      | `string`             | `''`        | Extra CSS class on the carousel wrapper            |
| `dragThreshold`     | `drag-threshold`    | `number`             | `50`        | Min drag pixels to trigger navigation              |
| `pauseOnHover`      | `pause-on-hover`    | `boolean`            | `true`      | Pause autoplay while the pointer is over the carousel |
| `lazyLoad`          | `lazy-load`         | `boolean`            | `false`     | Marks `img`/`iframe` inside a slide `loading="lazy"` once it nears the visible area (via `IntersectionObserver`) |
| `lazyLoadBuffer`    | `lazy-load-buffer`  | `string`             | `'200px'`   | `IntersectionObserver` `rootMargin` used with `lazyLoad`  |

**No events** — this component does not emit custom events.

**Keyboard navigation and focus-based autoplay control:** the slide viewport (`.ms-carousel-content`) is a focusable region (`role="region"`, `aria-roledescription="carousel"`, `tabIndex=0`). `ArrowLeft`/`ArrowRight` step through slides; `Home`/`End` jump to the first/last page. Autoplay automatically pauses while the carousel has focus and resumes on blur — independent of the `pauseOnHover` mouse behavior, so keyboard users aren't fighting an auto-advancing carousel while interacting with it.

**Slots:** `item-carousel-{n}` for each item index (zero-based). One slot per item in `value`.

**`ResponsiveOption` interface:**

```typescript
interface ResponsiveOption {
  breakpoint: string;  // e.g. '768px' — matched against window.innerWidth
  numVisible?: number; // overrides prop if matched
  numScroll?: number;  // overrides prop if matched
}
```

**Important — `responsiveOptions` ordering:** The algorithm iterates the array and the last matching breakpoint wins. Sort descending (largest first) so the most specific breakpoint takes precedence.

```tsx
// React
const slides = [{ img: "/img1.jpg" }, { img: "/img2.jpg" }, { img: "/img3.jpg" }];

// Descending order required — largest breakpoint first
const responsive: ResponsiveOption[] = [
  { breakpoint: "1024px", numVisible: 3, numScroll: 1 },
  { breakpoint: "768px",  numVisible: 2, numScroll: 1 },
  { breakpoint: "480px",  numVisible: 1, numScroll: 1 },
];

<MsCarousel
  value={slides}
  numVisible={3}
  autoplay
  infinite
  responsiveOptions={responsive}
>
  {slides.map((s, i) => (
    <img key={i} slot={`item-carousel-${i}`} src={s.img} />
  ))}
</MsCarousel>
```

---

#### `ms-cascade-menu`

Cascading submenu. Detects desktop/mobile for the open behavior.

| Prop           | Attribute        | Type                          | Default   | Description                                                       |
| -------------- | ---------------- | ----------------------------- | --------- | ----------------------------------------------------------------- |
| `menuData`     | `menu-data`      | `CascadeMenuItem[] \| string` | `[]`      | Menu structure — array or JSON string (parsed internally)         |
| `minWidth`     | `min-width`      | `string`                      | `'220px'` | Panel minimum width (ignored when `width` is set)                 |
| `width`        | `width`          | `string`                      | `''`      | Panel fixed width — overrides `minWidth` when set                 |
| `activeItemId` | `active-item-id` | `string`                      | `''`      | ID of the active item. Parent items with an active child are also highlighted |
| `customClass`  | `custom-class`   | `string`                      | `''`      | Extra CSS class on the outer wrapper                              |

**Events:**

| Event       | Payload  | Description                                                              |
| ----------- | -------- | ------------------------------------------------------------------------ |
| `itemClick` | `string` | The `id` of the clicked item. **NOT the full item object** — emits `item.id` only |

**Behavior:**

- Desktop (`window.innerWidth > 768`): menu opens on hover **and** on keyboard focus (`:focus-within`) — submenus were hover-only before a past fix; a keyboard user tabbing/arrow-ing into a nested item can now actually see it, not just reach it invisibly. Auto-flips if overflowing right edge.
- Mobile (`window.innerWidth <= 768`): menu opens on tap, submenus expand/collapse on tap, full-width panel
- `action` callback on an item takes priority over URL navigation

**Accessibility and keyboard navigation:** lists are `role="menu"`, links are `role="menuitem"`, dividers are `role="separator"`. The slotted trigger element (whatever real focusable node lives inside it — button, link, etc.) automatically receives `aria-haspopup="menu"`/`aria-expanded`/`aria-controls`, kept in sync as the menu opens/closes. Keyboard: `ArrowUp`/`ArrowDown` move between sibling items, `ArrowRight` enters a submenu, `ArrowLeft` returns to the parent, `Home`/`End` jump to the first/last sibling, `Escape` closes the menu and returns focus to the trigger.

**`CascadeMenuItem` interface:**

```typescript
interface CascadeMenuItem {
  id?:       string;
  text?:     string;                      // display label — use `text`, NOT `label`
  icon?:     string;                      // HTML string (e.g. <svg>…</svg>) OR CSS class name
  url?:      string;                      // navigates via window.location.href (skipped if '#')
  disabled?: boolean;
  type?:     'item' | 'divider';          // 'divider' renders a separator line, no text needed
  children?: CascadeMenuItem[];           // use `children`, NOT `items`
  action?:   (event: Event) => void;      // custom handler; when set, closes menu and skips URL nav
}
```

> Note: `minWidth` and `width` fields exist in the interface but are **not used** by the renderer — only the component-level `minWidth`/`width` props apply to submenus.

```tsx
// React — IMPORTANT: use `text` (not `label`), `children` (not `items`)
const menu: CascadeMenuItem[] = [
  {
    id: "dashboard",
    text: "Dashboard",
    icon: '<svg width="16" height="16">…</svg>', // HTML string
    action: () => navigate("/dashboard"),        // action takes priority
  },
  {
    id: "reports",
    text: "Reports",
    children: [
      { id: "sales",  text: "Sales" },
      { id: "users",  text: "Users" },
      { type: "divider" },                       // no id/text needed
      { id: "export", text: "Export", disabled: true },
    ],
  },
];

<MsCascadeMenu
  menuData={menu}
  activeItemId="dashboard"
  onItemClick={(e) => console.log(e.detail)} // e.detail = 'dashboard' (string id)
/>
```

---

#### `ms-chart`

Chart component powered by Chart.js.

| Prop      | Attribute | Type                                                                                         | Default     | Description                                                    |
| --------- | --------- | -------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------- |
| `type`    | `type`    | `'bar'\|'line'\|'pie'\|'doughnut'\|'radar'\|'polarArea'\|'bubble'\|'scatter'`                | `'bar'`     | Chart type — changing it destroys and recreates the chart      |
| `data`    | **JS only** | `ChartData`                                                                                | —           | Chart.js data object — must be a JS prop                       |
| `options` | **JS only** | `ChartOptions`                                                                             | `{}`        | Chart.js options — merged on top of internal defaults          |
| `variant` | `variant` | `'primary'\|'secondary'\|'success'\|'warning'\|'danger'\|'info'\|'mixed'`                    | `'primary'` | Automatic color palette applied to datasets                    |
| `width`   | `width`   | `string`                                                                                     | `'100%'`    | Container width (CSS value)                                    |
| `height`  | `height`  | `string`                                                                                     | `'400px'`   | Container height (CSS value)                                   |
| `class`   | `class`   | `string`                                                                                     | `undefined` | Extra CSS class on the chart container div                     |

**Events:**

| Event        | Payload                                                     | Description                                     |
| ------------ | ----------------------------------------------------------- | ----------------------------------------------- |
| `chartReady` | Chart.js instance                                           | Fired after chart initializes                   |
| `chartClick` | `{ datasetIndex: number, index: number, value: number, label: string }` | Fired on click on a chart data point |

**Behavior:**

- `responsive: true` and `maintainAspectRatio: false` are always set internally; `options` can override them
- `variant` palette is applied only when a dataset does not already have `backgroundColor` set — existing colors are preserved
- For `pie`/`doughnut`, palette is applied per data point; for other types, per dataset
- `chartClick` only fires when clicking an actual data element (not empty canvas area)

```tsx
// React
const data = {
  labels: ["Jan", "Feb", "Mar"],
  datasets: [{ label: "Sales 2024", data: [120, 190, 300] }],
};

<MsChart
  type="bar"
  data={data}
  variant="primary"
  height="300px"
  onChartReady={(e) => console.log(e.detail)} // e.detail = Chart.js instance
  onChartClick={(e) => {
    const { datasetIndex, index, value, label } = e.detail;
    console.log(`Clicked ${label}: ${value}`);
  }}
/>
```

---

#### `ms-dialog`

Modal dialog with slots for header, body, and footer. `shadow: false`.

| Prop             | Attribute          | Type                                                                                              | Default    | Description                                                          |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| `visible`        | `visible`          | `boolean`                                                                                         | `false`    | Show/hide the dialog — `mutable + reflect`                           |
| `header`         | `header`           | `string \| any`                                                                                   | —          | Header text rendered as `<h3>`; if omitted, uses `slot="header"`     |
| `footer`         | `footer`           | `string \| any`                                                                                   | —          | Footer text rendered as `<h3>`; if omitted, uses `slot="footer"`     |
| `showFooter`     | `show-footer`      | `boolean`                                                                                         | **`false`** | Must be `true` to render the footer area — **default is false**     |
| `closable`       | `closable`         | `boolean`                                                                                         | `true`     | Show the × close button                                              |
| `position`       | `position`         | `'center'\|'top'\|'bottom'\|'left'\|'right'\|'top-left'\|'top-right'\|'bottom-left'\|'bottom-right'` | `'center'` | Dialog position on screen                                        |
| `styleComponent` | `style-component`  | `string`                                                                                          | —          | Inline CSS string applied to the dialog box (e.g. `"width:600px;"`) |
| `zIndex`         | `z-index`          | `string`                                                                                          | `'9000'`   | Z-index of the backdrop                                              |
| `class`          | `class`            | `string \| null`                                                                                  | `null`     | Extra CSS class on the dialog box                                    |
| `idComponent`    | `id-component`     | `string`                                                                                          | —          | `id` attribute on the dialog element                                 |

**Events:**

| Event  | Payload   | Description                                             |
| ------ | --------- | ------------------------------------------------------- |
| `hide` | `false`   | Fired when the × button is clicked **or** Escape is pressed (when `closable`); always emits `false`. This only emits the event — it does not set `visible` itself, so the consumer must react to it (as in the example below) |

**Focus management (built-in, no configuration needed):**
- **Escape** closes the dialog when `closable`.
- **Tab trap:** Tab/Shift+Tab cycles focus within the dialog only, wrapping at both ends. The trap descends into the **shadow roots** of slotted web components (e.g. the real `<button>` inside a slotted `<ms-button>`), so those inner controls are correctly included in the tab cycle.
- **Focus restore:** on close, focus returns to whatever element triggered the dialog's opening (again descending into a shadow root if the trigger itself was a web component like `<ms-button>`).

**Scroll locking:** while any `ms-dialog` is `visible`, the page's scroll is locked by adding a dedicated CSS class (`ms-dialog-scroll-lock`, defined in `global.css`/`global-zeclio.css`) to **both** `<html>` and `<body>` — it never reads or writes their inline `overflow` style directly, so it's safe to use alongside other independent scroll-lockers on the page (e.g. react-bootstrap's `Modal`/`Offcanvas`). Locking is reference-counted across every currently-open `ms-dialog` instance, so multiple simultaneously-open dialogs (stacked, or opened in sequence) don't unlock the page until the very last one closes.

**Slots:** `header` | default (body) | `footer`

> The `footer` slot is only rendered when `showFooter={true}`. Forgetting this prop is the most common mistake.

> **Header title overlaps the close button** when the text is long. Fix it by adding a `class` prop and scoping the CSS under it — never target `.ms-dialog-header` globally:
> ```tsx
> <MsDialog class="my-dialog" header="¡Bienvenido a ZEUS!" ...>
> ```
> ```css
> .my-dialog .ms-dialog-header h3 { padding-right: 2.5rem; flex: 1; min-width: 0; }
> .my-dialog .ms-dialog-close-btn { flex-shrink: 0; }
> ```

```tsx
// React
<MsDialog
  visible={visible}
  header="Confirm deletion"
  showFooter={true}
  onHide={() => setVisible(false)}
>
  <p>Are you sure you want to delete this record?</p>
  <div slot="footer">
    <MsButton
      label="Cancel"
      variant="outlined"
      onClickEvent={() => setVisible(false)}
    />
    <MsButton label="Delete" variant="danger" onClickEvent={handleDelete} />
  </div>
</MsDialog>
```

---

#### `ms-table`

Advanced data table with sorting, pagination, selection and expandable rows. `shadow: false` — external CSS penetrates.

| Prop                      | Type                             | Default    | Description                                                                                  |
| ------------------------- | -------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `columns`                 | `ColumnDef[]`                    | `[]`       | Column definitions (see interface below)                                                     |
| `data`                    | `any[]`                          | `[]`       | Data rows to display                                                                         |
| `dataKey`                 | `string \| number`               | `'id'`     | Field used as unique row identifier for selection, expand and reorder                        |
| `size`                    | `'small' \| 'normal' \| 'large'` | `'normal'` | Row density — **usar siempre `'small'` en ZEUS**                                             |
| `class`                   | `string`                         | `undefined`| Extra CSS class on the `<table>` element                                                     |
| `idComponent`             | `string`                         | `''`       | Prefix for internal unique cell IDs                                                          |
| `selectionRow`            | `boolean`                        | `false`    | Add checkbox column for row selection                                                        |
| `selections`              | `any[]`                          | `[]`       | Currently selected rows (controlled); synced via `@Watch`                                    |
| `paginator`               | `boolean`                        | `false`    | Show built-in `ms-paginator` (client-side slice of `data`)                                   |
| `rowsPerPage`             | `number`                         | `20`       | Rows per page                                                                                |
| `page`                    | `number`                         | `0`        | Current page (0-based) for external pagination sync                                          |
| `totalRecords`            | `number`                         | `0`        | Total records — required when `paginator=true`; pass `data.length` for client-side           |
| `expandableRow`           | `boolean`                        | `false`    | Add expand/collapse button per row; shows `nestedTableContent` when expanded                 |
| `nestedTableContent`      | `any`                            | `null`     | JSX/HTML rendered inside the expanded row (same content for all rows)                        |
| `showFooter`              | `boolean`                        | `false`    | Show `<tfoot>` row (requires at least one column with `footer` defined)                      |
| `loading`                 | `boolean`                        | `false`    | Show `ms-spinner` overlay on top of the table                                                |
| `bordered`                | `boolean`                        | `false`    | Add border to all cells                                                                      |
| `stickyHeader`            | `boolean`                        | `false`    | Sticky `<thead>` on scroll (use with `scrollerHeight`)                                       |
| `scrollerHeight`          | `string`                         | `undefined`| CSS height for the scrollable container (e.g. `'400px'`); enables `overflow-y: auto`        |
| `reorderable`             | `boolean`                        | `false`    | Drag-to-reorder rows. **Disabled automatically** if any column has `sortable=true` or there is an active sort |
| `columnsReorderable`      | `boolean`                        | `false`    | Drag-to-reorder column headers. Same constraint as `reorderable`                             |
| `sortField`               | `string`                         | `''`       | Currently sorted field (controlled)                                                          |
| `sortOrder`               | `any`                            | `''`       | Current sort direction (controlled)                                                          |
| `rowGroupMode`            | `'subheader'`                    | `undefined`| Group rows by a field value                                                                  |
| `groupRowsBy`             | `string`                         | `undefined`| Field to group rows by (required when `rowGroupMode='subheader'`)                            |
| `rowGroupHeaderTemplate`  | `(groupValue, groupData[]) => any` | `undefined` | Custom render function for the group header row                                           |
| `rowClassName`            | `(row) => string`                | `undefined`| CSS class returned per row/cell                                                              |
| `disabledRow`             | `(row) => boolean`               | `undefined`| Return `true` to disable a row (no click, no selection, no drag)                            |
| `isFramework`             | `boolean`                        | `true`     | Internal flag — leave as default                                                             |

> **No table-level `sortable` prop.** Sorting is per-column via `column.sortable`. The table sorts client-side by default; emit `sort` and handle externally for server-side sort.

**`ColumnDef` interface:**

```typescript
interface ColumnDef {
  header: string;                              // column header text
  field?: string;                              // dot-path to the data property (e.g. 'user.name')
  align?: 'left' | 'center' | 'right';        // cell content alignment
  alignHeader?: 'left' | 'center' | 'right';  // header text alignment
  width?: string;                              // CSS width (e.g. '120px', '10%')
  sortable?: boolean;                          // enable sort icon and client-side sort for this column
  footer?: string | ((data: any[]) => string); // footer cell — string or function returning HTML string
  render?: (row: any, index: number) => any;  // custom cell renderer — return JSX (React) or Stencil VNode
  disabled?: (row: any) => boolean;            // return true to disable the row from this column's logic
}
```

> **Elementos clicables en `render`:** siempre envolver en `<div class="ms-table-actions">`. Sin esta clase el click propaga a la fila y dispara `rowClick` o el toggle de expand. Ver sección ⚠️ Excepciones ZEUS.

> **Columnas numéricas (dinero, cantidades, porcentajes):** siempre usar `align: 'right'` y `alignHeader: 'right'`. La alineación derecha es la convención estándar para cifras y facilita la comparación vertical entre filas.
> ```typescript
> { field: 'price',  header: 'Precio', align: 'right', alignHeader: 'right' }
> { field: 'amount', header: 'Monto',  align: 'right', alignHeader: 'right' }
> { field: 'stock',  header: 'Stock',  align: 'right', alignHeader: 'right' }
> ```

**Events:**

| Event             | Payload                                                    | Description                                      |
| ----------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `rowClick`        | `{ row: any, index: number }`                              | Row clicked (not fired when `expandableRow=true`) |
| `selection`       | `any[]`                                                    | Array of selected row objects after change       |
| `paginatorChange` | `{ currentPage: number }` or full paginator payload        | Page changed                                     |
| `sort`            | `{ orderBy: string, sortBy: 'asc' \| 'desc' }`             | Sort applied — **`orderBy`/`sortBy`**, not `field`/`order` |
| `expand`          | `number \| null`                                           | Expanded row ID (dataKey value), or `null` when collapsed |
| `reorder`         | `any[]`                                                    | Full data array in new order after drag          |
| `columnsReorder`  | `ColumnDef[]`                                              | Full columns array in new order after drag       |

```tsx
// React
const columns = [
  { field: "name", header: "Name", sortable: true },
  { field: "email", header: "Email" },
  {
    header: "Status",
    render: (row) => (
      <MsBadge value={row.status} severity={row.active ? "success" : "danger"} />
    ),
  },
];

<MsTable
  columns={columns}
  data={users}
  dataKey="id"
  size="small"
  selectionRow
  paginator
  rowsPerPage={20}
  totalRecords={users.length}
  stickyHeader
  scrollerHeight="500px"
  onSelection={(e) => setSelectedUsers(e.detail)}
  onRowClick={(e) => console.log(e.detail.row, e.detail.index)}
  onSort={(e) => fetchSorted(e.detail.orderBy, e.detail.sortBy)}
/>;
```

---

#### `ms-inplace`

In-place editing: shows a display view and switches to edit mode on click. **`shadow: true`** — CSS inside the component is encapsulated.

| Prop          | Type      | Default | Description                                               |
| ------------- | --------- | ------- | --------------------------------------------------------- |
| `active`      | `boolean` | `false` | Controls edit mode. Reactive: `@Watch` syncs on change   |
| `closable`    | `boolean` | `false` | Show a close button (only visible when in edit mode)      |
| `disabled`    | `boolean` | `false` | Disables all interaction; display slot becomes inert      |
| `customClass` | `string`  | `''`    | Extra CSS class on the host element                       |

> `active` is a controlled prop — changing it externally (e.g. `el.active = true`) updates the internal state via `@Watch`.

**Events:**

| Event      | Payload   | Description                          |
| ---------- | --------- | ------------------------------------ |
| `msOpen`   | `void`    | Switched to edit mode                |
| `msClose`  | `void`    | Switched back to display mode        |
| `msToggle` | `boolean` | Emits `true` on open, `false` on close |

**Slots:**

| Slot      | Description                                                                         |
| --------- | ----------------------------------------------------------------------------------- |
| `display` | Read-mode content. Fallback text: `"Clic para editar"`. Keyboard: Enter/Space open |
| `content` | Edit-mode content. Shown when active. Close button appended if `closable=true`     |

```html
<ms-inplace closable>
  <span slot="display">Click to edit</span>
  <ms-input-field slot="content" placeholder="Edit value"></ms-input-field>
</ms-inplace>
```

```tsx
// React
<MsInplace
  closable
  onMsOpen={() => console.log("editing")}
  onMsClose={() => console.log("done")}
  onMsToggle={(e) => setEditing(e.detail)}
>
  <span slot="display">Click to edit</span>
  <MsInputField slot="content" placeholder="Edit value" />
</MsInplace>
```

---

#### `ms-text-editor`

Rich text editor (WYSIWYG) with a **custom DOM mutation engine — not `document.execCommand`** (a common misconception since most WYSIWYG editors do use it; this one implements its own `(node, offset)` range-based mutation logic instead, specifically to keep full control over undo/redo and sanitization). `shadow: true` — external CSS does not penetrate.

| Prop                 | Type                              | Default                       | Description                                              |
| -------------------- | --------------------------------- | ----------------------------- | -------------------------------------------------------- |
| `value`              | `string`                          | `''`                          | Current HTML content. Reactive via `@Watch` — updating the prop replaces the editor content |
| `placeholder`        | `string`                          | `'Type your content here...'` | Placeholder shown when editor is empty                   |
| `readonly`           | `boolean`                         | `false`                       | Read-only mode — toolbar is disabled, editing blocked    |
| `headingLevels`      | `number`                          | `3`                           | Number of heading levels (H1..Hn) offered in the toolbar's heading dropdown, capped at 6 |
| `showCharCount`      | `boolean`                         | `false`                       | Shows a live character counter                            |
| `maxLength`          | `number`                          | `undefined`                   | Hard cap on content length — blocks further typing and truncates paste once reached |
| `imageUploadHandler` | `(file: File) => Promise<string>` (mutable) | `undefined`          | Custom async image upload; resolve with the final image URL. Falls back to inline base64 embedding if not set |

**Toolbar:** heading dropdown (Normal + H1..H{`headingLevels`}) · Bold · Italic · Underline · unordered/ordered lists · link insertion (URL-validated, opens `target="_blank" rel="noopener noreferrer"`) · table insertion via a visual rows×cols size picker (Tab/Shift+Tab moves between cells once inside a table) · image insertion (file picker → `imageUploadHandler` or inline base64 fallback) · full undo/redo (`Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z`, 100-entry history stack).

> **Paste sanitization allow-list:** `P`, `STRONG`, `B`, `EM`, `I`, `U`, `UL`, `OL`, `LI`, `BR`, `DIV`, `SPAN`, `A`, `H1`-`H6`, `TABLE`, `TBODY`, `TR`, `TD`, `TH`, `IMG` — links, images, tables and headings **do** survive paste (with `href`/`src` checked and unsafe ones stripped); everything else is unwrapped to its text content.

> **Empty content:** when the editor is cleared, `textChange` emits `''` (empty string), not `<p><br></p>`.

**Events:**

| Event               | Payload         | Description                                                   |
| ------------------- | --------------- | ------------------------------------------------------------- |
| `textChange`        | `string`        | Emitted on every edit and on blur; detail is the HTML string  |
| `imageUploadRequest`| `{ file: File }`| Always emitted when a user picks an image file, regardless of whether `imageUploadHandler` is set |

**Method:** `insertImageAtLastRange(url: string, alt?: string): Promise<void>` — programmatically insert an image at the last known cursor position.

```tsx
// React
<MsTextEditor
  value={content}
  placeholder="Write something..."
  headingLevels={4}
  showCharCount
  maxLength={5000}
  imageUploadHandler={async (file) => {
    const url = await uploadToStorage(file);
    return url;
  }}
  onTextChange={(e) => setContent(e.detail)}
/>
```

---

#### `ms-popover`

Floating content panel that opens on click, hover, or focus. State is fully internal — **no `visible` prop, no events**. `shadow: false` — external CSS penetrates.

| Prop            | Type                                     | Default    | Description                                       |
| --------------- | ---------------------------------------- | ---------- | ------------------------------------------------- |
| `placement`     | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Preferred position relative to the trigger        |
| `trigger`       | `'click' \| 'hover' \| 'focus'`          | `'click'`  | Interaction that opens the popover                |
| `dismissable`   | `boolean`                                | `true`     | Close on outside click                            |
| `closeOnEscape` | `boolean`                                | `true`     | Close on Escape key                               |
| `showCloseIcon` | `boolean`                                | `false`    | Show an × button inside the popover               |
| `customClass`   | `string`                                 | `''`       | Extra CSS class on the wrapper element            |
| `showDelay`     | `number`                                 | `0`        | Delay (ms) before opening, only for `trigger='hover'` |
| `hideDelay`     | `number`                                 | `100`      | Delay (ms) before closing after mouseleave, only for `trigger='hover'` |

> **No `visible` prop and no events.** Open/close state is internal-only. There is no way to programmatically control the popover from outside.

> **Auto-flip:** if the preferred `placement` doesn't fit the viewport, tries the opposite side, then `bottom`, then `top` as a final fallback.

> **`trigger='hover'` timing is configurable** via `showDelay`/`hideDelay`. Moving the pointer from the trigger into the popover content cancels the pending close, keeping it open.

**Slots:**

| Slot      | Description                                        |
| --------- | -------------------------------------------------- |
| `trigger` | The element that triggers the popover (required)   |
| default   | The popover content                                |

```tsx
// React — click trigger (default)
<MsPopover placement="bottom">
  <button slot="trigger">More info</button>
  <div>
    <p>Popover content here.</p>
  </div>
</MsPopover>

// React — hover trigger with close icon
<MsPopover trigger="hover" placement="top" showCloseIcon>
  <MsIcon slot="trigger" name="info" />
  <span>Tooltip-style content</span>
</MsPopover>
```

---

#### `ms-menubar`

Horizontal navigation bar. Responsive: horizontal items on desktop, hamburger + slide-in drawer on mobile (≤ 768px). `shadow: false`.

| Prop               | Type                    | Default | Description                                                       |
| ------------------ | ----------------------- | ------- | ----------------------------------------------------------------- |
| `items`            | `MenubarItem[] \| string` | `[]`  | Menu items. **JS array** or **JSON string** via HTML attribute    |
| `menuActiveItemId` | `string`                | `''`    | Initial active item/sub-item `id` — resolved on component load    |
| `customClass`      | `string`                | `''`    | Extra CSS class on the wrapper `div`                              |
| `cascadeMenuClass` | `string`                | `''`    | CSS class forwarded to each `ms-cascade-menu` dropdown            |

**Slots:**

| Slot    | Description                                              |
| ------- | -------------------------------------------------------- |
| `start` | Content before the menu items (e.g., logo)               |
| `end`   | Content after the menu items (e.g., user icon, search)   |

**Item types (determined by shape of `MenubarItem`):**
- Item **with `menuData`** → renders as `ms-cascade-menu` trigger (dropdown on desktop, accordion in drawer on mobile)
- Item **without `menuData`** → renders as `<a>` link

**Navigation:**
- `item.url` set and not `'#'` → `window.location.href = item.url` on click
- `item.action` set → called with a `CustomEvent` containing `{ id, label, icon, url, disabled, customClass, menuData, minWidth, originalEvent }`
- `item.disabled = true` → click is suppressed

**Event:** `itemSelect` — `CustomEvent<string>`, emitted with the clicked item's `id` (top-level items and cascade items inside the mobile drawer alike — only fires for items that have an `id`). Call `event.preventDefault()` in the handler to suppress the built-in `window.location.href` navigation, e.g. to hand the URL to an SPA router instead of a full page load.

**Responsive behavior:**
- Desktop (`> 768px`): standard horizontal bar
- Mobile (`≤ 768px`): items hidden, hamburger appears; click opens a full-width drawer
- Escape closes mobile menu; click outside also closes it
- Breakpoint is **not configurable**

**`MenubarItem` interface:**
```ts
interface MenubarItem {
  label: string;           // required — bar button text
  id?: string;             // used for active state tracking
  url?: string;            // navigation target
  action?: (event: Event) => void; // JS callback (takes precedence over url)
  icon?: string;           // SVG HTML string OR CSS class (e.g. 'pi pi-home')
  menuData?: CascadeMenuItem[]; // sub-items → renders as dropdown
  minWidth?: string;       // min-width forwarded to ms-cascade-menu
  width?: string;
  customClass?: string;
  disabled?: boolean;
}
```

**`CascadeMenuItem` interface (sub-items inside `menuData`):**
```ts
interface CascadeMenuItem {
  text?: string;
  id?: string;
  url?: string;
  action?: (event: Event) => void;
  icon?: string;
  type?: 'divider' | 'item';  // 'divider' renders a separator line
  children?: CascadeMenuItem[];
  disabled?: boolean;
  minWidth?: string;
  width?: string;
}
```

```js
// Vanilla — items as JSON string attribute
const items = JSON.stringify([
  { label: 'Home', url: '/home', id: 'home' },
  { label: 'Reports', menuData: [
    { text: 'Monthly', url: '/reports/monthly', id: 'monthly' },
    { type: 'divider' },
    { text: 'Annual', url: '/reports/annual', id: 'annual' },
  ]},
]);
document.querySelector('ms-menubar').setAttribute('items', items);
```

```tsx
// React — items as JS array
const items: MenubarItem[] = [
  { label: 'Home', url: '/home', id: 'home' },
  { label: 'Reports', menuData: [
    { text: 'Monthly', url: '/reports/monthly', id: 'monthly' },
    { type: 'divider' },
    { text: 'Annual', url: '/reports/annual', id: 'annual' },
  ]},
];

<MsMenubar items={items} menuActiveItemId="home">
  <img slot="start" src="/logo.svg" />
  <MsButton slot="end" label="Logout" />
</MsMenubar>
```

---

### 6.6 Feedback and progress

---

#### `ms-progress-bar`

Progress bar. `shadow: true` — external CSS does not penetrate; use CSS custom properties for theming.

| Prop                    | Type                               | Default         | Description                                                            |
| ----------------------- | ---------------------------------- | --------------- | ---------------------------------------------------------------------- |
| `mode`                  | `'determinate' \| 'indeterminate'` | `'determinate'` | `indeterminate` shows an animated bar and ignores `value`              |
| `value`                 | `number`                           | `undefined`     | Progress value; clamped to 0–100. If not set, no label is shown.       |
| `unit`                  | `string`                           | `'%'`           | Unit suffix appended to the value label (e.g. `'%'`, `'px'`, `' of 10'`) |
| `displayValueTemplate`  | `(value: number) => string \| any` | `undefined`     | Custom label renderer. Receives clamped value. String → rendered as `innerHTML`; JSX node → rendered directly. |

> **No `showValue` prop, no `color` prop.** Label visibility is controlled by whether `value` is set (not by a boolean prop). Bar color is set via CSS custom properties.

**Label rendering priority (determinate mode only):**
1. `displayValueTemplate` set → custom renderer
2. Default slot children present (detected at load) → slot content
3. `value` is not `null`/`undefined` → `"{value}{unit}"` (e.g. `"75%"`)
4. None of the above → no label rendered

```html
<!-- Basic -->
<ms-progress-bar value="75"></ms-progress-bar>

<!-- Custom unit -->
<ms-progress-bar value="3" unit=" of 10"></ms-progress-bar>

<!-- Indeterminate -->
<ms-progress-bar mode="indeterminate"></ms-progress-bar>
```

```tsx
// React — custom template
<MsProgressBar
  value={progress}
  displayValueTemplate={(v) => `<strong>${v}%</strong> complete`}
/>
```

---

#### `ms-timeline`

Timeline event visualization. Slot-based — event content is provided via named slots, not data props. `shadow: false` — external CSS penetrates.

| Prop          | Type                                      | Default  | Description                                                                 |
| ------------- | ----------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `events`      | `any[]`                                   | `[]`     | Array used **only to determine the number of events** — item properties are ignored; use length to control how many slots are created |
| `align`       | `'left' \| 'right' \| 'alternate'`        | `'left'` | Layout alignment of event content                                           |
| `class`       | `string \| null`                          | `null`   | Extra CSS class on the container                                            |
| `idComponent` | `string`                                  | `''`     | HTML `id` prefix                                                            |

> **No `value` prop, no `layout` prop, no `TimelineItem` interface.** The `events` array items are never read — their properties have no effect. Pass an array of any length to create that many timeline slots.

> **`alternate` align:** renders an additional empty `ms-timeline-event-opposite` div for each event (CSS handles the two-column layout).

**Slots:** `event-{n}` — content for event at index n (zero-based). Each slot is rendered inside `ms-timeline-event-content`.

```html
<!-- Vanilla — 3 events via slots -->
<ms-timeline events='[{},{},{}]' align="left">
  <div slot="event-0">
    <strong>Step 1</strong>
    <p>Order placed</p>
  </div>
  <div slot="event-1">
    <strong>Step 2</strong>
    <p>Shipped</p>
  </div>
  <div slot="event-2">
    <strong>Step 3</strong>
    <p>Delivered</p>
  </div>
</ms-timeline>
```

```tsx
// React
const events = [{}, {}, {}]; // length = 3 slots; item content is irrelevant

<MsTimeline events={events} align="alternate">
  <div slot="event-0"><strong>2024-01</strong> — Project started</div>
  <div slot="event-1"><strong>2024-06</strong> — Beta launched</div>
  <div slot="event-2"><strong>2024-12</strong> — v1.0 released</div>
</MsTimeline>
```

---

#### `ms-tooltip`

Tooltip on hover. `shadow: false` — external CSS penetrates.

| Prop          | Type                                     | Default | Description                                                   |
| ------------- | ---------------------------------------- | ------- | ------------------------------------------------------------- |
| `content`     | `string`                                 | `''`    | Tooltip content rendered as `innerHTML` — supports HTML tags  |
| `position`    | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Position relative to the slotted trigger                      |
| `showContent` | `boolean`                                | `true`  | Set to `false` to disable the tooltip entirely                |
| `class`       | `string \| null` (mutable)               | `null`  | Extra CSS class on the tooltip bubble element                 |
| `showDelay`   | `number`                                 | `0`     | Delay (ms) before showing on hover; default preserves the old immediate-open behavior |
| `hideDelay`   | `number`                                 | `0`     | Delay (ms) before hiding on hover-leave; default preserves the old immediate-close behavior |

> **Hover only — no click, no focus.** Shows on `mouseenter`, hides on `mouseleave`, optionally delayed via `showDelay`/`hideDelay`.

> **Auto-repositioning:** the tooltip isn't locked to the requested `position`. If it doesn't fit in the viewport there, it flips to the opposite side, then falls back to `bottom`, then `top` — and is clamped horizontally so it never overflows the left/right viewport edge.

**Slot:** default — element that triggers the tooltip.

```html
<ms-tooltip content="Delete record" position="top">
  <ms-button label="" icon="delete" variant="text"></ms-button>
</ms-tooltip>

<!-- HTML content supported -->
<ms-tooltip content="<strong>Warning:</strong> This action is irreversible" position="bottom">
  <ms-icon name="warning"></ms-icon>
</ms-tooltip>
```

---

#### `ms-meter-group`

Group of meters/gauges for displaying comparative metrics. `shadow: true` — external CSS does not penetrate.

| Prop               | Type                         | Default        | Description                                    |
| ------------------ | ---------------------------- | -------------- | ---------------------------------------------- |
| `values`           | `MeterValue[] \| string`     | `[]`           | Meter data — **`values`, not `value`**. Pass JS array or JSON string for HTML attribute. |
| `min`              | `number`                     | `0`            | Minimum value                                  |
| `max`              | `number`                     | `100`          | Maximum value                                  |
| `orientation`      | `'horizontal' \| 'vertical'` | `'horizontal'` | Bar orientation                                |
| `labelOrientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Label layout orientation                       |
| `labelPosition`    | `'start' \| 'end'`           | `'end'`        | Whether labels appear before or after the bars |
| `customClass`      | `string`                     | `''`           | Extra CSS class applied on the Host element    |

**`MeterValue` interface:**

```typescript
interface MeterValue {
  label: string;
  value: number;
  color: string;   // required — used as backgroundColor on the bar
  icon?: string;   // URL; if present shows a mask-image icon; if absent shows a colored dot
}
```

> **Label value display:** the built-in label list renders `{value}%` — the `%` suffix is hardcoded. If your values are not percentages, override via the `labelList` slot.

**Accessibility:** the bar row wraps in `role="group"`; each individual bar carries `role="progressbar"` with `aria-valuemin`/`aria-valuemax` (from `min`/`max`), `aria-valuenow` (the raw value), `aria-valuetext` (`"{label}: {value}"`), and `aria-label` (`{label}`).

**Slots:** `labelList` (replaces built-in legend entirely) | `start` (before content) | `end` (after content)

```tsx
// React
const data: MeterValue[] = [
  { label: "Used", value: 65, color: "#007bff" },
  { label: "Free", value: 35, color: "#e9ecef" },
];

<MsMeterGroup values={data} max={100} labelOrientation="horizontal" />;
```

---

### 6.7 Utilities

---

#### `ms-fieldset`

HTML fieldset with legend and optional collapse. Uses **`shadow: true`** — CSS encapsulated.

| Prop          | Attribute      | Type      | Default | Description                                          |
| ------------- | -------------- | --------- | ------- | ---------------------------------------------------- |
| `legend`      | `legend`       | `string`  | `''`    | Legend text; if omitted, use `slot="legend"` instead |
| `toggleable`  | `toggleable`   | `boolean` | `false` | Makes the legend a button that collapses the content |
| `customClass` | `custom-class` | `string`  | `''`    | Extra CSS class on the inner `<fieldset>` element    |

> **No `collapsed` prop and no `toggle` event.** The collapsed state is internal-only (`@State`), always starting expanded. There is no way to control or read the collapsed state from outside.

**Accessibility:** when `toggleable`, the legend exposes `role="button"` and `aria-expanded` (reflects the open/closed state); the collapsible content region always carries `aria-hidden` matching the collapsed state.

**Slots:** default (fieldset content) | `legend` (rich legend content, e.g. with icon)

```tsx
// React — simple
<MsFieldset legend="Personal Information">
  <MsInputField label="Name" />
  <MsInputField label="Email" />
</MsFieldset>

// React — toggleable with rich legend via slot
<MsFieldset toggleable>
  <span slot="legend"><MsIcon name="user" /> Personal Information</span>
  <MsInputField label="Name" />
</MsFieldset>
```

---

#### `ms-paginator`

Standalone pagination control (also used internally by `ms-table`). `shadow: false` — external CSS penetrates.

| Prop                  | Type      | Default | Description                  |
| --------------------- | --------- | ------- | ---------------------------- |
| `class`               | `string`  | `undefined` | Extra CSS class on the container |
| `first`               | `number` (mutable) | `0` | Index of the first record on the current page |
| `currentPage`         | `number` (mutable) | `0`     | **0-based** current page index |
| `rows`                | `number` (mutable) | `10`    | Records per page             |
| `pageLinkSize`        | `number` (mutable) | `5`     | Number of visible page links (capped to 3 on mobile `≤ 480px`) |
| `totalRecords`        | `number`  | `undefined` | Total record count (required for pagination to work) |
| `rowsPerPageOptions`  | `Item[]`  | `[{label:'10',value:10},{label:'20',value:20},{label:'30',value:30}]` | Options for rows-per-page dropdown |
| `showPerPageDropdown` | `boolean` | `true`  | Show rows-per-page `ms-dropdown` |
| `showGoToPage`        | `boolean` | `false` | Shows a numeric "go to page" input (press Enter to jump) once the page links are truncated with an ellipsis (`totalPages > pageLinkSize`) |

> **Pages are 0-indexed.** Pass `currentPage={0}` for page 1, `currentPage={1}` for page 2, etc. The UI displays page numbers as 1-based.

> **Changing `rows`** resets `currentPage` and `first` to `0` automatically and emits `pageChange`.

> **Project convention:** always set `showPerPageDropdown={false}`. The component default is `true` but this project does not use the rows-per-page selector.

> **Ellipsis ("…") is decorative, not clickable.** No `onClick`, no hover background, no pointer cursor — it just indicates that page links are truncated. Use `showGoToPage` if you want a way to jump directly to a specific page from the truncated state.

**Events:** `pageChange` — emits `{ first: number, rows: number, currentPage: number, totalRecords: number }`.

```tsx
// React
<MsPaginator
  totalRecords={1000}
  rows={rowsPerPage}
  currentPage={currentPage}   // 0-based: page 1 = 0, page 2 = 1, ...
  onPageChange={(e) => {
    setCurrentPage(e.detail.currentPage);  // NOT e.detail.page
    setRowsPerPage(e.detail.rows);
  }}
/>
```

---

#### `ms-preload`

Loading overlay that covers a container. `shadow: false` — external CSS penetrates.

| Prop      | Type      | Default | Description                                                                                          |
| --------- | --------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `text`    | `string`  | —       | Text shown in the overlay. Ignored if `image` is set. If neither is set, shows `"Loading..."`.       |
| `image`   | `string`  | —       | URL of a custom image (rendered at 450px wide). **Takes precedence over `text`** — both cannot show at once. |
| `visible` | `boolean` | `true`  | Toggles the overlay **without unmounting it** — set `false` to hide it while keeping the element in the DOM |

> **No `fullscreen`/`zIndex` props.** Use CSS (`position: fixed`) yourself to cover the full screen.

> **Prefer toggling `visible` over conditional rendering** when possible — mounting/unmounting `ms-preload` imperatively in a microfrontend (especially alongside single-spa lifecycle transitions) risks `removeChild` errors if the framework and the mount/unmount logic race each other. Toggling `visible` avoids that race entirely.

**Accessibility:** the overlay carries `role="status"`, `aria-live="polite"`, `aria-atomic="true"`, and `aria-hidden` (set to `"true"` when `visible=false`). When using `image` instead of `text`, an `aria-label` (falling back to `'Loading'`) is applied, since the image itself has no visible text for assistive tech to read.

```tsx
// React — conditional rendering
{
  isLoading && <MsPreload text="Loading data..." />;
}

// React — toggling visible (recommended, avoids mount/unmount races)
<MsPreload text="Loading..." visible={isLoading} />

// Full-screen overlay — wrap in a fixed container
{
  isLoading && (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      <MsPreload text="Loading..." />
    </div>
  );
}
```

---

#### `ms-web-card`

Card container with header, body and footer. `shadow: false` — external CSS penetrates.

> **HTML tag is `ms-card`** (not `ms-web-card` — that is the file name only).
>
> **React import name:** `MsCard` (the styleguide re-exports it under this alias).
> ```tsx
> import { MsCard } from "@maxi/styleguide";
> ```

| Prop             | Type             | Default     | Description                                                              |
| ---------------- | ---------------- | ----------- | ------------------------------------------------------------------------ |
| `titleComponent` | `string \| null` | `null`      | Card title text — **use `titleComponent`, not `title`**                  |
| `subTitle`       | `string \| null` | `null`      | Subtitle text                                                            |
| `header`         | `string \| any`  | `undefined` | Header content as string or JSX. If set, the `header` slot is ignored   |
| `footer`         | `string \| any`  | `undefined` | Footer content as string or JSX. If set, the `footer` slot is ignored   |
| `class`          | `string \| null` | `null`      | Extra CSS class on the outer container div                               |
| `idComponent`    | `string \| null` | `null`      | Declared but **not applied in the render** — has no effect               |
| `isFramework`    | `boolean`        | `true`      | Internal flag; leave as default                                          |

> **Warning:** the prop is `titleComponent`, not `title`. Using `title` sets the native HTML tooltip attribute instead.

> **Prop vs slot precedence:** if a prop (`header`, `titleComponent`, `subTitle`, `footer`) is set, its corresponding named slot is ignored. Use the prop **or** the slot, not both.

**Slots:**

| Slot             | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `header`         | Custom header content (ignored if `header` prop is set)  |
| `titleComponent` | Custom title (ignored if `titleComponent` prop is set)   |
| `subTitle`       | Custom subtitle (ignored if `subTitle` prop is set)      |
| default          | Body content                                             |
| `footer`         | Footer content (ignored if `footer` prop is set)         |

```html
<!-- Vanilla — tag is ms-card -->
<ms-card title-component="Sales summary" sub-title="Current month">
  <p>Total sales: $12,400</p>
  <div slot="footer">
    <ms-button label="View details" variant="text"></ms-button>
  </div>
</ms-card>
```

```tsx
// React — use MsCard alias
<MsCard titleComponent="Sales summary" subTitle="Current month">
  <p>Total sales: $12,400</p>
  <div slot="footer">
    <MsButton label="View details" variant="text" />
  </div>
</MsCard>
```

---

### 6.8 New in 9.0.0

---

#### `ms-file-upload`

File upload with drag-and-drop, validation, progress tracking, and custom upload handling. `shadow: false`.

**Three render modes** (determined by `mode` + `buttonsPosition`):
- `mode='basic'` → single choose button only
- `mode='advanced'` + no `buttonsPosition` → full dropzone with separate buttonbar above
- `mode='advanced'` + `buttonsPosition` set → drag-zone layout with buttons at the specified position

| Prop                            | Attribute                             | Type                                                             | Default                         | Description                                                          |
| ------------------------------- | ------------------------------------- | ---------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| `mode`                          | `mode`                                | `'basic' \| 'advanced'`                                          | `'advanced'`                    | UI mode — see render modes above                                     |
| `buttonsPosition`               | `buttons-position`                    | `'top'\|'right'\|'left'\|'bottom-center'\|'bottom-left'`        | —                               | When set, activates drag-zone layout and positions Cancel/Upload here |
| `multiple`                      | `multiple`                            | `boolean`                                                        | `false`                         | Allow selecting multiple files                                       |
| `accept`                        | `accept`                              | `string`                                                         | —                               | MIME types or extensions allowed (e.g. `'image/*,.pdf'`) — enforced on both the native file picker **and** drag-and-drop |
| `maxFileSize`                   | `max-file-size`                       | `number`                                                         | —                               | Maximum file size in bytes; over-limit files emit `validationFailEvent` |
| `maxFiles`                      | `max-files`                           | `number`                                                         | —                               | Caps the queue size; files past the limit fail validation with `reason: 'count'` |
| `retryCount`                    | `retry-count`                        | `number`                                                          | `0`                              | Number of automatic retries after an upload failure; `0` preserves fail-immediately behavior |
| `retryDelay`                    | `retry-delay`                        | `number`                                                          | `1000`                           | Base delay (ms) before a retry — doubles each attempt (exponential backoff) |
| `chunkedUpload`                 | `chunked-upload`                     | `boolean`                                                         | `false`                          | Opt-in: splits each file into `chunkSize`-byte chunks uploaded sequentially as separate requests (requires backend support for `chunkIndex`/`totalChunks`/`uploadId`/`fileName`/`fileSize` metadata) |
| `chunkSize`                     | `chunk-size`                         | `number`                                                          | `1_000_000`                      | Size in bytes of each chunk when `chunkedUpload` is enabled |
| `keepUploadedVisible`           | `keep-uploaded-visible`              | `boolean`                                                         | `false`                          | Opt-in: keeps successfully-uploaded files listed (marked 100%) instead of clearing them from the queue on completion |
| `url`                           | `url`                                 | `string`                                                         | —                               | Upload endpoint (XHR POST); required when `customUpload=false`       |
| `auto`                          | `auto`                                | `boolean`                                                        | `false`                         | Upload automatically on file selection                               |
| `customUpload`                  | `custom-upload`                       | `boolean`                                                        | `false`                         | Skip XHR and emit `uploadHandlerEvent` for manual handling           |
| `name`                          | `name`                                | `string`                                                         | —                               | Form field name sent in multipart request (default: `'file'`)        |
| `withCredentials`               | `with-credentials`                    | `boolean`                                                        | `false`                         | Include cookies in XHR request                                       |
| `disabled`                      | `disabled`                            | `boolean`                                                        | `false`                         | Disable all interactions                                             |
| `variant`                       | `variant`                             | `'primary'\|'secondary'\|'success'\|'warning'\|'alert'`         | `'primary'`                     | Button color variant                                                 |
| `previewWidth`                  | `preview-width`                       | `number`                                                         | `50`                            | Image thumbnail width in px                                          |
| `chooseLabel`                   | `choose-label`                        | `string`                                                         | `'Choose'`                      | Label for the choose-file button                                     |
| `uploadLabel`                   | `upload-label`                        | `string`                                                         | `'Upload'`                      | Label for the upload button                                          |
| `cancelLabel`                   | `cancel-label`                        | `string`                                                         | `'Cancel'`                      | Label for the cancel button                                          |
| `dropLabel`                     | `drop-label`                          | `string`                                                         | `'Drag and drop files here'`    | Dropzone instruction text                                            |
| `addLabel`                      | `add-label`                           | `string`                                                         | `'Add File'`                    | Heading in empty drag-zone drop area                                 |
| `browseLabel`                   | `browse-label`                        | `string`                                                         | `'browse file'`                 | Clickable browse link text in drag-zone                              |
| `invalidFileSizeMessageSummary` | `invalid-file-size-message-summary`   | `string`                                                         | `'Invalid file size'`           | Label for consumer to use in validation error notification           |
| `invalidFileSizeMessageDetail`  | `invalid-file-size-message-detail`    | `string`                                                         | `'Maximum upload size is {0}.'` | Detail label (`{0}` = formatted size) — component does **not** display this automatically; use it in `onValidationFailEvent` |

**Events:**

| Event                 | Payload                                              | Description                                               |
| --------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| `selectEvent`         | `{ files: File[], originalEvent: Event }`            | Files selected (after validation pass)                    |
| `beforeSelectEvent`   | `{ files: File[], originalEvent: Event }`            | Before files are added to the queue                       |
| `uploadEvent`         | `{ files: File[], xhr: XMLHttpRequest }`             | Upload completed successfully                             |
| `errorEvent`          | `{ files: File[], xhr: XMLHttpRequest }`             | Upload failed (HTTP error or network error)               |
| `progressEvent`       | `{ originalEvent: ProgressEvent, progress: number }` | Upload progress (0–100)                                   |
| `clearEvent`          | `void`                                               | File queue cleared via Cancel button                      |
| `removeEvent`         | `{ file: File, originalEvent: Event }`               | Single file removed from queue                            |
| `beforeUploadEvent`   | `{ xhr: XMLHttpRequest, formData: FormData }`        | Before upload starts — mutate `xhr`/`formData` here       |
| `beforeSendEvent`     | `{ xhr: XMLHttpRequest, formData: FormData }`        | Just before XHR is sent                                   |
| `beforeDropEvent`     | `DragEvent`                                          | Before dropped files are processed                        |
| `uploadHandlerEvent`  | `{ files: File[] }`                                  | Emitted when `customUpload=true` — handle upload manually |
| `validationFailEvent` | `{ file: File, reason?: 'size'\|'type'\|'count' }`   | File failed validation: too large (`size`), doesn't match `accept` (`type`), or queue full per `maxFiles` (`count`); component does not show a message |
| `fileProgressEvent`   | `{ file: File, progress: number }`                   | Per-file upload progress (estimated for non-chunked uploads, exact for chunked) |
| `retryEvent`          | `{ files: File[], attempt: number, maxAttempts: number }` | Emitted before each automatic retry attempt (when `retryCount > 0`) |

**Public methods:**

| Method                    | Returns                     | Description                                     |
| ------------------------- | --------------------------- | ----------------------------------------------- |
| `clear()`                 | `Promise<void>`             | Clear all queued files                          |
| `upload()`                | `Promise<void>`             | Trigger upload programmatically                 |
| `getFiles()`              | `Promise<File[]>`           | Get currently queued (not yet uploaded) files   |
| `getUploadedFiles()`      | `Promise<File[]>`           | Get already uploaded files                      |
| `setFiles(files)`         | `Promise<void>`             | Replace queue with given files                  |
| `setUploadedFiles(files)` | `Promise<void>`             | Replace uploaded list with given files          |
| `formatSize(bytes)`       | `Promise<string>`           | Format byte count to human-readable string      |
| `getElement()`            | `Promise<HTMLElement>`      | Return the host element                         |
| `getInput()`              | `Promise<HTMLInputElement>` | Return the hidden file `<input>` element        |

```tsx
// React — custom upload handler
<MsFileUpload
  multiple
  accept="image/*,.pdf"
  maxFileSize={5242880}
  customUpload
  chooseLabel="Select files"
  onUploadHandlerEvent={async (e) => {
    const formData = new FormData();
    e.detail.files.forEach((f) => formData.append('file', f));
    await api.upload(formData);
  }}
  onValidationFailEvent={(e) =>
    showToast(`${e.detail.file.name} exceeds the maximum upload size.`)
  }
/>

// React — automatic XHR upload
<MsFileUpload
  url="/api/upload"
  auto
  multiple
  accept=".csv,.xlsx"
  onUploadEvent={(e) => console.log('Uploaded:', e.detail.files)}
  onErrorEvent={(e) => console.error('Upload failed', e.detail.xhr.status)}
/>
```

---

#### `ms-gauge-chart`

Semicircular gauge chart with animated needle, gradient color zones, and configurable labels. `shadow: false`.

| Prop                | Attribute             | Type                                                                            | Default            | Description                                                                                      |
| ------------------- | --------------------- | ------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `value`             | `value`               | `number`                                                                        | `0`                | Current value — animates to this on mount and on each change                                     |
| `min`               | `min`                 | `number`                                                                        | `0`                | Minimum of the gauge range                                                                       |
| `max`               | `max`                 | `number`                                                                        | `100`              | Maximum of the gauge range                                                                       |
| `arcs`              | **JS only**           | `GaugeArc[]`                                                                    | red→yellow→green   | Color zones sorted by `limit` ascending — must be set as JS property                            |
| `color`             | `color`               | `'primary'\|'secondary'\|'success'\|'warning'\|'alert'\|'info'\|''`            | `''`               | Maxi color variant — see color behavior table below                                              |
| `reactiveColor`     | `reactive-color`      | `boolean`                                                                       | `false`            | Arc switches to monochromatic gradient of the current zone as value changes                      |
| `label`             | `label`               | `string`                                                                        | `''`               | Primary label below the value                                                                    |
| `subLabel`          | `sub-label`           | `string`                                                                        | `''`               | Secondary label below the primary label                                                          |
| `unit`              | `unit`                | `string`                                                                        | `''`               | Unit for `aria-label` only — not shown visually; put unit text in `label` instead                |
| `labelColor`        | `label-color`         | `string`                                                                        | `''`               | Primary label color; defaults to auto-darkened zone color                                        |
| `subLabelColor`     | `sub-label-color`     | `string`                                                                        | `'#777777'`        | Sub-label color                                                                                  |
| `ticks`             | `ticks`               | `number`                                                                        | `12`               | Number of white tick marks over the arc                                                          |
| `arcWidth`          | `arc-width`           | `number`                                                                        | `14`               | Arc band radial thickness — suggested: `6` thin · `10` medium · `14` default · `20` thick · `28` extra |
| `animated`          | `animated`            | `boolean`                                                                       | `true`             | Animate needle on mount and on every `value` change                                              |
| `animationDuration` | `animation-duration`  | `number`                                                                        | `1500`             | Animation duration in ms                                                                         |
| `width`             | `width`               | `string`                                                                        | `'300px'`          | CSS width of the container (e.g. `'100%'`)                                                       |
| `decimals`          | `decimals`            | `number`                                                                        | `0`                | Decimal places shown in the displayed value                                                      |

**`GaugeArc` interface:**

```ts
interface GaugeArc {
  limit: number; // fraction [0–1] of the range where this zone ends
  color: string; // any CSS hex color (e.g. '#F44336')
}
// Default: [{ limit: 0.25, color: '#F44336' }, { limit: 0.5, color: '#FFEB3B' }, { limit: 1, color: '#4CAF50' }]
```

**Color behavior:**

| Scenario | Arc fill | Needle / value color |
| --- | --- | --- |
| Default (no `color`, no `reactiveColor`) | Multi-zone gradient from `arcs` | Zone color at current value |
| `color` set, `reactiveColor=false` | **Solid** Maxi color (not a gradient) | Maxi color |
| `color` set, `reactiveColor=true` | Monochromatic zone gradient (`reactiveColor` wins) | Maxi color |
| `reactiveColor=true`, no `color` | Monochromatic gradient of current zone | Zone color |

No events or public methods.

```tsx
// React — default red/yellow/green zones
<MsGaugeChart value={72} label="Performance" subLabel="Current month" width="280px" />

// React — solid Maxi color (no gradient)
<MsGaugeChart value={45} min={0} max={200} color="primary" label="Requests/sec" />

// React — custom zones + reactive monochromatic gradient
<MsGaugeChart
  value={850}
  min={300}
  max={900}
  label="Credit score"
  arcs={[
    { limit: 0.4, color: '#dc3545' },
    { limit: 0.7, color: '#ffc107' },
    { limit: 1,   color: '#28a745' },
  ]}
  reactiveColor
  decimals={0}
  width="320px"
/>
```

---

#### `ms-scroll-top`

"Back to top" floating button that appears after the user scrolls past a configurable threshold.

| Prop          | Type                   | Default    | Description                                                                                   |
| ------------- | ---------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `target`      | `'window' \| 'parent'` | `'window'` | Element that triggers scroll detection. `'parent'` listens on the nearest scrollable ancestor — **known limitation, see below** |
| `threshold`   | `number`               | `400`      | Scroll position in px at which the button becomes visible                                     |
| `behavior`    | `'smooth' \| 'auto'`   | `'smooth'` | Scroll behavior when the button is clicked                                                    |
| `icon`        | `string`               | —          | URL of a custom icon image. When omitted the built-in upward-arrow SVG is used                |
| `customClass` | `string`               | —          | Extra CSS class applied to the button element                                                 |

**Events:**

| Event    | Payload | Description                                               |
| -------- | ------- | --------------------------------------------------------- |
| `msShow` | `void`  | Button became visible (user scrolled past threshold)      |
| `msHide` | `void`  | Button became hidden (user scrolled back above threshold) |

`scoped: true` (Stencil scoped encapsulation — **not** shadow DOM; external CSS can still target the component via attribute selectors). The button is fixed-positioned with responsive sizing (3rem desktop → 2.25rem mobile).

> **Known limitation — `target="parent"` doesn't currently work.** Confirmed in real usage (not just a Storybook artifact): the button never becomes visible/active when scrolling a bounded container. Use `target="window"` (the default) until this is fixed — don't rely on the example that used to be here.

```html
<!-- Vanilla — default behaviour (target="window", the only currently-working mode) -->
<ms-scroll-top></ms-scroll-top>
```

```tsx
// React
<MsScrollTop
  threshold={300}
  onMsShow={() => console.log("visible")}
  onMsHide={() => console.log("hidden")}
/>
```

---

## 7. Advanced patterns

### Components in flex / grid layouts — width problem

**Problem:** custom elements (`ms-*`) render as `display: inline` by default in most browsers. Inside a flex or grid container they shrink to their minimum content width (just the arrow icon), the placeholder is invisible, and the component only looks correct after selecting a value.

**Rule:** always give an explicit width to form components inside flex containers. The two standard approaches:

**Option A — wrapper div (recommended in React):**
Control the flex item with a wrapping `<div>`, not the web component directly. This is the most reliable approach across all component types.

```tsx
// ✅ Wrap each component in a sized div
<div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
  <div style={{ flex: '0 0 200px' }}>
    <MsDropdown label="Estado" options={statusOptions} onSelected={(e) => setStatus(e.detail)} />
  </div>
  <div style={{ flex: '0 0 220px' }}>
    <MsMultiselect label="Categorías" options={catOptions} onSelected={(e) => setCats(e.detail)} />
  </div>
  <div style={{ flex: '0 0 180px' }}>
    <MsCalendar label="Fecha" onUpdate={(e) => setDate(e.detail)} />
  </div>
</div>
```

**Option B — CSS selector on the component tag:**
Target the component tag (not internal classes) scoped under a container class you control.

```css
/* In your component's CSS or global styles */
.filter-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

/* Target the component element tag, not internal classes like .ms-dropdown-box */
.filter-row ms-dropdown,
.filter-row ms-multiselect,
.filter-row ms-autocomplete,
.filter-row ms-calendar,
.filter-row ms-input-field,
.filter-row ms-input-number,
.filter-row ms-select-button {
  flex: 0 0 200px;   /* fixed width — adjust per component */
  min-width: 0;      /* prevents overflow of long labels */
}
```

**For grid layouts** (no issue — grid items fill the column naturally):
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
  <MsDropdown label="Estado" options={statusOptions} onSelected={(e) => setStatus(e.detail)} />
  <MsMultiselect label="Categorías" options={catOptions} onSelected={(e) => setCats(e.detail)} />
  <MsCalendar label="Fecha" onUpdate={(e) => setDate(e.detail)} />
</div>
```

> **Components affected:** `MsDropdown`, `MsMultiselect`, `MsAutocomplete`, `MsCalendar`, `MsInputField`, `MsInputNumber`, `MsSelectButton`, `MsInputSwitch`. Static/display components (`MsBadge`, `MsMessage`, etc.) are not affected.

---

### Popup components in flex containers — popup jumping on interaction

**Problem:** `MsCalendar`, `MsDropdown`, and `MsMultiselect` calculate their popup position using `getBoundingClientRect()` on the trigger element. If the trigger moves between the initial open and the next internal re-render (month navigation, date click, option hover), the popup "jumps" to a new position.

**Root cause:** two compounding issues:
1. `ms-*` elements are `display: inline` by default — imprecise bounding box for position calculation.
2. Parent flex containers with `align-items: center` re-center all siblings when any child changes height. If the flex group containing the popup component is not height-stable, the trigger's Y coordinate changes between calculations.

**Fix — Option B (CSS selector):** extend the selector with `display: block`, `position: relative`, and `flex-shrink: 0`:

```css
/* The flex group that wraps the filter controls */
.my-filter-group {
  align-self: flex-start; /* prevents parent align-items:center from shifting this group when height changes */
}

/* The calendar/dropdown component itself */
.my-flex-row ms-calendar {
  display: block;       /* correct bounding box for getBoundingClientRect() */
  position: relative;   /* makes the host the containing block for its absolute popup */
  width: 260px;         /* prevent shrinking when sibling elements appear */
  flex-shrink: 0;
}
```

**Fix — Option A (wrapper div):** the wrapper already provides `flex-shrink: 0` and stable width. Add `position: relative` to the wrapper too so the popup anchors to it:

```tsx
// ✅ wrapper div + position:relative anchors the popup to the wrapper
<div style={{ flex: '0 0 260px', position: 'relative' }}>
  <MsCalendar label="Fecha" onUpdate={(e) => setDate(e.detail)} />
</div>
```

> **`align-self: flex-start` is required** on the flex group that contains the popup component whenever the parent container uses `align-items: center`. Without it, any height change in the group (which happens when the popup opens) re-centers all siblings in the row, shifting the trigger position mid-calculation.

---

### Calling public methods via refs (React)

Some components expose public methods (`collapse`, `expand`, `upload`). In React, use `useRef` to get the element reference and call them directly.

```tsx
import { useRef, useState } from 'react';

// --- ms-navbar: collapse / expand / toggle ---
const navRef = useRef<HTMLMsNavbarElement>(null);

<MsNavbar ref={navRef} items={items} />

// Controlled from a button elsewhere in the UI:
<MsButton label="Close menu" onClickEvent={() => navRef.current?.collapse()} />
<MsButton label="Open menu"  onClickEvent={() => navRef.current?.expand()} />

// --- ms-notification: NO show() method — use props/state ---
const [notif, setNotif] = useState({ visible: false, severity: 'info', summary: '', detail: '' });

function showNotification(severity: string, summary: string, detail: string) {
  setNotif({ visible: true, severity, summary, detail });
}

<MsNotification
  visible={notif.visible}
  severity={notif.severity as any}
  summary={notif.summary}
  detail={notif.detail}
  life={3000}
/>

// Trigger from any handler:
showNotification('success', 'Saved', 'Changes were saved successfully.');

// --- ms-file-upload: upload() / clear() ---
const uploadRef = useRef<HTMLMsFileUploadElement>(null);

<MsFileUpload ref={uploadRef} customUpload onUploadHandlerEvent={handleUpload} />

<MsButton label="Upload now" onClickEvent={() => uploadRef.current?.upload()} />
<MsButton label="Clear"      onClickEvent={() => uploadRef.current?.clear()} />
```

---

### Coordinated form validation (React)

All form components emit `validationChange` with `ValidationDetail`. Pattern for enabling a submit button only when the whole form is valid:

```tsx
import { useState } from "react";
import {
  MsButton,
  MsCalendar,
  MsDropdown,
  MsInputField,
} from "@maxi/styleguide";

function MyForm() {
  const [validity, setValidity] = useState<Record<string, boolean>>({
    name: false,
    country: false,
    birthdate: false,
  });

  const updateValidity = (fieldId: string, isValid: boolean) => {
    setValidity((prev) => ({ ...prev, [fieldId]: isValid }));
  };

  const isFormValid = Object.values(validity).every(Boolean);

  const handleSubmit = () => {
    /* ... */
  };

  return (
    <form>
      <MsInputField
        idComponent="name"
        label="Full name"
        required
        errorMessage="Name is required"
        onValidationChange={(e) =>
          updateValidity(e.detail.fieldId, e.detail.isValid)
        }
      />

      <MsDropdown
        idComponent="country"
        label="Country"
        options={countryOptions}
        required
        errorMessage="Select a country"
        onValidationChange={(e) =>
          updateValidity(e.detail.fieldId, e.detail.isValid)
        }
      />

      <MsCalendar
        idComponent="birthdate"
        label="Birth date"
        required
        errorMessage="Date is required"
        onValidationChange={(e) =>
          updateValidity(e.detail.fieldId, e.detail.isValid)
        }
      />

      <MsButton
        label="Submit"
        type="submit"
        disabled={!isFormValid}
        onClickEvent={handleSubmit}
      />
    </form>
  );
}
```

> Each `idComponent` must be unique within the form — it is the key used in `ValidationDetail.fieldId`.

---

### Complete table with actions (React)

```tsx
import { useRef, useState } from "react";
import {
  MsBadge,
  MsButton,
  MsDialog,
  MsNotification,
  MsTable,
} from "@maxi/styleguide";

function UsersTable({ users }: { users: User[] }) {
  const [notif, setNotif] = useState({
    visible: false,
    severity: "info",
    summary: "",
    detail: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const columns = [
    { field: "name", header: "Name", sortable: true },
    { field: "email", header: "Email" },
    {
      field: "active",
      header: "Status",
      render: (row: User) => (
        <MsBadge
          value={row.active ? "Active" : "Inactive"}
          severity={row.active ? "success" : "danger"}
        />
      ),
    },
    {
      field: "actions",
      header: "",
      render: (row: User) => (
        <MsButton
          label="Delete"
          variant="danger"
          size="small"
          onClickEvent={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  const handleConfirmDelete = async () => {
    await api.deleteUser(deleteTarget!.id);
    setDeleteTarget(null);
    setNotif({
      visible: true,
      severity: "success",
      summary: "Deleted",
      detail: `${deleteTarget!.name} removed.`,
    });
  };

  return (
    <>
      <MsTable
        columns={columns}
        data={users}
        paginator
        rowsPerPage={20}
        totalRecords={users.length}
        stickyHeader
        selectionRow
        onSelection={(e) => console.log("Selected:", e.detail)}
      />

      <MsDialog
        visible={!!deleteTarget}
        header="Confirm deletion"
        onHide={() => setDeleteTarget(null)}
      >
        <p>
          Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <div slot="footer">
          <MsButton
            label="Cancel"
            variant="outlined"
            onClickEvent={() => setDeleteTarget(null)}
          />
          <MsButton
            label="Delete"
            variant="danger"
            onClickEvent={handleConfirmDelete}
          />
        </div>
      </MsDialog>

      <MsNotification
        visible={notif.visible}
        severity={notif.severity as any}
        summary={notif.summary}
        detail={notif.detail}
        life={3000}
      />
    </>
  );
}
```

---

### CSS class injection into Shadow DOM (ms-button)

`ms-button` uses Shadow DOM but implements a `MutationObserver` that watches for class changes on the host element and replicates them inside the shadow root. This allows external utility classes (Tailwind, project utilities) to be applied:

```html
<!-- 'w-full' and 'mt-4' are automatically injected inside the shadow DOM -->
<ms-button label="Save" variant="primary" class="w-full mt-4"></ms-button>
```

---

### Portal-based dropdowns (ms-chips, ms-autocomplete)

The suggestion dropdowns in `ms-chips` and `ms-autocomplete` are rendered directly in `document.body` via a portal, avoiding `overflow: hidden` clipping in parent containers. Position is dynamically calculated: if there is no space below the trigger, the panel appears above.

---

### Framework detection in ms-table

`ms-table` automatically detects React or Angular to render custom column content correctly:

```tsx
// React — return JSX (uses ReactDOM.createRoot internally)
{ field: 'actions', header: '', render: (row) => (
  <MsButton label="Edit" variant="text" onClickEvent={() => edit(row)} />
)}

// Vanilla / Angular — return HTML string
{ field: 'actions', header: '', render: (row) => `<ms-button label="Edit" variant="text"></ms-button>` }
```

> Never return an HTML string containing `ms-*` tags in a React project — the browser will not hydrate them as Stencil components inside the shadow DOM context. Return JSX instead.

---

### Responsive carousel

```tsx
const responsiveOptions = [
  { breakpoint: "1200px", numVisible: 3, numScroll: 1 },
  { breakpoint: "768px", numVisible: 2, numScroll: 1 },
  { breakpoint: "480px", numVisible: 1, numScroll: 1 },
];

<MsCarousel
  value={items}
  numVisible={4}
  numScroll={2}
  responsiveOptions={responsiveOptions}
/>;
```

---

### Two available themes

```javascript
// Only one active at a time — import in the entry point only
import "maxi-web-components/global.css";

// base theme
// import 'maxi-web-components/global-zeclio.css'; // Zeclio theme
```

---

## 8. Storybook

The library includes Storybook for interactive development and component documentation:

```bash
cd maxi-libs/web-components/core

# Start dev server with hot-reload
npm run storybook
# → http://localhost:6006

# Build static Storybook
npm run build-storybook
```

Each component has its own `.stories.tsx` file with variants, props and behaviors documented interactively.

---

## Quick reference

| Package                   | Use in          | Version |
| ------------------------- | --------------- | ------- |
| `maxi-web-components`     | Vanilla JS only | 9.0.0   |
| `maxi-react-components`   | React 17/18/19  | 9.0.0   |
| `maxi-angular-components` | Angular 18+     | 9.0.0   |

**Nexus registry:** `https://artifacts.maxilabs.net/repository/npm-group/`

**Total components:** 50 web components with auto-generated wrappers for React and Angular.

**Categories:**

- Forms (10): `ms-input-field`, `ms-input-password`, `ms-input-number`, `ms-input-otp`, `ms-input-switch`, `ms-checkbox`, `ms-radio`, `ms-control-number`, `ms-knob`, `ms-input-group`
- Selection (5): `ms-dropdown`, `ms-multiselect`, `ms-autocomplete`, `ms-chips`, `ms-select-button`
- Navigation (6): `ms-accordion`, `ms-tabs`, `ms-breadcrumb`, `ms-navbar`, `ms-sidebar`, `ms-steps`
- Display (8): `ms-badge`, `ms-icon`, `ms-image`, `ms-message`, `ms-notification`, `ms-skeleton`, `ms-spinner`, `ms-gauge-chart`
- Interactive (8): `ms-button`, `ms-calendar`, `ms-carousel`, `ms-cascade-menu`, `ms-chart`, `ms-dialog`, `ms-table`, `ms-inplace`
- Other (4): `ms-text-editor`, `ms-popover`, `ms-menubar`, `ms-fieldset`
- Feedback (4): `ms-progress-bar`, `ms-timeline`, `ms-tooltip`, `ms-meter-group`
- Utilities (5): `ms-paginator`, `ms-preload`, `ms-web-card`, `ms-file-upload`, `ms-scroll-top`

## Forms

### `ms-checkbox`

<!-- mwc:auto:start -->
## Properties

| Property          | Attribute          | Description                                                                                        | Type      | Default                    |
| ----------------- | ------------------ | -------------------------------------------------------------------------------------------------- | --------- | -------------------------- |
| `checked`         | `checked`          | Checked - to manipulate checkbox from outside                                                      | `boolean` | `false`                    |
| `class`           | `class`            | Custom class                                                                                       | `string`  | `undefined`                |
| `disabled`        | `disabled`         | Disabled                                                                                           | `boolean` | `undefined`                |
| `errorMessage`    | `error-message`    | Error message shown when invalid is set                                                            | `string`  | `null`                     |
| `inputId`         | `input-id`         | Input Id                                                                                           | `string`  | `undefined`                |
| `invalid`         | `invalid`          | Invalid state, from outside                                                                        | `boolean` | `false`                    |
| `label`           | `label`            | Label                                                                                              | `string`  | `undefined`                |
| `name`            | `name`             | Name                                                                                               | `string`  | `undefined`                |
| `readonly`        | `readonly`         | Readonly - the checkbox is focusable and submitted with the form but cannot be toggled by the user | `boolean` | `false`                    |
| `required`        | `required`         | Required                                                                                           | `boolean` | `false`                    |
| `requiredMessage` | `required-message` | Message shown when required and unchecked                                                          | `string`  | `DEFAULT_REQUIRED_MESSAGE` |
| `value`           | `value`            | Value                                                                                              | `string`  | `undefined`                |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `checkboxChange`   | On Change   | `CustomEvent<boolean>`          |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |
<!-- mwc:auto:end -->

---

### `ms-control-number`

<!-- mwc:auto:start -->
## Properties

| Property       | Attribute       | Description | Type               | Default     |
| -------------- | --------------- | ----------- | ------------------ | ----------- |
| `customClass`  | `custom-class`  |             | `string`           | `undefined` |
| `defaultValue` | `default-value` |             | `number \| string` | `undefined` |
| `disabled`     | `disabled`      |             | `boolean`          | `false`     |
| `error`        | `error`         |             | `boolean`          | `false`     |
| `errorMessage` | `error-message` |             | `string`           | `null`      |
| `label`        | `label`         |             | `string`           | `''`        |
| `max`          | `max`           |             | `number \| string` | `undefined` |
| `min`          | `min`           |             | `number \| string` | `undefined` |
| `value`        | `value`         |             | `number \| string` | `undefined` |


## Events

| Event         | Description | Type                  |
| ------------- | ----------- | --------------------- |
| `changeEvent` |             | `CustomEvent<number>` |
| `inputEvent`  |             | `CustomEvent<number>` |
<!-- mwc:auto:end -->

---

### `ms-input-field`

<!-- mwc:auto:start -->
## Properties

| Property          | Attribute          | Description | Type      | Default                    |
| ----------------- | ------------------ | ----------- | --------- | -------------------------- |
| `class`           | `class`            |             | `string`  | `null`                     |
| `disabled`        | `disabled`         |             | `boolean` | `null`                     |
| `errorMessage`    | `error-message`    |             | `string`  | `null`                     |
| `idComponent`     | `id-component`     |             | `string`  | `'ms-input-field'`         |
| `invalid`         | `invalid`          |             | `boolean` | `false`                    |
| `label`           | `label`            |             | `string`  | `null`                     |
| `maxLength`       | `max-length`       |             | `number`  | `null`                     |
| `name`            | `name`             |             | `string`  | `null`                     |
| `placeholder`     | `placeholder`      |             | `string`  | `null`                     |
| `readonly`        | `readonly`         |             | `boolean` | `false`                    |
| `required`        | `required`         |             | `boolean` | `false`                    |
| `requiredMessage` | `required-message` |             | `string`  | `DEFAULT_REQUIRED_MESSAGE` |
| `value`           | `value`            |             | `any`     | `null`                     |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `blurEvent`        |             | `CustomEvent<string>`           |
| `changeEvent`      |             | `CustomEvent<string>`           |
| `clickEvent`       |             | `CustomEvent<string>`           |
| `focusEvent`       |             | `CustomEvent<string>`           |
| `inputEvent`       |             | `CustomEvent<string>`           |
| `keyDownEvent`     |             | `CustomEvent<KeyDownDetail>`    |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |
<!-- mwc:auto:end -->

---

### `ms-input-group`

<!-- mwc:auto:start -->
## Overview

Groups inputs with addons and propagates disabled/invalid to its ms-* form children.
Layout styles live in global.css (.ms-input-group / .ms-input-group-addon), so raw
<div class="ms-input-group"> markup keeps working; this component adds group-level
state propagation on top.

## Properties

| Property   | Attribute  | Description                                                                                          | Type      | Default     |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `disabled` | `disabled` | When set, propagated to all known ms-* form children. Leave unset to control children individually.  | `boolean` | `undefined` |
| `invalid`  | `invalid`  | When set, propagated to children that support invalid. Leave unset to control children individually. | `boolean` | `undefined` |
<!-- mwc:auto:end -->

---

### `ms-input-number`

<!-- mwc:auto:start -->
## Properties

| Property            | Attribute             | Description | Type                     | Default                    |
| ------------------- | --------------------- | ----------- | ------------------------ | -------------------------- |
| `class`             | `class`               |             | `string`                 | `undefined`                |
| `currency`          | `currency`            |             | `string`                 | `'USD'`                    |
| `disabled`          | `disabled`            |             | `boolean`                | `false`                    |
| `errorMessage`      | `error-message`       |             | `string`                 | `null`                     |
| `idComponent`       | `id-component`        |             | `string`                 | `'ms-input-number'`        |
| `invalid`           | `invalid`             |             | `boolean`                | `false`                    |
| `label`             | `label`               |             | `string`                 | `null`                     |
| `locale`            | `locale`              |             | `string`                 | `'en-US'`                  |
| `max`               | `max`                 |             | `number`                 | `undefined`                |
| `maxFractionDigits` | `max-fraction-digits` |             | `number`                 | `2`                        |
| `maxLength`         | `max-length`          |             | `number`                 | `20`                       |
| `min`               | `min`                 |             | `number`                 | `undefined`                |
| `minFractionDigits` | `min-fraction-digits` |             | `number`                 | `0`                        |
| `mode`              | `mode`                |             | `"currency" \| "number"` | `undefined`                |
| `name`              | `name`                |             | `string`                 | `null`                     |
| `placeholder`       | `placeholder`         |             | `string`                 | `undefined`                |
| `prefixInput`       | `prefix-input`        |             | `string`                 | `undefined`                |
| `readonly`          | `readonly`            |             | `boolean`                | `false`                    |
| `required`          | `required`            |             | `boolean`                | `false`                    |
| `requiredMessage`   | `required-message`    |             | `string`                 | `DEFAULT_REQUIRED_MESSAGE` |
| `showControls`      | `show-controls`       |             | `boolean`                | `false`                    |
| `suffix`            | `suffix`              |             | `string`                 | `undefined`                |
| `useGrouping`       | `use-grouping`        |             | `boolean`                | `true`                     |
| `value`             | `value`               |             | `number`                 | `undefined`                |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `blurEvent`        |             | `CustomEvent<number>`           |
| `changeEvent`      |             | `CustomEvent<number>`           |
| `clickEvent`       |             | `CustomEvent<number>`           |
| `focusEvent`       |             | `CustomEvent<number>`           |
| `inputEvent`       |             | `CustomEvent<number>`           |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |
<!-- mwc:auto:end -->

---

### `ms-input-otp`

<!-- mwc:auto:start -->
## Properties

| Property          | Attribute          | Description | Type                                | Default                    |
| ----------------- | ------------------ | ----------- | ----------------------------------- | -------------------------- |
| `autoFocus`       | `auto-focus`       |             | `boolean`                           | `false`                    |
| `customClass`     | `custom-class`     |             | `string`                            | `''`                       |
| `disabled`        | `disabled`         |             | `boolean`                           | `false`                    |
| `errorMessage`    | `error-message`    |             | `string`                            | `null`                     |
| `idComponent`     | `id-component`     |             | `string`                            | `'ms-input-otp'`           |
| `invalid`         | `invalid`          |             | `boolean`                           | `false`                    |
| `length`          | `length`           |             | `number`                            | `4`                        |
| `name`            | `name`             |             | `string`                            | `null`                     |
| `placeholder`     | `placeholder`      |             | `string`                            | `''`                       |
| `readonly`        | `readonly`         |             | `boolean`                           | `false`                    |
| `required`        | `required`         |             | `boolean`                           | `false`                    |
| `requiredMessage` | `required-message` |             | `string`                            | `DEFAULT_REQUIRED_MESSAGE` |
| `type`            | `type`             |             | `"numeric" \| "password" \| "text"` | `'text'`                   |
| `value`           | `value`            |             | `any`                               | `null`                     |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `blurEvent`        |             | `CustomEvent<number>`           |
| `completeEvent`    |             | `CustomEvent<string>`           |
| `focusEvent`       |             | `CustomEvent<number>`           |
| `inputEvent`       |             | `CustomEvent<string>`           |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |
<!-- mwc:auto:end -->

---

### `ms-input-password`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description | Type               | Default                     |
| ------------- | -------------- | ----------- | ------------------ | --------------------------- |
| `completed`   | `completed`    |             | `boolean`          | `false`                     |
| `disabled`    | `disabled`     |             | `boolean`          | `false`                     |
| `feedback`    | `feedback`     |             | `boolean`          | `false`                     |
| `invalid`     | `invalid`      |             | `boolean`          | `false`                     |
| `label`       | `label`        |             | `string`           | `''`                        |
| `mediumLabel` | `medium-label` |             | `string`           | `'Medium'`                  |
| `mediumRegex` | `medium-regex` |             | `RegExp \| string` | `undefined`                 |
| `placeholder` | `placeholder`  |             | `string`           | `''`                        |
| `promptLabel` | `prompt-label` |             | `string`           | `'Please enter a password'` |
| `strongLabel` | `strong-label` |             | `string`           | `'Strong'`                  |
| `strongRegex` | `strong-regex` |             | `RegExp \| string` | `undefined`                 |
| `toggleMask`  | `toggle-mask`  |             | `boolean`          | `false`                     |
| `value`       | `value`        |             | `string`           | `''`                        |
| `weakLabel`   | `weak-label`   |             | `string`           | `'Weak'`                    |


## Events

| Event            | Description | Type                              |
| ---------------- | ----------- | --------------------------------- |
| `passwordChange` |             | `CustomEvent<{ value: string; }>` |
<!-- mwc:auto:end -->

---

### `ms-input-switch`

<!-- mwc:auto:start -->
## Properties

| Property          | Attribute          | Description                                                                        | Type             | Default     |
| ----------------- | ------------------ | ---------------------------------------------------------------------------------- | ---------------- | ----------- |
| `checked`         | `checked`          | Checked, to manipulate checkbox from outside                                       | `boolean`        | `false`     |
| `class`           | `class`            | Custom class                                                                       | `string`         | `undefined` |
| `disabled`        | `disabled`         | Disabled                                                                           | `boolean`        | `undefined` |
| `name`            | `name`             | Name of the native input, for form submission                                      | `string`         | `undefined` |
| `readonly`        | `readonly`         | Readonly - the switch is submitted with the form but cannot be toggled by the user | `boolean`        | `false`     |
| `tooltip`         | `tooltip`          | Content for tooltip                                                                | `string`         | `undefined` |
| `tooltipPosition` | `tooltip-position` | Tooltip Position                                                                   | `Position.Right` | `undefined` |
| `value`           | `value`            | Value submitted when checked (native default is "on")                              | `string`         | `undefined` |


## Events

| Event         | Description | Type                   |
| ------------- | ----------- | ---------------------- |
| `changeEvent` |             | `CustomEvent<boolean>` |
<!-- mwc:auto:end -->

---

### `ms-knob`

<!-- mwc:auto:start -->
## Properties

| Property        | Attribute        | Description | Type      | Default     |
| --------------- | ---------------- | ----------- | --------- | ----------- |
| `disabled`      | `disabled`       |             | `boolean` | `false`     |
| `max`           | `max`            |             | `number`  | `100`       |
| `min`           | `min`            |             | `number`  | `0`         |
| `rangeColor`    | `range-color`    |             | `string`  | `undefined` |
| `readOnly`      | `read-only`      |             | `boolean` | `false`     |
| `size`          | `size`           |             | `number`  | `100`       |
| `step`          | `step`           |             | `number`  | `1`         |
| `strokeWidth`   | `stroke-width`   |             | `number`  | `14`        |
| `textColor`     | `text-color`     |             | `string`  | `undefined` |
| `value`         | `value`          |             | `number`  | `0`         |
| `valueColor`    | `value-color`    |             | `string`  | `undefined` |
| `valueTemplate` | `value-template` |             | `string`  | `'{value}'` |


## Events

| Event         | Description | Type                  |
| ------------- | ----------- | --------------------- |
| `changeValue` |             | `CustomEvent<number>` |
<!-- mwc:auto:end -->

---

### `ms-radio`

<!-- mwc:auto:start -->
## Overview

Required validation is computed per radio (invalid while this radio is unchecked).
Group-level "one of N checked" validation across radios sharing the same name is not
computed by the component; the native required attribute forwarded to the input does
provide browser-level group semantics inside a real <form>.

## Properties

| Property          | Attribute          | Description | Type      | Default                    |
| ----------------- | ------------------ | ----------- | --------- | -------------------------- |
| `checked`         | `checked`          |             | `boolean` | `undefined`                |
| `class`           | `class`            |             | `string`  | `undefined`                |
| `disabled`        | `disabled`         |             | `boolean` | `undefined`                |
| `errorMessage`    | `error-message`    |             | `string`  | `null`                     |
| `idRadio`         | `id-radio`         |             | `string`  | `undefined`                |
| `invalid`         | `invalid`          |             | `boolean` | `false`                    |
| `isChecked`       | `is-checked`       |             | `boolean` | `undefined`                |
| `label`           | `label`            |             | `string`  | `undefined`                |
| `name`            | `name`             |             | `string`  | `undefined`                |
| `readonly`        | `readonly`         |             | `boolean` | `false`                    |
| `required`        | `required`         |             | `boolean` | `false`                    |
| `requiredMessage` | `required-message` |             | `string`  | `DEFAULT_REQUIRED_MESSAGE` |
| `value`           | `value`            |             | `string`  | `undefined`                |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `radioChange`      |             | `CustomEvent<any>`              |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |
<!-- mwc:auto:end -->

---

## Selection

### `ms-autocomplete`

<!-- mwc:auto:start -->
## Properties

| Property          | Attribute          | Description | Type                                  | Default                    |
| ----------------- | ------------------ | ----------- | ------------------------------------- | -------------------------- |
| `class`           | `class`            |             | `string`                              | `null`                     |
| `debounceTime`    | `debounce-time`    |             | `number`                              | `300`                      |
| `disabled`        | `disabled`         |             | `boolean`                             | `false`                    |
| `errorMessage`    | `error-message`    |             | `string`                              | `null`                     |
| `idComponent`     | `id-component`     |             | `string`                              | `'ms-autocomplete'`        |
| `invalid`         | `invalid`          |             | `boolean`                             | `false`                    |
| `label`           | `label`            |             | `string`                              | `null`                     |
| `optionGroup`     | `option-group`     |             | `boolean`                             | `false`                    |
| `placeholder`     | `placeholder`      |             | `string`                              | `'Type to search...'`      |
| `required`        | `required`         |             | `boolean`                             | `false`                    |
| `requiredMessage` | `required-message` |             | `string`                              | `DEFAULT_REQUIRED_MESSAGE` |
| `showIcon`        | `show-icon`        |             | `boolean`                             | `false`                    |
| `suggestions`     | --                 |             | `{ label: string; value: string; }[]` | `[]`                       |
| `value`           | `value`            |             | `number \| string`                    | `null`                     |


## Events

| Event              | Description | Type                                                                                               |
| ------------------ | ----------- | -------------------------------------------------------------------------------------------------- |
| `completeMethod`   |             | `CustomEvent<{ query: string; resolve: (results: { label: string; value: string; }[]) => void; }>` |
| `selected`         |             | `CustomEvent<{ label: string; value: string; }>`                                                   |
| `validationChange` |             | `CustomEvent<ValidationDetail>`                                                                    |
<!-- mwc:auto:end -->

---

### `ms-chips`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute     | Description | Type                                   | Default             |
| ------------- | ------------- | ----------- | -------------------------------------- | ------------------- |
| `class`       | `class`       |             | `string`                               | `undefined`         |
| `disabled`    | `disabled`    |             | `boolean`                              | `false`             |
| `invalid`     | `invalid`     |             | `boolean`                              | `false`             |
| `max`         | `max`         |             | `number`                               | `undefined`         |
| `placeholder` | `placeholder` |             | `string`                               | `undefined`         |
| `removable`   | `removable`   |             | `boolean`                              | `true`              |
| `separator`   | `separator`   |             | `Separator.Comma \| Separator.Default` | `Separator.Default` |
| `suggestions` | --            |             | `string[]`                             | `undefined`         |
| `value`       | --            |             | `string[]`                             | `undefined`         |
| `variant`     | `variant`     |             | `Variant.Filled \| Variant.Outlined`   | `Variant.Outlined`  |


## Events

| Event         | Description | Type                    |
| ------------- | ----------- | ----------------------- |
| `changeEvent` |             | `CustomEvent<string[]>` |
<!-- mwc:auto:end -->

---

### `ms-dropdown`

<!-- mwc:auto:start -->
## Properties

| Property          | Attribute          | Description | Type                    | Default                    |
| ----------------- | ------------------ | ----------- | ----------------------- | -------------------------- |
| `class`           | `class`            |             | `string`                | `null`                     |
| `disabled`        | `disabled`         |             | `boolean`               | `false`                    |
| `errorMessage`    | `error-message`    |             | `string`                | `null`                     |
| `filter`          | `filter`           |             | `boolean`               | `false`                    |
| `idComponent`     | `id-component`     |             | `string`                | `'ms-dropdown'`            |
| `invalid`         | `invalid`          |             | `boolean`               | `false`                    |
| `label`           | `label`            |             | `string`                | `null`                     |
| `optionGroup`     | `option-group`     |             | `boolean`               | `false`                    |
| `options`         | --                 |             | `GroupItem[] \| Item[]` | `[]`                       |
| `placeholder`     | `placeholder`      |             | `string`                | `'Select option'`          |
| `required`        | `required`         |             | `boolean`               | `false`                    |
| `requiredMessage` | `required-message` |             | `string`                | `DEFAULT_REQUIRED_MESSAGE` |
| `value`           | `value`            |             | `number \| string`      | `null`                     |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `selected`         |             | `CustomEvent<string>`           |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |
<!-- mwc:auto:end -->

---

### `ms-multiselect`

<!-- mwc:auto:start -->
## Properties

| Property              | Attribute                | Description | Type                    | Default                    |
| --------------------- | ------------------------ | ----------- | ----------------------- | -------------------------- |
| `class`               | `class`                  |             | `string`                | `null`                     |
| `debounceTime`        | `debounce-time`          |             | `number`                | `300`                      |
| `disabled`            | `disabled`               |             | `boolean`               | `false`                    |
| `display`             | `display`                |             | `string`                | `'comma'`                  |
| `errorMessage`        | `error-message`          |             | `string`                | `null`                     |
| `idComponent`         | `id-component`           |             | `string`                | `'ms-multiselect'`         |
| `invalid`             | `invalid`                |             | `boolean`               | `false`                    |
| `label`               | `label`                  |             | `string`                | `null`                     |
| `loading`             | `loading`                |             | `boolean`               | `false`                    |
| `optionGroup`         | `option-group`           |             | `boolean`               | `false`                    |
| `options`             | --                       |             | `GroupItem[] \| Item[]` | `[]`                       |
| `placeholder`         | `placeholder`            |             | `string`                | `'Select an item'`         |
| `remoteFilter`        | `remote-filter`          |             | `boolean`               | `false`                    |
| `required`            | `required`               |             | `boolean`               | `false`                    |
| `requiredMessage`     | `required-message`       |             | `string`                | `DEFAULT_REQUIRED_MESSAGE` |
| `selectAllOptionText` | `select-all-option-text` |             | `string`                | `''`                       |
| `showFilter`          | `show-filter`            |             | `boolean`               | `false`                    |
| `showSelectAll`       | `show-select-all`        |             | `boolean`               | `true`                     |
| `value`               | --                       |             | `GroupItem[] \| Item[]` | `undefined`                |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `filter`           |             | `CustomEvent<string>`           |
| `hide`             |             | `CustomEvent<boolean>`          |
| `selectAll`        |             | `CustomEvent<any>`              |
| `selected`         |             | `CustomEvent<string>`           |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |
<!-- mwc:auto:end -->

---

### `ms-select-button`

<!-- mwc:auto:start -->
## Properties

| Property          | Attribute          | Description | Type                                                                 | Default                    |
| ----------------- | ------------------ | ----------- | -------------------------------------------------------------------- | -------------------------- |
| `class`           | `class`            |             | `string`                                                             | `null`                     |
| `disabled`        | `disabled`         |             | `boolean`                                                            | `false`                    |
| `errorMessage`    | `error-message`    |             | `string`                                                             | `null`                     |
| `idComponent`     | `id-component`     |             | `string`                                                             | `'ms-select-button'`       |
| `invalid`         | `invalid`          |             | `boolean`                                                            | `false`                    |
| `label`           | `label`            |             | `string`                                                             | `null`                     |
| `multiple`        | `multiple`         |             | `boolean`                                                            | `false`                    |
| `options`         | --                 |             | `Item[] \| string[]`                                                 | `[]`                       |
| `required`        | `required`         |             | `boolean`                                                            | `false`                    |
| `requiredMessage` | `required-message` |             | `string`                                                             | `DEFAULT_REQUIRED_MESSAGE` |
| `tooltip`         | `tooltip`          |             | `string`                                                             | `null`                     |
| `tooltipPosition` | `tooltip-position` |             | `Position.Bottom \| Position.Left \| Position.Right \| Position.Top` | `Position.Top`             |
| `value`           | `value`            |             | `any`                                                                | `null`                     |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `changeValue`      |             | `CustomEvent<any>`              |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |
<!-- mwc:auto:end -->

---

## Navigation and layout

### `ms-accordion`

<!-- mwc:auto:start -->
## Properties

| Property       | Attribute       | Description | Type                 | Default |
| -------------- | --------------- | ----------- | -------------------- | ------- |
| `activeIndex`  | `active-index`  |             | `number \| number[]` | `-1`    |
| `contentClass` | `content-class` |             | `string`             | `''`    |
| `disabled`     | --              |             | `number[]`           | `[]`    |
| `headerClass`  | `header-class`  |             | `string`             | `''`    |
| `multiple`     | `multiple`      |             | `boolean`            | `false` |


## Events

| Event       | Description | Type                                                                        |
| ----------- | ----------- | --------------------------------------------------------------------------- |
| `tabChange` |             | `CustomEvent<{ index: number; isOpen: boolean; activeIndexes: number[]; }>` |
| `tabClose`  |             | `CustomEvent<{ index: number; activeIndexes: number[]; }>`                  |
| `tabOpen`   |             | `CustomEvent<{ index: number; activeIndexes: number[]; }>`                  |
<!-- mwc:auto:end -->

---

### `ms-breadcrumb`

<!-- mwc:auto:start -->
## Properties

| Property        | Attribute        | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                          | Default                  |
| --------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `customClass`   | `custom-class`   |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                      | `''`                     |
| `home`          | --               |             | `BreadcrumbItem`                                                                                                                                                                                                                                                                                                                                                                                              | `null`                   |
| `idPrefix`      | `id-prefix`      |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                      | `'ms-breadcrumb'`        |
| `model`         | --               |             | `BreadcrumbItem[]`                                                                                                                                                                                                                                                                                                                                                                                            | `[]`                     |
| `separatorIcon` | `separator-icon` |             | `"info" \| "success" \| "alert" \| "close" \| "home" \| "breadcrumb-separator" \| "chevron-double-left" \| "chevron-left" \| "chevron-double-right" \| "chevron-right" \| "next" \| "previous" \| "close-circle" \| "search" \| "calendar" \| "increment" \| "decrement" \| "up-arrow" \| "down-arrow" \| "expanded-up" \| "expanded-down" \| "sort" \| "sort-up" \| "sort-down" \| "warning" \| "not-found"` | `'breadcrumb-separator'` |
<!-- mwc:auto:end -->

---

### `ms-navbar`

<!-- mwc:auto:start -->
## Properties

| Property           | Attribute            | Description | Type                     | Default |
| ------------------ | -------------------- | ----------- | ------------------------ | ------- |
| `accordion`        | `accordion`          |             | `boolean`                | `true`  |
| `activeItemId`     | `active-item-id`     |             | `string`                 | `''`    |
| `customClass`      | `custom-class`       |             | `string`                 | `''`    |
| `defaultCollapsed` | `default-collapsed`  |             | `boolean`                | `true`  |
| `items`            | `items`              |             | `NavbarItem[] \| string` | `[]`    |
| `showToggleButton` | `show-toggle-button` |             | `boolean`                | `false` |


## Events

| Event           | Description | Type                   |
| --------------- | ----------- | ---------------------- |
| `itemSelect`    |             | `CustomEvent<string>`  |
| `sidebarToggle` |             | `CustomEvent<boolean>` |


## Methods

### `collapse() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `expand() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `toggle() => Promise<void>`



#### Returns

Type: `Promise<void>`
<!-- mwc:auto:end -->

---

### `ms-sidebar`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description | Type                                     | Default     |
| ------------- | -------------- | ----------- | ---------------------------------------- | ----------- |
| `class`       | `class`        |             | `string`                                 | `undefined` |
| `content`     | `content`      |             | `boolean`                                | `false`     |
| `dismissible` | `dismissible`  |             | `boolean`                                | `true`      |
| `fullScreen`  | `full-screen`  |             | `boolean`                                | `false`     |
| `idComponent` | `id-component` |             | `string`                                 | `undefined` |
| `position`    | `position`     |             | `"bottom" \| "left" \| "right" \| "top"` | `'left'`    |
| `visible`     | `visible`      |             | `boolean`                                | `false`     |


## Events

| Event  | Description | Type                   |
| ------ | ----------- | ---------------------- |
| `hide` |             | `CustomEvent<boolean>` |
<!-- mwc:auto:end -->

---

### `ms-steps`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description | Type         | Default     |
| ------------- | -------------- | ----------- | ------------ | ----------- |
| `activeIndex` | `active-index` |             | `number`     | `0`         |
| `customClass` | `custom-class` |             | `string`     | `undefined` |
| `readonly`    | `readonly`     |             | `boolean`    | `true`      |
| `steps`       | --             |             | `StepItem[]` | `undefined` |


## Events

| Event        | Description | Type                  |
| ------------ | ----------- | --------------------- |
| `stepChange` |             | `CustomEvent<number>` |
| `stepSelect` |             | `CustomEvent<any>`    |
<!-- mwc:auto:end -->

---

### `ms-tabs`

<!-- mwc:auto:start -->
## Properties

| Property       | Attribute    | Description | Type                                                       | Default           |
| -------------- | ------------ | ----------- | ---------------------------------------------------------- | ----------------- |
| `activeTab`    | `active-tab` |             | `number`                                                   | `0`               |
| `disabledTabs` | --           |             | `number[]`                                                 | `[]`              |
| `hierarchy`    | `hierarchy`  |             | `Variant.Primary \| Variant.Secondary \| Variant.Tertiary` | `Variant.Primary` |


## Events

| Event       | Description | Type               |
| ----------- | ----------- | ------------------ |
| `tabChange` |             | `CustomEvent<any>` |
<!-- mwc:auto:end -->

---

## Display and visualization

### `ms-badge`

<!-- mwc:auto:start -->
## Properties

| Property   | Attribute  | Description                                           | Type                                      | Default      |
| ---------- | ---------- | ----------------------------------------------------- | ----------------------------------------- | ------------ |
| `class`    | `class`    | Style Class                                           | `string`                                  | `undefined`  |
| `severity` | `severity` | Severity Type of Badge                                | `string`                                  | `undefined`  |
| `size`     | `size`     | Size of the badge, valid options are large and xlarge | `Size.Large \| Size.Medium \| Size.Small` | `Size.Small` |
| `value`    | `value`    | The first name                                        | `string`                                  | `undefined`  |
<!-- mwc:auto:end -->

---

### `ms-icon`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description                               | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Default          |
| ------------- | -------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `color`       | `color`        | Color of the icon (default: currentColor) | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `'currentColor'` |
| `customClass` | `custom-class` | Additional CSS class                      | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`      |
| `name`        | `name`         | Name of the icon to display               | `"filter" \| "info" \| "copy" \| "menu" \| "download" \| "x" \| "home" \| "chevron-left" \| "chevron-right" \| "search" \| "calendar" \| "alert-circle" \| "alert-triangle" \| "arrow-left" \| "arrow-right" \| "bell" \| "check" \| "check-circle" \| "chevron-down" \| "chevron-up" \| "edit" \| "eye" \| "eye-off" \| "lock" \| "mail" \| "minus" \| "plus" \| "refresh" \| "settings" \| "trash" \| "unlock" \| "upload" \| "user" \| "nav-administration" \| "nav-agent" \| "nav-business-intelligence" \| "nav-callcenter-ai" \| "nav-compliance" \| "nav-customer" \| "nav-finance" \| "nav-home" \| "nav-operations" \| "nav-owner" \| "nav-product" \| "nav-sales" \| "nav-zeus-lab"` | `undefined`      |
| `size`        | `size`         | Size of the icon in pixels (default: 24)  | `number \| string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `24`             |
<!-- mwc:auto:end -->

---

### `ms-image`

<!-- mwc:auto:start -->
## Properties

| Property           | Attribute        | Description | Type               | Default     |
| ------------------ | ---------------- | ----------- | ------------------ | ----------- |
| `alt` _(required)_ | `alt`            |             | `string`           | `undefined` |
| `height`           | `height`         |             | `number \| string` | `undefined` |
| `indicatorIcon`    | `indicator-icon` |             | `string`           | `undefined` |
| `preview`          | `preview`        |             | `boolean`          | `false`     |
| `src` _(required)_ | `src`            |             | `string`           | `undefined` |
| `width`            | `width`          |             | `number \| string` | `undefined` |
| `zoomSrc`          | `zoom-src`       |             | `string`           | `undefined` |


## Shadow Parts

| Part               | Description |
| ------------------ | ----------- |
| `"image"`          |             |
| `"indicator"`      |             |
| `"indicator-icon"` |             |
| `"modal-image"`    |             |
<!-- mwc:auto:end -->

---

### `ms-message`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description | Type                                                          | Default  |
| ------------- | -------------- | ----------- | ------------------------------------------------------------- | -------- |
| `customClass` | `custom-class` |             | `string`                                                      | `''`     |
| `noIcon`      | `no-icon`      |             | `boolean`                                                     | `false`  |
| `variant`     | `variant`      |             | `"danger" \| "info" \| "secondary" \| "success" \| "warning"` | `'info'` |
<!-- mwc:auto:end -->

---

### `ms-notification`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description | Type                                                                                                                                                     | Default             |
| ------------- | -------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `detail`      | `detail`       |             | `string`                                                                                                                                                 | `null`              |
| `idComponent` | `id-component` |             | `string`                                                                                                                                                 | `undefined`         |
| `life`        | `life`         |             | `number`                                                                                                                                                 | `3000`              |
| `position`    | `position`     |             | `Position.BottomCenter \| Position.BottomLeft \| Position.BottomRight \| Position.Center \| Position.TopCenter \| Position.TopLeft \| Position.TopRight` | `Position.TopRight` |
| `severity`    | `severity`     |             | `Severity.Alert \| Severity.Info \| Severity.Success \| Severity.Warning`                                                                                | `Severity.Info`     |
| `summary`     | `summary`      |             | `string`                                                                                                                                                 | `null`              |
| `visible`     | `visible`      |             | `boolean`                                                                                                                                                | `false`             |
<!-- mwc:auto:end -->

---

### `ms-skeleton`

<!-- mwc:auto:start -->
## Properties

| Property       | Attribute       | Description | Type     | Default |
| -------------- | --------------- | ----------- | -------- | ------- |
| `borderRadius` | `border-radius` |             | `string` | `null`  |
| `class`        | `class`         |             | `string` | `null`  |
| `height`       | `height`        |             | `string` | `null`  |
| `shape`        | `shape`         |             | `string` | `null`  |
| `width`        | `width`         |             | `string` | `null`  |
<!-- mwc:auto:end -->

---

### `ms-spinner`

<!-- mwc:auto:start -->
## Properties

| Property | Attribute | Description | Type     | Default     |
| -------- | --------- | ----------- | -------- | ----------- |
| `color`  | `color`   |             | `string` | `"#8CA2D4"` |
| `height` | `height`  |             | `string` | `'2rem'`    |
| `width`  | `width`   |             | `string` | `'2rem'`    |
<!-- mwc:auto:end -->

---

## Interactive and complex

### `ms-button`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description | Type      | Default                 |
| ------------- | -------------- | ----------- | --------- | ----------------------- |
| `class`       | `class`        |             | `string`  | `undefined`             |
| `customClass` | `custom-class` |             | `string`  | `undefined`             |
| `disabled`    | `disabled`     |             | `boolean` | `false`                 |
| `icon`        | `icon`         |             | `string`  | `undefined`             |
| `label`       | `label`        |             | `string`  | `undefined`             |
| `loading`     | `loading`      |             | `boolean` | `undefined`             |
| `size`        | `size`         |             | `string`  | `ButtonSize.medium`     |
| `type`        | `type`         |             | `string`  | `ButtonType.button`     |
| `variant`     | `variant`      |             | `string`  | `ButtonVariant.primary` |


## Events

| Event        | Description | Type                      |
| ------------ | ----------- | ------------------------- |
| `clickEvent` |             | `CustomEvent<MouseEvent>` |
<!-- mwc:auto:end -->

---

### `ms-calendar`

<!-- mwc:auto:start -->
## Properties

| Property             | Attribute              | Description | Type                                          | Default                    |
| -------------------- | ---------------------- | ----------- | --------------------------------------------- | -------------------------- |
| `class`              | `class`                |             | `string`                                      | `null`                     |
| `closeOnSelect`      | `close-on-select`      |             | `boolean`                                     | `false`                    |
| `disabled`           | `disabled`             |             | `boolean`                                     | `false`                    |
| `errorMessage`       | `error-message`        |             | `string`                                      | `null`                     |
| `hourFormat`         | `hour-format`          |             | `"12" \| "24"`                                | `'24'`                     |
| `idComponent`        | `id-component`         |             | `string`                                      | `'ms-calendar'`            |
| `invalid`            | `invalid`              |             | `boolean`                                     | `false`                    |
| `label`              | `label`                |             | `string`                                      | `null`                     |
| `maxDate`            | --                     |             | `Date`                                        | `null`                     |
| `minDate`            | --                     |             | `Date`                                        | `null`                     |
| `placeholder`        | `placeholder`          |             | `string`                                      | `'Select a date'`          |
| `required`           | `required`             |             | `boolean`                                     | `false`                    |
| `requiredMessage`    | `required-message`     |             | `string`                                      | `DEFAULT_REQUIRED_MESSAGE` |
| `selectionMode`      | `selection-mode`       |             | `SelectionMode.Range \| SelectionMode.Single` | `SelectionMode.Single`     |
| `showAmPmControls`   | `show-am-pm-controls`  |             | `boolean`                                     | `true`                     |
| `showHourControls`   | `show-hour-controls`   |             | `boolean`                                     | `true`                     |
| `showIcon`           | `show-icon`            |             | `boolean`                                     | `false`                    |
| `showMinuteControls` | `show-minute-controls` |             | `boolean`                                     | `true`                     |
| `showTime`           | `show-time`            |             | `boolean`                                     | `false`                    |
| `stepHour`           | `step-hour`            |             | `number`                                      | `1`                        |
| `stepMinute`         | `step-minute`          |             | `number`                                      | `1`                        |
| `value`              | `value`                |             | `number \| string \| string[]`                | `null`                     |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `update`           |             | `CustomEvent<any>`              |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |
<!-- mwc:auto:end -->

---

### `ms-carousel`

<!-- mwc:auto:start -->
## Properties

| Property            | Attribute           | Description | Type                 | Default     |
| ------------------- | ------------------- | ----------- | -------------------- | ----------- |
| `autoplay`          | `autoplay`          |             | `boolean`            | `false`     |
| `autoplayInterval`  | `autoplay-interval` |             | `number`             | `3000`      |
| `customClass`       | `custom-class`      |             | `string`             | `''`        |
| `dragThreshold`     | `drag-threshold`    |             | `number`             | `50`        |
| `infinite`          | `infinite`          |             | `boolean`            | `false`     |
| `numScroll`         | `num-scroll`        |             | `number`             | `1`         |
| `numVisible`        | `num-visible`       |             | `number`             | `1`         |
| `responsiveOptions` | --                  |             | `ResponsiveOption[]` | `undefined` |
| `showIndicators`    | `show-indicators`   |             | `boolean`            | `true`      |
| `showNavigators`    | `show-navigators`   |             | `boolean`            | `true`      |
| `value`             | --                  |             | `any[]`              | `[]`        |
<!-- mwc:auto:end -->

---

### `ms-cascade-menu`

<!-- mwc:auto:start -->
## Properties

| Property       | Attribute        | Description | Type                          | Default   |
| -------------- | ---------------- | ----------- | ----------------------------- | --------- |
| `activeItemId` | `active-item-id` |             | `string`                      | `''`      |
| `customClass`  | `custom-class`   |             | `string`                      | `''`      |
| `menuData`     | `menu-data`      |             | `CascadeMenuItem[] \| string` | `[]`      |
| `minWidth`     | `min-width`      |             | `string`                      | `'220px'` |
| `width`        | `width`          |             | `string`                      | `''`      |


## Events

| Event       | Description | Type                  |
| ----------- | ----------- | --------------------- |
| `itemClick` |             | `CustomEvent<string>` |
<!-- mwc:auto:end -->

---

### `ms-chart`

<!-- mwc:auto:start -->
## Properties

| Property  | Attribute | Description                                                               | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Default                |
| --------- | --------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `class`   | `class`   | Custom CSS class                                                          | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `undefined`            |
| `data`    | --        | Chart data object containing labels and datasets                          | `ChartData<keyof ChartTypeRegistry, (number \| Point \| [number, number] \| BubbleDataPoint)[], unknown>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`            |
| `height`  | `height`  | Container height                                                          | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `'400px'`              |
| `options` | --        | Chart.js configuration options                                            | `{ datasets?: _DeepPartialObject<{ line: LineControllerDatasetOptions & FillerControllerDatasetOptions; bar: BarControllerDatasetOptions; scatter: LineControllerDatasetOptions; bubble: BubbleControllerDatasetOptions; pie: DoughnutControllerDatasetOptions; doughnut: DoughnutControllerDatasetOptions; polarArea: PolarAreaControllerDatasetOptions; radar: RadarControllerDatasetOptions & FillerControllerDatasetOptions; }>; indexAxis?: "x" \| "y"; clip?: number \| false \| _DeepPartialObject<ChartArea>; color?: string \| _DeepPartialObject<CanvasGradient> \| _DeepPartialObject<CanvasPattern> \| ((ctx: ScriptableContext<keyof ChartTypeRegistry>, options: AnyObject) => Color); backgroundColor?: string \| _DeepPartialObject<CanvasGradient> \| _DeepPartialObject<CanvasPattern> \| readonly (string \| _DeepPartialObject<CanvasGradient> \| _DeepPartialObject<CanvasPattern>)[] \| ((ctx: ScriptableContext<keyof ChartTypeRegistry>, options: AnyObject) => Color); hoverBackgroundColor?: string \| _DeepPartialObject<CanvasGradient> \| _DeepPartialObject<CanvasPattern> \| readonly (string \| _DeepPartialObject<CanvasGradient> \| _DeepPartialObject<CanvasPattern>)[] \| ((ctx: ScriptableContext<keyof ChartTypeRegistry>, options: AnyObject) => Color); borderColor?: string \| _DeepPartialObject<CanvasGradient> \| _DeepPartialObject<CanvasPattern> \| readonly (string \| _DeepPartialObject<CanvasGradient> \| _DeepPartialObject<CanvasPattern>)[] \| ((ctx: ScriptableContext<keyof ChartTypeRegistry>, options: AnyObject) => Color); hoverBorderColor?: string \| _DeepPartialObject<CanvasGradient> \| _DeepPartialObject<CanvasPattern> \| readonly (string \| _DeepPartialObject<CanvasGradient> \| _DeepPartialObject<CanvasPattern>)[] \| ((ctx: ScriptableContext<keyof ChartTypeRegistry>, options: AnyObject) => Color); font?: _DeepPartialObject<Partial<FontSpec>>; responsive?: boolean; maintainAspectRatio?: boolean; resizeDelay?: number; aspectRatio?: number; locale?: string; onResize?: (chart: Chart<keyof ChartTypeRegistry, (number \| Point \| [number, number] \| BubbleDataPoint)[], unknown>, size: { width: number; height: number; }) => void; devicePixelRatio?: number; interaction?: _DeepPartialObject<CoreInteractionOptions>; hover?: _DeepPartialObject<CoreInteractionOptions>; events?: _DeepPartialArray<keyof HTMLElementEventMap>; onHover?: (event: ChartEvent, elements: ActiveElement[], chart: Chart<keyof ChartTypeRegistry, (number \| Point \| [number, number] \| BubbleDataPoint)[], unknown>) => void; onClick?: (event: ChartEvent, elements: ActiveElement[], chart: Chart<keyof ChartTypeRegistry, (number \| Point \| [number, number] \| BubbleDataPoint)[], unknown>) => void; layout?: _DeepPartialObject<Partial<{ autoPadding: boolean; padding: Scriptable<Padding, ScriptableContext<keyof ChartTypeRegistry>>; }>>; parsing?: false \| _DeepPartialObject<{ [key: string]: string; }>; normalized?: boolean; animation?: false \| _DeepPartialObject<AnimationSpec<keyof ChartTypeRegistry> & { onProgress?: (this: Chart<keyof ChartTypeRegistry, (number \| Point \| [number, number] \| BubbleDataPoint)[], unknown>, event: AnimationEvent) => void; onComplete?: (this: Chart<keyof ChartTypeRegistry, (number \| Point \| [number, number] \| BubbleDataPoint)[], unknown>, event: AnimationEvent) => void; }>; animations?: _DeepPartialObject<AnimationsSpec<keyof ChartTypeRegistry>>; transitions?: _DeepPartialObject<TransitionsSpec<keyof ChartTypeRegistry>>; elements?: _DeepPartialObject<ElementOptionsByType<keyof ChartTypeRegistry>>; plugins?: _DeepPartialObject<PluginOptionsByType<keyof ChartTypeRegistry>>; line?: _DeepPartialObject<{ datasets: LineControllerDatasetOptions & FillerControllerDatasetOptions; }>; bar?: _DeepPartialObject<{ datasets: BarControllerDatasetOptions; }>; scatter?: _DeepPartialObject<{ datasets: LineControllerDatasetOptions; }>; bubble?: _DeepPartialObject<{ datasets: BubbleControllerDatasetOptions; }>; pie?: _DeepPartialObject<{ datasets: DoughnutControllerDatasetOptions; }>; doughnut?: _DeepPartialObject<{ datasets: DoughnutControllerDatasetOptions; }>; polarArea?: _DeepPartialObject<{ datasets: PolarAreaControllerDatasetOptions; }>; radar?: _DeepPartialObject<{ datasets: RadarControllerDatasetOptions & FillerControllerDatasetOptions; }>; scales?: _DeepPartialObject<{ [key: string]: ScaleOptionsByType<"radialLinear" \| keyof CartesianScaleTypeRegistry>; }>; }` | `{}`                   |
| `type`    | `type`    | Chart type (line, bar, pie, doughnut, radar, polarArea, bubble, scatter)  | `"bar" \| "bubble" \| "doughnut" \| "line" \| "pie" \| "polarArea" \| "radar" \| "scatter"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `'bar'`                |
| `variant` | `variant` | Color variant (primary, secondary, success, warning, danger, info, mixed) | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `ChartVariant.primary` |
| `width`   | `width`   | Container width                                                           | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `'100%'`               |


## Events

| Event        | Description                             | Type                           |
| ------------ | --------------------------------------- | ------------------------------ |
| `chartClick` | Emitted when a chart element is clicked | `CustomEvent<ChartClickEvent>` |
| `chartReady` | Emitted when the chart is ready         | `CustomEvent<any>`             |
<!-- mwc:auto:end -->

---

### `ms-dialog`

<!-- mwc:auto:start -->
## Properties

| Property         | Attribute         | Description | Type                                                                                                                                                                            | Default           |
| ---------------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `class`          | `class`           |             | `string`                                                                                                                                                                        | `null`            |
| `closable`       | `closable`        |             | `boolean`                                                                                                                                                                       | `true`            |
| `footer`         | `footer`          |             | `any`                                                                                                                                                                           | `undefined`       |
| `header`         | `header`          |             | `any`                                                                                                                                                                           | `undefined`       |
| `idComponent`    | `id-component`    |             | `string`                                                                                                                                                                        | `undefined`       |
| `position`       | `position`        |             | `Position.Bottom \| Position.BottomLeft \| Position.BottomRight \| Position.Center \| Position.Left \| Position.Right \| Position.Top \| Position.TopLeft \| Position.TopRight` | `Position.Center` |
| `showFooter`     | `show-footer`     |             | `boolean`                                                                                                                                                                       | `false`           |
| `styleComponent` | `style-component` |             | `string`                                                                                                                                                                        | `undefined`       |
| `visible`        | `visible`         |             | `boolean`                                                                                                                                                                       | `false`           |
| `zIndex`         | `z-index`         |             | `string`                                                                                                                                                                        | `'9000'`          |


## Events

| Event  | Description | Type                   |
| ------ | ----------- | ---------------------- |
| `hide` |             | `CustomEvent<boolean>` |
<!-- mwc:auto:end -->

---

### `ms-inplace`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description                                        | Type      | Default |
| ------------- | -------------- | -------------------------------------------------- | --------- | ------- |
| `active`      | `active`       | Muestra el contenido editable en lugar del display | `boolean` | `false` |
| `closable`    | `closable`     | Agrega botón de cierre para volver al modo display | `boolean` | `false` |
| `customClass` | `custom-class` | Clase personalizada aplicada al contenedor         | `string`  | `''`    |
| `disabled`    | `disabled`     | Deshabilita la apertura del componente             | `boolean` | `false` |


## Events

| Event      | Description                                       | Type                   |
| ---------- | ------------------------------------------------- | ---------------------- |
| `msClose`  | Se emite al cerrar y volver al display            | `CustomEvent<void>`    |
| `msOpen`   | Se emite al abrir el contenido                    | `CustomEvent<void>`    |
| `msToggle` | Se emite al cambiar de estado, con el nuevo valor | `CustomEvent<boolean>` |
<!-- mwc:auto:end -->

---

### `ms-menubar`

<!-- mwc:auto:start -->
## Properties

| Property           | Attribute             | Description | Type                      | Default |
| ------------------ | --------------------- | ----------- | ------------------------- | ------- |
| `cascadeMenuClass` | `cascade-menu-class`  |             | `string`                  | `''`    |
| `customClass`      | `custom-class`        |             | `string`                  | `''`    |
| `items`            | `items`               |             | `MenubarItem[] \| string` | `[]`    |
| `menuActiveItemId` | `menu-active-item-id` |             | `string`                  | `''`    |
<!-- mwc:auto:end -->

---

### `ms-popover`

<!-- mwc:auto:start -->
## Properties

| Property        | Attribute         | Description | Type                                                                     | Default            |
| --------------- | ----------------- | ----------- | ------------------------------------------------------------------------ | ------------------ |
| `closeOnEscape` | `close-on-escape` |             | `boolean`                                                                | `true`             |
| `customClass`   | `custom-class`    |             | `string`                                                                 | `''`               |
| `dismissable`   | `dismissable`     |             | `boolean`                                                                | `true`             |
| `placement`     | `placement`       |             | `Placement.Bottom \| Placement.Left \| Placement.Right \| Placement.Top` | `Placement.Bottom` |
| `showCloseIcon` | `show-close-icon` |             | `boolean`                                                                | `false`            |
| `trigger`       | `trigger`         |             | `Trigger.Click \| Trigger.Focus \| Trigger.Hover`                        | `Trigger.Click`    |
<!-- mwc:auto:end -->

---

### `ms-table`

<!-- mwc:auto:start -->
## Properties

| Property                 | Attribute              | Description | Type                                                                                                                                                                                                       | Default       |
| ------------------------ | ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `bordered`               | `bordered`             |             | `boolean`                                                                                                                                                                                                  | `false`       |
| `class`                  | `class`                |             | `string`                                                                                                                                                                                                   | `undefined`   |
| `columns`                | --                     |             | `{ header: string; field?: string; align?: Align; alignHeader?: Align; width?: string; render?: (row: any, index: number) => any; sortable?: boolean; footer?: any; disabled?: (row: any) => boolean; }[]` | `[]`          |
| `columnsReorderable`     | `columns-reorderable`  |             | `boolean`                                                                                                                                                                                                  | `false`       |
| `data`                   | `data`                 |             | `any`                                                                                                                                                                                                      | `[]`          |
| `dataKey`                | `data-key`             |             | `number \| string`                                                                                                                                                                                         | `'id'`        |
| `disabledRow`            | --                     |             | `(row: any) => boolean`                                                                                                                                                                                    | `undefined`   |
| `expandableRow`          | `expandable-row`       |             | `boolean`                                                                                                                                                                                                  | `false`       |
| `groupRowsBy`            | `group-rows-by`        |             | `string`                                                                                                                                                                                                   | `undefined`   |
| `idComponent`            | `id-component`         |             | `string`                                                                                                                                                                                                   | `''`          |
| `isFramework`            | `is-framework`         |             | `boolean`                                                                                                                                                                                                  | `true`        |
| `loading`                | `loading`              |             | `boolean`                                                                                                                                                                                                  | `false`       |
| `nestedTableContent`     | `nested-table-content` |             | `any`                                                                                                                                                                                                      | `null`        |
| `page`                   | `page`                 |             | `number`                                                                                                                                                                                                   | `0`           |
| `paginator`              | `paginator`            |             | `boolean`                                                                                                                                                                                                  | `false`       |
| `reorderable`            | `reorderable`          |             | `boolean`                                                                                                                                                                                                  | `false`       |
| `rowClassName`           | --                     |             | `(event: any) => string`                                                                                                                                                                                   | `undefined`   |
| `rowGroupHeaderTemplate` | --                     |             | `(groupValue: any, groupData: any[]) => any`                                                                                                                                                               | `undefined`   |
| `rowGroupMode`           | `row-group-mode`       |             | `"subheader"`                                                                                                                                                                                              | `undefined`   |
| `rowsPerPage`            | `rows-per-page`        |             | `number`                                                                                                                                                                                                   | `20`          |
| `scrollerHeight`         | `scroller-height`      |             | `string`                                                                                                                                                                                                   | `undefined`   |
| `selectionRow`           | `selection-row`        |             | `boolean`                                                                                                                                                                                                  | `false`       |
| `selections`             | --                     |             | `any[]`                                                                                                                                                                                                    | `[]`          |
| `showFooter`             | `show-footer`          |             | `boolean`                                                                                                                                                                                                  | `false`       |
| `size`                   | `size`                 |             | `Size.Large \| Size.Normal \| Size.Small`                                                                                                                                                                  | `Size.Normal` |
| `sortField`              | `sort-field`           |             | `string`                                                                                                                                                                                                   | `''`          |
| `sortOrder`              | `sort-order`           |             | `any`                                                                                                                                                                                                      | `''`          |
| `stickyHeader`           | `sticky-header`        |             | `boolean`                                                                                                                                                                                                  | `undefined`   |
| `totalRecords`           | `total-records`        |             | `number`                                                                                                                                                                                                   | `0`           |


## Events

| Event             | Description | Type                    |
| ----------------- | ----------- | ----------------------- |
| `columnsReorder`  |             | `CustomEvent<any>`      |
| `expand`          |             | `CustomEvent<any>`      |
| `paginatorChange` |             | `CustomEvent<any>`      |
| `reorder`         |             | `CustomEvent<any>`      |
| `rowClick`        |             | `CustomEvent<any>`      |
| `selection`       |             | `CustomEvent<string[]>` |
| `sort`            |             | `CustomEvent<any>`      |
<!-- mwc:auto:end -->

---

### `ms-text-editor`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute     | Description | Type      | Default                       |
| ------------- | ------------- | ----------- | --------- | ----------------------------- |
| `placeholder` | `placeholder` |             | `string`  | `'Type your content here...'` |
| `readonly`    | `readonly`    |             | `boolean` | `false`                       |
| `value`       | `value`       |             | `string`  | `''`                          |


## Events

| Event        | Description | Type                  |
| ------------ | ----------- | --------------------- |
| `textChange` |             | `CustomEvent<string>` |
<!-- mwc:auto:end -->

---

## Feedback and progress

### `ms-meter-group`

<!-- mwc:auto:start -->
## Properties

| Property           | Attribute           | Description | Type                         | Default        |
| ------------------ | ------------------- | ----------- | ---------------------------- | -------------- |
| `customClass`      | `custom-class`      |             | `string`                     | `''`           |
| `labelOrientation` | `label-orientation` |             | `"horizontal" \| "vertical"` | `'horizontal'` |
| `labelPosition`    | `label-position`    |             | `"end" \| "start"`           | `'end'`        |
| `max`              | `max`               |             | `number`                     | `100`          |
| `min`              | `min`               |             | `number`                     | `0`            |
| `orientation`      | `orientation`       |             | `"horizontal" \| "vertical"` | `'horizontal'` |
| `values`           | `values`            |             | `MeterValue[] \| string`     | `[]`           |
<!-- mwc:auto:end -->

---

### `ms-progress-bar`

<!-- mwc:auto:start -->
## Properties

| Property               | Attribute | Description | Type                               | Default         |
| ---------------------- | --------- | ----------- | ---------------------------------- | --------------- |
| `displayValueTemplate` | --        |             | `(value: number) => any`           | `undefined`     |
| `mode`                 | `mode`    |             | `"determinate" \| "indeterminate"` | `'determinate'` |
| `unit`                 | `unit`    |             | `string`                           | `'%'`           |
| `value`                | `value`   |             | `number`                           | `undefined`     |
<!-- mwc:auto:end -->

---

### `ms-timeline`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description | Type                                                       | Default          |
| ------------- | -------------- | ----------- | ---------------------------------------------------------- | ---------------- |
| `align`       | `align`        |             | `Alignment.Alternate \| Alignment.Left \| Alignment.Right` | `Alignment.Left` |
| `class`       | `class`        |             | `string`                                                   | `null`           |
| `events`      | --             |             | `{ [key: string]: any; }[]`                                | `[]`             |
| `idComponent` | `id-component` |             | `string`                                                   | `''`             |
<!-- mwc:auto:end -->

---

### `ms-tooltip`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description | Type                                                                 | Default        |
| ------------- | -------------- | ----------- | -------------------------------------------------------------------- | -------------- |
| `class`       | `class`        |             | `string`                                                             | `null`         |
| `content`     | `content`      |             | `string`                                                             | `''`           |
| `position`    | `position`     |             | `Position.Bottom \| Position.Left \| Position.Right \| Position.Top` | `Position.Top` |
| `showContent` | `show-content` |             | `boolean`                                                            | `true`         |
<!-- mwc:auto:end -->

---

## Utilities

### `ms-fieldset`

<!-- mwc:auto:start -->
## Properties

| Property      | Attribute      | Description | Type      | Default |
| ------------- | -------------- | ----------- | --------- | ------- |
| `customClass` | `custom-class` |             | `string`  | `''`    |
| `legend`      | `legend`       |             | `string`  | `''`    |
| `toggleable`  | `toggleable`   |             | `boolean` | `false` |
<!-- mwc:auto:end -->

---

### `ms-file-upload`

<!-- mwc:auto:start -->
## Properties

| Property                        | Attribute                           | Description                                                                                      | Type                                                             | Default                         |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------- |
| `accept`                        | `accept`                            | Pattern to restrict allowed file types, e.g. "image/*"                                           | `string`                                                         | `undefined`                     |
| `addLabel`                      | `add-label`                         | Heading label inside the empty drop zone                                                         | `string`                                                         | `'Add File'`                    |
| `auto`                          | `auto`                              | When true, upload begins automatically after file selection                                      | `boolean`                                                        | `false`                         |
| `browseLabel`                   | `browse-label`                      | Text for the clickable browse link inside the drop zone                                          | `string`                                                         | `'browse file'`                 |
| `buttonsPosition`               | `buttons-position`                  | Position of Cancel/Upload buttons relative to the drop zone (activates the new drag-zone design) | `"bottom-center" \| "bottom-left" \| "left" \| "right" \| "top"` | `undefined`                     |
| `cancelLabel`                   | `cancel-label`                      | Label for the cancel button                                                                      | `string`                                                         | `'Cancel'`                      |
| `chooseLabel`                   | `choose-label`                      | Label for the choose button                                                                      | `string`                                                         | `'Choose'`                      |
| `customUpload`                  | `custom-upload`                     | Whether to use a manual upload implementation via uploadHandlerEvent                             | `boolean`                                                        | `false`                         |
| `disabled`                      | `disabled`                          | Disables the component                                                                           | `boolean`                                                        | `false`                         |
| `dropLabel`                     | `drop-label`                        | Placeholder text shown in the empty drop zone                                                    | `string`                                                         | `'Drag and drop files here'`    |
| `invalidFileSizeMessageDetail`  | `invalid-file-size-message-detail`  | Detail message for invalid file size                                                             | `string`                                                         | `'Maximum upload size is {0}.'` |
| `invalidFileSizeMessageSummary` | `invalid-file-size-message-summary` | Summary message for invalid file size                                                            | `string`                                                         | `'Invalid file size'`           |
| `maxFileSize`                   | `max-file-size`                     | Maximum file size allowed in bytes                                                               | `number`                                                         | `undefined`                     |
| `mode`                          | `mode`                              | UI mode: "advanced" shows full UI, "basic" shows only the choose button                          | `"advanced" \| "basic"`                                          | `'advanced'`                    |
| `multiple`                      | `multiple`                          | Allow selecting multiple files                                                                   | `boolean`                                                        | `false`                         |
| `name`                          | `name`                              | Name of the request parameter for the files                                                      | `string`                                                         | `undefined`                     |
| `previewWidth`                  | `preview-width`                     | Width of image thumbnails in pixels                                                              | `number`                                                         | `50`                            |
| `uploadLabel`                   | `upload-label`                      | Label for the upload button                                                                      | `string`                                                         | `'Upload'`                      |
| `url`                           | `url`                               | Remote URL to upload the files                                                                   | `string`                                                         | `undefined`                     |
| `variant`                       | `variant`                           | Visual variant for the choose button: primary \| secondary \| success \| warning \| alert        | `"alert" \| "primary" \| "secondary" \| "success" \| "warning"`  | `'primary'`                     |
| `withCredentials`               | `with-credentials`                  | Whether to send credentials with the request                                                     | `boolean`                                                        | `false`                         |


## Events

| Event                 | Description                                                                 | Type                                          |
| --------------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| `beforeDropEvent`     | Emitted before files are dropped                                            | `CustomEvent<DragEvent>`                      |
| `beforeSelectEvent`   | Emitted before files are selected                                           | `CustomEvent<FileUploadSelectDetail>`         |
| `beforeSendEvent`     | Emitted before the request is sent                                          | `CustomEvent<FileUploadBeforeDetail>`         |
| `beforeUploadEvent`   | Emitted before upload starts (xhr and formData available for customization) | `CustomEvent<FileUploadBeforeDetail>`         |
| `clearEvent`          | Emitted when the file queue is cleared without uploading                    | `CustomEvent<void>`                           |
| `errorEvent`          | Emitted when upload fails                                                   | `CustomEvent<FileUploadUploadDetail>`         |
| `progressEvent`       | Emitted during upload with progress info                                    | `CustomEvent<FileUploadProgressDetail>`       |
| `removeEvent`         | Emitted when a single file is removed from the queue                        | `CustomEvent<FileUploadRemoveDetail>`         |
| `selectEvent`         | Emitted when files are selected                                             | `CustomEvent<FileUploadSelectDetail>`         |
| `uploadEvent`         | Emitted when upload completes successfully                                  | `CustomEvent<FileUploadUploadDetail>`         |
| `uploadHandlerEvent`  | Emitted in customUpload mode so the consumer can handle the actual upload   | `CustomEvent<FileUploadHandlerDetail>`        |
| `validationFailEvent` | Emitted when a file fails size validation                                   | `CustomEvent<FileUploadValidationFailDetail>` |


## Methods

### `clear() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `formatSize(bytes: number) => Promise<string>`



#### Returns

Type: `Promise<string>`



### `getElement() => Promise<HTMLElement>`



#### Returns

Type: `Promise<HTMLElement>`



### `getFiles() => Promise<File[]>`



#### Returns

Type: `Promise<File[]>`



### `getInput() => Promise<HTMLInputElement>`



#### Returns

Type: `Promise<HTMLInputElement>`



### `getUploadedFiles() => Promise<File[]>`



#### Returns

Type: `Promise<File[]>`



### `setFiles(files: File[]) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `setUploadedFiles(files: File[]) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `upload() => Promise<void>`



#### Returns

Type: `Promise<void>`
<!-- mwc:auto:end -->

---

### `ms-gauge-chart`

<!-- mwc:auto:start -->
## Properties

| Property            | Attribute            | Description                                                                                                                                                                        | Type                                                                            | Default        |
| ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------- |
| `animated`          | `animated`           | Whether to animate the needle and arc fill when the value changes.                                                                                                                 | `boolean`                                                                       | `true`         |
| `animationDuration` | `animation-duration` | Duration of the needle animation in milliseconds.                                                                                                                                  | `number`                                                                        | `1500`         |
| `arcWidth`          | `arc-width`          | Radial thickness in SVG units of the arc band. Suggested values: `6` thin · `10` medium · `14` default · `20` thick · `28` extra thick.                                            | `number`                                                                        | `14`           |
| `arcs`              | --                   | Color zones ordered by `limit` ascending. Each `limit` is a fraction [0-1] of the range. Adjacent zone colors blend smoothly at their boundaries.                                  | `GaugeArc[]`                                                                    | `DEFAULT_ARCS` |
| `color`             | `color`              | Optional Maxi color variant for the arc and needle. Overrides the `arcs` gradient. Accepted values: `'primary'` · `'secondary'` · `'success'` · `'warning'` · `'alert'` · `'info'` | `"" \| "alert" \| "info" \| "primary" \| "secondary" \| "success" \| "warning"` | `''`           |
| `decimals`          | `decimals`           | Number of decimal places shown in the value. 0 = no decimals (default).                                                                                                            | `number`                                                                        | `0`            |
| `label`             | `label`              | Primary label shown below the value (e.g. 'AVG per min').                                                                                                                          | `string`                                                                        | `''`           |
| `labelColor`        | `label-color`        | Color of the primary label text. Defaults to the current zone/arc color (same as value). Set explicitly to override.                                                               | `string`                                                                        | `''`           |
| `max`               | `max`                | Maximum value of the gauge range.                                                                                                                                                  | `number`                                                                        | `100`          |
| `min`               | `min`                | Minimum value of the gauge range.                                                                                                                                                  | `number`                                                                        | `0`            |
| `reactiveColor`     | `reactive-color`     | When true, the arc automatically switches to a monochromatic gradient of the current zone color (determined by `arcs` boundaries) as the value changes — no external JS needed.    | `boolean`                                                                       | `false`        |
| `subLabel`          | `sub-label`          | Secondary label shown below the primary label (e.g. '(last 10 min)').                                                                                                              | `string`                                                                        | `''`           |
| `subLabelColor`     | `sub-label-color`    | Color of the sub-label text. Defaults to the placeholder text color token.                                                                                                         | `string`                                                                        | `'#777777'`    |
| `ticks`             | `ticks`              | Number of white tick lines drawn over the arc.                                                                                                                                     | `number`                                                                        | `12`           |
| `unit`              | `unit`               | Unit used in the accessibility aria-label (e.g. '%', 'kbit/s', '°C'). Not shown visually — put the unit in `label` instead.                                                        | `string`                                                                        | `''`           |
| `value`             | `value`              | Current value to display on the gauge.                                                                                                                                             | `number`                                                                        | `0`            |
| `width`             | `width`              | CSS width of the component container (e.g. '300px', '100%').                                                                                                                       | `string`                                                                        | `'300px'`      |
<!-- mwc:auto:end -->

---

### `ms-paginator`

<!-- mwc:auto:start -->
## Properties

| Property              | Attribute                | Description | Type      | Default                                                                     |
| --------------------- | ------------------------ | ----------- | --------- | --------------------------------------------------------------------------- |
| `class`               | `class`                  |             | `string`  | `undefined`                                                                 |
| `currentPage`         | `current-page`           |             | `number`  | `0`                                                                         |
| `first`               | `first`                  |             | `number`  | `0`                                                                         |
| `pageLinkSize`        | `page-link-size`         |             | `number`  | `5`                                                                         |
| `rows`                | `rows`                   |             | `number`  | `10`                                                                        |
| `rowsPerPageOptions`  | --                       |             | `Item[]`  | `[{ label:'10', value:10}, {label:'20', value:20}, {label:'30', value:30}]` |
| `showPerPageDropdown` | `show-per-page-dropdown` |             | `boolean` | `true`                                                                      |
| `totalRecords`        | `total-records`          |             | `number`  | `undefined`                                                                 |


## Events

| Event        | Description | Type                                                                                       |
| ------------ | ----------- | ------------------------------------------------------------------------------------------ |
| `pageChange` |             | `CustomEvent<{ first: number; rows: number; currentPage: number; totalRecords: number; }>` |
<!-- mwc:auto:end -->

---

### `ms-preload`

<!-- mwc:auto:start -->
## Properties

| Property | Attribute | Description | Type     | Default     |
| -------- | --------- | ----------- | -------- | ----------- |
| `image`  | `image`   |             | `string` | `undefined` |
| `text`   | `text`    |             | `string` | `undefined` |
<!-- mwc:auto:end -->

---

### `ms-scroll-top`

<!-- mwc:auto:start -->
## Overview

ScrollTop component that allows users to scroll back to the top of a scrollable container or window.

## Properties

| Property      | Attribute      | Description                                                                                                                          | Type                   | Default     |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ----------- |
| `behavior`    | `behavior`     | Scroll behavior when clicking the button.                                                                                            | `"auto" \| "smooth"`   | `'smooth'`  |
| `customClass` | `custom-class` | Custom CSS class for additional styling.                                                                                             | `string`               | `undefined` |
| `icon`        | `icon`         | Custom icon URL to display in the button.                                                                                            | `string`               | `undefined` |
| `target`      | `target`       | Target element to listen for scroll events. Use 'window' to listen to the window scroll or 'parent' to listen to the parent element. | `"parent" \| "window"` | `'window'`  |
| `threshold`   | `threshold`    | Scroll position threshold in pixels after which the button becomes visible.                                                          | `number`               | `400`       |


## Events

| Event    | Description                                       | Type                |
| -------- | ------------------------------------------------- | ------------------- |
| `msHide` | Event emitted when the component becomes hidden.  | `CustomEvent<void>` |
| `msShow` | Event emitted when the component becomes visible. | `CustomEvent<void>` |
<!-- mwc:auto:end -->

---

## New components

### `ms-web-card`

<!-- mwc:auto:start -->
## Properties

| Property         | Attribute         | Description | Type      | Default     |
| ---------------- | ----------------- | ----------- | --------- | ----------- |
| `class`          | `class`           |             | `string`  | `null`      |
| `footer`         | `footer`          |             | `any`     | `undefined` |
| `header`         | `header`          |             | `any`     | `undefined` |
| `idComponent`    | `id-component`    |             | `string`  | `null`      |
| `isFramework`    | `is-framework`    |             | `boolean` | `true`      |
| `subTitle`       | `sub-title`       |             | `string`  | `null`      |
| `titleComponent` | `title-component` |             | `string`  | `null`      |
<!-- mwc:auto:end -->

---
