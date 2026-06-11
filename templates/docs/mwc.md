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
| `maxi-web-components/global-zeclio.css` | Zeclio theme                  |

**Ways to import the theme:**

```javascript
// In JS/TS (React, bundler, Vite, Webpack)
// or
import "maxi-web-components/global-zeclio.css";
import "maxi-web-components/global.css";
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

**Main color variables:**

```css
:root {
  --maxi-color-primary: #007bff;
  --maxi-color-primary-hover: #0056b3;
  --maxi-color-secondary: #6c757d;
  --maxi-color-success: #28a745;
  --maxi-color-warning: #ffc107;
  --maxi-color-danger: #dc3545;
  --maxi-color-info: #17a2b8;
}
```

**Button variables:**

```css
:root {
  --maxi-button-primary-bg: var(--maxi-color-primary);
  --maxi-button-primary-hover: var(--maxi-color-primary-hover);
  --maxi-button-secondary-bg: var(--maxi-color-secondary);
  --maxi-button-warning-bg: var(--maxi-color-warning);
  --maxi-button-alert-bg: var(--maxi-color-danger);
}
```

**Input variables:**

```css
:root {
  --maxi-input-focus-border-color: var(--maxi-color-primary);
}
```

**Customizing the theme in your project:**

```css
/* project styles.scss or global.css */
:root {
  --maxi-color-primary: #8b5cf6;
  --maxi-color-primary-hover: #7c3aed;
}
```

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
| `required`     | `boolean` | `false`            | Required field; triggers built-in validation |
| `invalid`      | `boolean` | `false`            | External error state                         |
| `errorMessage` | `string`  | `null`             | Error text (only shown when `invalid=true`)  |

**Render modes:**
- **With `label`**: floating label pattern. Placeholder is only shown when the field is focused.
- **Without `label`**: standard input. Placeholder always visible.

**Validation logic:**
- `isInvalid = invalid || internalInvalid` (either external flag or required-check failure)
- When `required=true` and field is empty → shows `"This field is required"` (hardcoded, not configurable)
- When `invalid=true` and `errorMessage` is set → shows `errorMessage`
- `errorMessage` is **ignored** if only `required` validation fails (the built-in message takes over)

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
| `required`          | `boolean`                | `false`             | Required field — triggers built-in validation                        |
| `invalid`           | `boolean`                | `false`             | External error state                                                 |
| `errorMessage`      | `string \| null`         | `null`              | Error text — only shown when `invalid=true`                          |

**Render modes:**
- **With `label`**: floating label. Placeholder only shown when focused.
- **Without `label`**: standard input. Placeholder always visible.

**Validation logic** (identical to `ms-input-field`):
- `required=true` + empty → shows `"This field is required"` (hardcoded)
- `invalid=true` + `errorMessage` set → shows `errorMessage`
- `errorMessage` is ignored when only `required` fails

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
| `invalid`      | `boolean`                           | `false`          | External error state                                 |
| `autoFocus`    | `boolean`                           | `false`          | Focus first box on mount (100 ms delay)              |
| `placeholder`  | `string`                            | `''`             | Placeholder character shown in each empty box        |
| `errorMessage` | `string \| null`                    | `null`           | Error text — only shown when `invalid=true`          |
| `required`     | `boolean`                           | `false`          | Required — valid only when **all** boxes are filled  |
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
- Falls back to `"This field is required"` when incomplete (hardcoded)
- `errorMessage` only shown when `invalid=true`

**Events:**

| Event              | Payload                                                                   | Description                                              |
| ------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| `inputEvent`       | `string`                                                                  | Joined value on every keystroke                          |
| `completeEvent`    | `string`                                                                  | Joined value on every keystroke **and** on paste — not just when all boxes are filled |
| `focusEvent`       | `number`                                                                  | Index of the box that received focus                     |
| `blurEvent`        | `number`                                                                  | Index of the box that lost focus                         |
| `validationChange` | `{ isValid: boolean; fieldId: string; value: string; errorMessage: string }` | Emitted when validity changes                         |

> `completeEvent` fires on **every** keystroke (and paste) with the current partial or full string — not only when all boxes are filled. Use `e.detail.length === length` to detect a truly complete code.

```html
<ms-input-otp length="6" type="numeric"></ms-input-otp>
<script>
  const otp = document.querySelector("ms-input-otp");
  otp.addEventListener("completeEvent", (e) => {
    if (e.detail.length === 6) verifyCode(e.detail);
  });
</script>
```

```tsx
// React
<MsInputOtp
  length={6}
  type="numeric"
  autoFocus
  onCompleteEvent={(e) => {
    if (e.detail.length === 6) verifyCode(e.detail);
  }}
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
| `tooltip`         | `string`                        | `undefined` | Tooltip text. When not set, `ms-tooltip` is not rendered      |
| `tooltipPosition` | `'top'\|'bottom'\|'left'\|'right'` | `undefined` | Tooltip placement. Source type is `Position.Right` (likely should be `Position` — all 4 values work at runtime) |

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
| `label`    | `label`    | `string`  | `undefined` | Label text rendered as `<label htmlFor={inputId}>`                   |
| `inputId`  | `input-id` | `string`  | `undefined` | `id` on the inner `<input>` — required for label click to work       |
| `name`     | `name`     | `string`  | `undefined` | HTML `name` attribute — use to group in forms                        |
| `value`    | `value`    | `string`  | `undefined` | HTML `value` attribute on the inner `<input>`                        |
| `class`    | `class`    | `string`  | `undefined` | Extra CSS class applied to the inner `<input>` element               |

> No `invalid` or `required` props — this component has no built-in validation state.

**Events:** `checkboxChange` — emits `boolean` (the new `checked` state).

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
| `name`     | `string`            | `undefined` | Group name for HTML radio grouping (also used as native input `value`) |
| `label`    | `string`            | `undefined` | Label text                                                            |
| `value`    | `string`            | `undefined` | Component-level value prop — **not passed to the native input**; use `name` to identify the radio in a group |
| `checked`  | `boolean` (reflect, mutable) | `undefined` | Selected state                                         |
| `disabled` | `boolean`           | `undefined` | Disabled                                                              |
| `class`    | `string`            | `undefined` | Extra CSS class on the native `<input>` element                       |

> **`radioChange` emits `boolean`, not a value string.** The event emits `isChecked` (`true` when the radio is selected). It does NOT emit the `value` prop. To identify which radio was selected, use the `name` or `value` props in your handler's context.

> **Native input uses `name` as its HTML `value` attribute** (not the `value` prop). This is a quirk of the implementation.

**Events:** `radioChange` — emits `boolean` (`true` when selected).

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

Integer stepper with + and − buttons. Uses **`shadow: true`** — styles are encapsulated; CSS custom properties do not pierce the shadow DOM.

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

**Events:**

| Event         | Payload  | Fires when                                                              |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `changeEvent` | `number` | On button click, blur, or ArrowUp/Down key (NOT on each keystroke)      |
| `inputEvent`  | `number` | On every value change, including individual keystrokes while typing     |

```tsx
// React
<MsControlNumber
  label="Cantidad"
  min={1}
  max={99}
  defaultValue={1}
  onChangeEvent={(e) => setQty(e.detail)}
/>
```

---

#### `ms-knob`

Rotary dial control for selecting numeric values. **`shadow: true`** — CSS is encapsulated. Interaction is **drag-based** (mouse and touch); not click-based.

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

**CSS-only utility — not a web component.** Groups inputs with addons (text, icons, buttons, selects) in a single flex row using two CSS classes: `.ms-input-group` (container) and `.ms-input-group-addon` (non-input cell).

> Never use `<ms-input-group>` as a tag — it doesn't exist. Use a plain `<div class="ms-input-group">`.

**CSS classes:**

| Class                  | Element | Description                                                   |
| ---------------------- | ------- | ------------------------------------------------------------- |
| `.ms-input-group`      | `div`   | Flex row container. Adapts to 100% width of its parent.       |
| `.ms-input-group-addon`| `span`  | Non-input cell (text, SVG, `ms-checkbox`, `ms-input-switch`). |

**Compatible children (inside `.ms-input-group` directly, no addon wrapper):**
`ms-input-field`, `ms-input-number`, `ms-button`, `ms-dropdown`, `ms-autocomplete`, `ms-select-button`, `ms-chips`, `ms-calendar`, `ms-control-number`

**Rules:**
- `ms-button` placed directly in the group integrates flush (no border-radius gap).
- There is **no global `disabled`** on the group — disable each child individually.
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
| `class`        | `class`          | `string \| null`           | `null`            | Extra CSS class on the dropdown box             |
| `idComponent`  | `id-component`   | `string \| null`           | `'ms-dropdown'`   | `id` used for label linkage and `validationChange.fieldId` |

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
| `invalid`             | `boolean`                    | `false`              | Visual error state                                       |
| `errorMessage`        | `string \| null`             | `null`               | Error message shown when `invalid=true`                  |

> **"N items selected"** — when more than 3 items are selected the trigger shows `"N items selected"` regardless of the `display` value. This is automatic, not configurable.

> **Validation:** `errorMessage` only shown when `invalid=true`. When `required` fails, shows hardcoded `"This field is required"`.

> **`display='chip'`** — uses `ms-chips` internally. Chips are removable by the user. Does **not** work correctly with `optionGroup=true`.

> **Dropdown position** — menu is rendered `position: fixed` at `zIndex: 9999`. Auto-flips above trigger if there is no space below.

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
| `invalid`      | `boolean`                  | `false`               | Visual error state                                       |
| `errorMessage` | `string \| null`           | `null`                | Error message shown below the input when invalid         |
| `suggestions`  | `{ label, value }[]`       | `[]`                  | Declared prop but **NOT used for display** — pass results via `resolve` (see below) |

**Events:**

| Event              | Payload                                                                              | Description                                       |
| ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `completeMethod`   | `{ query: string; resolve: (results: { label: string; value: string }[]) => void }` | User typed — **must call `e.detail.resolve(results)`** to populate dropdown |
| `selected`         | `{ label: string; value: string }`                                                   | Item selected from the dropdown                   |
| `validationChange` | `ValidationDetail`                                                                   | Validation state changed                          |

> **`completeMethod` usa un callback Promise-based.** El componente espera `e.detail.resolve(results)` para mostrar las sugerencias. Llamar `setSuggestions()` o cualquier setState externo **no tiene efecto** — el prop `suggestions` no está conectado a la lista del dropdown.

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
- **Autocomplete** (`suggestions` is an array): shows a dropdown filtered by input; Enter/click selects from the list. Input is cleared on blur, already-added items are excluded from suggestions.

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
| `invalid`         | `boolean`               | `false`              | Visual error state                                                          |
| `errorMessage`    | `string \| null`        | `null`               | Error message shown when `invalid=true`                                     |
| `idComponent`     | `string \| null`        | `'ms-select-button'` | HTML `id`                                                                   |
| `class`           | `string \| null`        | `null`               | Extra CSS class on the wrapper element                                      |

> **Event name is `changeValue`, not `changeEvent`.**

> **`changeValue` payload differs by mode:**
> - Single mode → emits the selected **value** (primitive), or `null` when deselected
> - Multiple mode → emits **`Item[]`** (full objects of selected items)

> **Single mode toggles:** clicking the already-selected button deselects it (emits `null`).

> **Validation:** `errorMessage` shown only when `invalid=true`. `required` failure → `"This field is required"`.

> **Per-item tooltip:** if an `Item` has a `tooltip` property, that item is individually wrapped in `ms-tooltip`.

**Keyboard navigation:** `←`/`↑` focus previous · `→`/`↓` focus next · `Home` first · `End` last.

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

**No events.** Clicks are handled via `item.command()` on each `BreadcrumbItem`.

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
| `itemSelect`    | `string`  | Emits the `id` of the leaf item clicked (not parent/group items) |

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

> **`width`/`height` only accept px values.** Passing `'50%'`, `'auto'`, or `'2rem'` is silently ignored — the dimension will be unset.

**Preview modal** (requires `preview=true`):
- Click image → opens modal with zoom and rotation controls
- Zoom range: 0.4× – 1.5× (step 0.1)
- Keyboard shortcuts: `Escape` close · `←`/`→` rotate ±90° · `+`/`-` zoom in/out

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
| `customClass` | `string`                                                      | `''`     | Extra CSS class on inner container |

> **Content via slot:** there is no `text` prop. Place content in the **default slot**.

> **No `severity` prop, no `closable`, no `life`.** Use `variant` instead of `severity`.

> **`secondary` icon:** `secondary` variant uses the same icon as `info` (both fall to the default case internally).

**Slots:** default — message content (text, HTML, or other components).

```html
<ms-message variant="success"> Changes saved successfully </ms-message>

<ms-message variant="danger">
  <strong>Error:</strong> Could not connect to the server.
</ms-message>
```

```tsx
// React
<MsMessage variant="warning">
  Please review the highlighted fields before continuing.
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
| `life`        | `number \| null`                                                                                              | `3000`        | Auto-hide delay in ms                                    |
| `position`    | `'top-left' \| 'top-center' \| 'top-right' \| 'center' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'top-right'` | Screen position                                          |

> **Severity values:** `'info'`, `'success'`, `'warning'`, `'alert'`. Not `'warn'` or `'error'`.

> **No `show()` method.** Toggle `visible` to show/hide.

> **`life: null` does NOT keep it visible.** The component uses `setTimeout(fn, this.life)` with no null guard — `setTimeout(fn, null)` fires immediately (0 ms). To keep a notification visible indefinitely, there is no built-in mechanism; you must manage visibility entirely from outside.

> **No `visibleChange` event.** The component has no `@Event()`. When the `life` timeout expires it sets `visible = false` internally via the mutable prop — but React state is NOT updated. This means if your React state stays `visible: true`, setting it to `true` again will not re-trigger the `@Watch` and the notification won't show again. **Always reset your state back to `false`** after showing.

**Correct usage pattern in React:**

```tsx
const [notif, setNotif] = useState({
  visible: false,
  severity: "info",
  summary: "",
  detail: "",
});

function showSuccess(msg: string) {
  // 1. Set visible: true to show
  setNotif({ visible: true, severity: "success", summary: "Done", detail: msg });
  // 2. Manually reset state after life duration — required to allow re-triggering
  setTimeout(() => setNotif((n) => ({ ...n, visible: false })), 3000);
}

<MsNotification
  visible={notif.visible}
  severity={notif.severity as any}
  summary={notif.summary}
  detail={notif.detail}
  life={3000}
/>;
```

---

#### `ms-skeleton`

Loading skeleton placeholder. `shadow: true` — external CSS does not penetrate.

| Prop           | Type             | Default | Rendered default | Description                                  |
| -------------- | ---------------- | ------- | ---------------- | -------------------------------------------- |
| `width`        | `string \| null` | `null`  | `'100%'`         | CSS width                                    |
| `height`       | `string \| null` | `null`  | `'1rem'`         | CSS height                                   |
| `borderRadius` | `string \| null` | `null`  | `'4px'`          | CSS border-radius                            |
| `shape`        | `string \| null` | `null`  | —                | Passed as HTML attribute for CSS selector use — **not used in the render template**; to make a circle use `borderRadius="50%"` instead |
| `class`        | `string \| null` | `null`  | —                | Extra CSS class on the inner div             |

> **No `animation` prop.** The shimmer animation is always active.

> **`shape` prop has no effect on styles or classes in the render.** It is only useful as an HTML attribute if the consuming project's CSS targets `:host([shape="circle"])`. For a reliable circle, use `borderRadius="50%"`.

```html
<ms-skeleton height="200px"></ms-skeleton>
<ms-skeleton height="1rem" width="60%"></ms-skeleton>

<!-- Circle via borderRadius -->
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

```html
<ms-spinner></ms-spinner>
<ms-spinner width="3rem" height="3rem" color="#007bff"></ms-spinner>
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
| `invalid`            | `invalid`              | `boolean`                              | `false`          | Force error state                                                                   |
| `errorMessage`       | `error-message`        | `string \| null`                       | `null`           | Error message shown when `invalid=true`                                             |

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

**No events** — this component does not emit custom events.

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

- Desktop (`window.innerWidth > 768`): menu opens on hover, submenus expand on hover, auto-flips if overflowing right edge
- Mobile (`window.innerWidth <= 768`): menu opens on tap, submenus expand/collapse on tap, full-width panel
- Escape key closes the menu
- `action` callback on an item takes priority over URL navigation

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
| `hide` | `false`   | Fired when the × button is clicked; always emits `false` |

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

Rich text editor (WYSIWYG). `shadow: true` — external CSS does not penetrate.

| Prop          | Type      | Default                       | Description                                              |
| ------------- | --------- | ----------------------------- | -------------------------------------------------------- |
| `value`       | `string`  | `''`                          | Current HTML content. Reactive via `@Watch` — updating the prop replaces the editor content |
| `placeholder` | `string`  | `'Type your content here...'` | Placeholder shown when editor is empty                   |
| `readonly`    | `boolean` | `false`                       | Read-only mode — toolbar is disabled, editing blocked    |

**Built-in toolbar formats:** Bold · Italic · Underline · Unordered list · Ordered list. No additional formats configurable.

> **Paste sanitization:** pasted content is cleaned to allowed tags only: `P`, `STRONG`, `B`, `EM`, `I`, `U`, `UL`, `OL`, `LI`, `BR`, `DIV`, `SPAN`. Font colors, sizes, images, tables, and links are stripped.

> **Empty content:** when the editor is cleared, `textChange` emits `''` (empty string), not `<p><br></p>`.

> **Implementation note:** uses deprecated `document.execCommand` API internally.

**Events:**

| Event        | Payload  | Description                                                   |
| ------------ | -------- | ------------------------------------------------------------- |
| `textChange` | `string` | Emitted on every edit and on blur; detail is the HTML string  |

```tsx
// React
<MsTextEditor
  value={content}
  placeholder="Write something..."
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

> **No `visible` prop and no events.** Open/close state is internal-only. There is no way to programmatically control the popover from outside.

> **Auto-flip:** if the preferred `placement` doesn't fit the viewport, tries the opposite side, then `bottom`, then `top` as a final fallback.

> **`trigger='hover'`:** closing is delayed 100 ms after mouseleave. Moving the pointer from the trigger into the popover content cancels the close timeout, keeping it open.

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

Horizontal navigation bar. Responsive: horizontal items on desktop, hamburger + slide-in drawer on mobile (≤ 768px). `shadow: false`. **No events** — navigation handled via `item.url` or `item.action`.

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

**Navigation (no events):**
- `item.url` set and not `'#'` → `window.location.href = item.url` on click
- `item.action` set → called with a `CustomEvent` containing `{ id, label, icon, url, disabled, customClass, menuData, minWidth, originalEvent }`
- `item.disabled = true` → click is suppressed

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

> **Hover only — no click, no focus, no delay.** Shows on `mouseenter`, hides immediately on `mouseleave`.

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

> **Pages are 0-indexed.** Pass `currentPage={0}` for page 1, `currentPage={1}` for page 2, etc. The UI displays page numbers as 1-based.

> **Changing `rows`** resets `currentPage` and `first` to `0` automatically and emits `pageChange`.

> **Project convention:** always set `showPerPageDropdown={false}`. The component default is `true` but this project does not use the rows-per-page selector.

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

Loading overlay that covers a container. Always visible when rendered — control it with conditional rendering in your framework. `shadow: false` — external CSS penetrates.

| Prop    | Type     | Default | Description                                                                                          |
| ------- | -------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `text`  | `string` | —       | Text shown in the overlay. Ignored if `image` is set. If neither is set, shows `"Loading..."`.       |
| `image` | `string` | —       | URL of a custom image (rendered at 450px wide). **Takes precedence over `text`** — both cannot show at once. |

> **No `visible`, `fullscreen`, or `zIndex` props.** Use conditional rendering to show/hide the overlay, and CSS (`position: fixed`) to cover the full screen.

```tsx
// React — conditional rendering
{
  isLoading && <MsPreload text="Loading data..." />;
}

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
| `accept`                        | `accept`                              | `string`                                                         | —                               | MIME types or extensions allowed (e.g. `'image/*,.pdf'`)             |
| `maxFileSize`                   | `max-file-size`                       | `number`                                                         | —                               | Maximum file size in bytes; over-limit files emit `validationFailEvent` |
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
| `validationFailEvent` | `{ file: File }`                                     | File exceeded `maxFileSize`; component does not show a message |

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
| `target`      | `'window' \| 'parent'` | `'window'` | Element that triggers scroll detection. `'parent'` listens on the nearest scrollable ancestor |
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

```html
<!-- Vanilla — default behaviour -->
<ms-scroll-top></ms-scroll-top>

<!-- Vanilla — scroll inside a container -->
<div style="height:400px; overflow-y:auto">
  <ms-scroll-top
    target="parent"
    threshold="200"
    behavior="auto"
  ></ms-scroll-top>
  <!-- long content -->
</div>
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
