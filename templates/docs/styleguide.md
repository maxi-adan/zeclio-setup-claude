# Styleguide — Context for Claude

## Purpose of this repo

This package (`@maxi/styleguide`) is the **single source of truth for UI components, helpers, and utilities** shared across all ZEUS microfrontends. It is a single-spa module that exposes components, hooks, and utilities so that individual apps do **not** bundle their own copies. Everything exported here should be consumed via the import map instead of installed locally in each app.

---

## Available Components

### Maxi React Components (`maxi-react-components`)

Modern Web Component wrappers auto-generated for React. These are the **preferred components** for all new development.

> **IMPORTANT FOR CLAUDE:** Before writing any code that uses an `ms-*` / `Ms*` component, **always read [`mwc.md`](./mwc.md)** to get the exact prop names, event names, and defaults. Do not rely on memory — prop and event names are non-obvious and differ from HTML standards (e.g. `activeTab` not `activeIndex`, `checkboxChange` not `change`, `clickEvent` not `click`).

| Component         | Tag                 | Description                                                                                                                              |
| ----------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `MsAccordion`     | `ms-accordion`      | Collapsible content sections                                                                                                             |
| `MsAutocomplete`  | `ms-autocomplete`   | Text input with autocomplete suggestions                                                                                                 |
| `MsBadge`         | `ms-badge`          | Status badge / label                                                                                                                     |
| `MsBreadcrumb`    | `ms-breadcrumb`     | Navigation breadcrumb trail                                                                                                              |
| `MsButton`        | `ms-button`         | Button — variants: `primary`, `secondary`, `danger`, etc.                                                                                |
| `MsCalendar`      | `ms-calendar`       | Date picker / calendar                                                                                                                   |
| `MsCard`          | `ms-web-card`       | Card container with header, body and footer slots                                                                                        |
| `MsCarousel`      | `ms-carousel`       | Slideshow / image carousel                                                                                                               |
| `MsCascadeMenu`   | `ms-cascade-menu`   | Multi-level cascade dropdown menu                                                                                                        |
| `MsChart`         | `ms-chart`          | Chart / data visualization (Chart.js wrapper)                                                                                            |
| `MsCheckbox`      | `ms-checkbox`       | Checkbox input — event: `checkboxChange`                                                                                                 |
| `MsChips`         | `ms-chips`          | Tag/chip input                                                                                                                           |
| `MsControlNumber` | `ms-control-number` | Numeric stepper with +/− buttons                                                                                                         |
| `MsDialog`        | `ms-dialog`         | Modal dialog                                                                                                                             |
| `MsDropdown`      | `ms-dropdown`       | Single-select dropdown                                                                                                                   |
| `MsFieldset`      | `ms-fieldset`       | Form fieldset grouping                                                                                                                   |
| `MsFileUpload`    | `ms-file-upload`    | File upload with drag-and-drop, validation and progress                                                                                  |
| `MsGaugeChart`    | `ms-gauge-chart`    | Semicircular gauge with color zones and animated needle                                                                                  |
| `MsIcon`          | `ms-icon`           | SVG icon from the Maxi icon library                                                                                                      |
| `MsImage`         | `ms-image`          | Image with loading states                                                                                                                |
| `MsInplace`       | `ms-inplace`        | Inline click-to-edit component                                                                                                           |
| `MsInputField`    | `ms-input-field`    | Text input with floating label and validation                                                                                            |
| `MsInputGroup`    | `ms-input-group`    | Groups multiple inputs in a single row                                                                                                   |
| `MsInputNumber`   | `ms-input-number`   | Numeric input with locale formatting and currency support                                                                                |
| `MsInputOtp`      | `ms-input-otp`      | OTP / pin code input                                                                                                                     |
| `MsInputPassword` | `ms-input-password` | Password input with visibility toggle                                                                                                    |
| `MsInputSwitch`   | `ms-input-switch`   | Toggle switch                                                                                                                            |
| `MsKnob`          | `ms-knob`           | Circular knob / dial input                                                                                                               |
| `MsMenubar`       | `ms-menubar`        | Horizontal application menu bar                                                                                                          |
| `MsMessage`       | `ms-message`        | Inline alert / message banner                                                                                                            |
| `MsMeterGroup`    | `ms-meter-group`    | Group of comparative progress meters                                                                                                     |
| `MsMultiselect`   | `ms-multiselect`    | Multi-select dropdown                                                                                                                    |
| `MsNavbar`        | `ms-navbar`         | Collapsible lateral navigation sidebar with nested menus — props: `items`, `activeItemId`; methods: `collapse()`, `expand()`, `toggle()` |
| `MsNotification`  | `ms-notification`   | Toast notification — toggle `visible` prop to show/hide; no methods                                                                      |
| `MsPaginator`     | `ms-paginator`      | Standalone pagination controls                                                                                                           |
| `MsPopover`       | `ms-popover`        | Floating popover panel                                                                                                                   |
| `MsPreload`       | `ms-preload`        | Full-section or full-screen loading overlay                                                                                              |
| `MsProgressBar`   | `ms-progress-bar`   | Linear progress bar                                                                                                                      |
| `MsRadio`         | `ms-radio`          | Radio button input — event: `radioChange`                                                                                                |
| `MsScrollTop`     | `ms-scroll-top`     | "Back to top" floating button                                                                                                            |
| `MsSelectButton`  | `ms-select-button`  | Segmented button selector (single or multiple)                                                                                           |
| `MsSidebar`       | `ms-sidebar`        | Off-canvas panel that slides from any edge                                                                                               |
| `MsSkeleton`      | `ms-skeleton`       | Skeleton loading placeholder                                                                                                             |
| `MsSpinner`       | `ms-spinner`        | Loading spinner — props: `width`, `height`, `color` (no `size` prop)                                                                     |
| `MsSteps`         | `ms-steps`          | Step wizard indicator                                                                                                                    |
| `MsTable`         | `ms-table`          | Data table with sorting, pagination, selection, expandable rows                                                                          |
| `MsTabs`          | `ms-tabs`           | Tab navigation — prop: `activeTab` (not `activeIndex`)                                                                                   |
| `MsTextEditor`    | `ms-text-editor`    | Rich text editor (WYSIWYG)                                                                                                               |
| `MsTimeline`      | `ms-timeline`       | Vertical timeline                                                                                                                        |
| `MsTooltip`       | `ms-tooltip`        | Hover tooltip                                                                                                                            |

> **Events in React:** component events are exposed as props with the `on` prefix.
> Example: `clickEvent` → `onClickEvent`, `selected` → `onSelected`, `checkboxChange` → `onCheckboxChange`.

> **Objects/arrays as props:** pass JavaScript values directly — the React wrapper handles serialization. Never pass JSON strings.

### Assets

| Export          | Description                   |
| --------------- | ----------------------------- |
| `MaxiAnimation` | Lottie/animation asset        |
| `moment`        | Re-exported moment.js library |

---

## Hooks and Utility Functions

### Helpers

> Internal path: `src/helpers/inputs` — consume via `@maxi/styleguide`, never via internal path.

String and number formatting utilities for financial/numeric data.

| Function                  | Description                                                   |
| ------------------------- | ------------------------------------------------------------- |
| `currencyToNumber(value)` | Converts a currency-formatted string to a number              |
| `onlyNumbers(value)`      | Strips all non-numeric characters from a string               |
| `stringToCurrency(value)` | Converts a plain string/number to a currency-formatted string |
| `formatCurrency(value)`   | Formats a number as a currency string                         |
| `formatNumber(value)`     | Formats a number with locale-appropriate separators           |

### Date Helpers

> Internal path: `src/helpers/date` — consume via `@maxi/styleguide`, never via internal path.

Date manipulation and formatting utilities.

| Function                    | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| `formatDate(date, format?)` | Formats a date to a display string                         |
| `isValidDate(date)`         | Returns `true` if the given value is a valid date          |
| `diffInDays(dateA, dateB)`  | Returns the difference in days between two dates           |
| `formatRelativeDate(date)`  | Returns a human-readable relative date (e.g. "2 days ago") |
| `dateToISO(date)`           | Converts a date to ISO 8601 string                         |
| `startOfDay(date)`          | Returns the start of the day (00:00:00) for a given date   |
| `endOfDay(date)`            | Returns the end of the day (23:59:59) for a given date     |

### Library Permissions

> Internal path: `src/helpers/user-admin-sdk` — consume via `@maxi/styleguide`, never via internal path.

Utilities for permission validation based on the user session.

| Function                                  | Description                                                     |
| ----------------------------------------- | --------------------------------------------------------------- |
| `validatePermission(permission)`          | Returns `true` if the current user has the given permission key |
| `validateGroupPermissions(permissions[])` | Returns `true` if the user has **any** of the given permissions |
| `getPermissions()`                        | Returns the full list of permission keys for the current user   |

---

## Import Paths

All resources from this styleguide should be imported via the `@maxi/styleguide` module name (resolved through the single-spa import map — **not** installed as a local npm dependency).

```js
// Maxi React Components
import { MsButton, MsInputField, MsTable } from "@maxi/styleguide";
// Helpers
import { formatCurrency, onlyNumbers } from "@maxi/styleguide";
// Date helpers
import { diffInDays, formatDate } from "@maxi/styleguide";
// Permission helpers
import { getPermissions, validatePermission } from "@maxi/styleguide";
// Assets
import { MaxiAnimation } from "@maxi/styleguide";
import moment from "@maxi/styleguide/moment";
```

> **Never** install `maxi-react-components` or `maxi-web-components` directly inside a microfrontend. Consume them through this styleguide module so the library is loaded only once at runtime.

---

## Rules for Claude

- **Never create a component that already exists in this catalog.** Before building a custom component, check the tables above. If it is already here, use it.
- **If a variant does not exist, propose adding it here first** rather than creating a one-off copy inside the app. Keeping variants centralised prevents drift across microfrontends.
- **Never use native HTML tables (`<table>`, `<thead>`, `<tr>`, `<td>`) — always use `MsTable`.**
- **Never use native HTML form controls (`<input>`, `<select>`, `<textarea>`) — always use the form components from this styleguide** (`MsInputField`, `MsDropdown`, `MsMultiselect`, `MsCalendar`, `MsInputNumber`, `MsInputPassword`, `MsInputOtp`, `MsCheckbox`, `MsRadio`, `MsInputSwitch`, etc.).

---

### 1. Events — naming convention in React

Component events follow the `on` + camelCase event name convention. Never use the native event name directly as a prop.

```tsx
// CORRECT
<MsButton onClickEvent={handler} />
<MsInputField onInputEvent={handler} onValidationChange={handler} />
<MsDropdown onSelected={handler} />
<MsCalendar onUpdate={handler} />

// INCORRECT — these props do not exist in the React wrapper
<MsButton onClick={handler} />
<MsInputField onInput={handler} />
```

> Before using an event, verify its exact name in `mwc.md`. Names do not always follow standard HTML patterns (`inputEvent`, not `input`; `clickEvent`, not `click`).

---

### 2. Objects and arrays as props — never as JSON strings

React wrappers handle serialization internally. Pass objects and arrays as JavaScript props, never as JSON strings.

```tsx
// CORRECT
const options = [{ label: 'Active', value: 'active' }];
<MsDropdown options={options} />
<MsTable columns={columns} data={rows} />

// INCORRECT — causes silent parsing errors
<MsDropdown options='[{"label":"Active","value":"active"}]' />
```

> Exception: Angular templates and Vanilla JS use JSON strings because there is no binding system. In React, always use JavaScript props.

---

### 3. Installation — never install maxi-react-components locally in an app

The styleguide re-exports all components via the single-spa import map. Installing the package directly in an app breaks the single-load model at runtime.

```tsx
// CORRECT — always from the styleguide module
import { MsButton, MsTable } from "@maxi/styleguide";

// INCORRECT — never install or import directly
import { MsButton } from "maxi-react-components";
```

> If a component does not appear re-exported from `@maxi/styleguide`, flag it explicitly before proposing an alternative import.

---

### 4. CSS theme — one import only, in the entry point

The global CSS (`global.css` or `global-zeclio.css`) is imported **once** in the root-config or styleguide entry point. Never re-import it inside an individual app or component.

```tsx
// INCORRECT — do not add in components or individual apps
import "maxi-web-components/global.css";
```

> To customise theme variables, override the CSS custom properties in the project's global stylesheet, never inline.

---

### 5. Form validation — use validationChange, not manual logic

Form components emit `validationChange` with `{ isValid, fieldId, value, errorMessage }`. Do not replicate visual validation logic manually.

```tsx
// CORRECT
<MsInputField
  label="Email"
  required
  errorMessage="Email is required"
  onValidationChange={(e) => updateValidity(e.detail.fieldId, e.detail.isValid)}
/>

// INCORRECT — do not manage error state manually
<MsInputField label="Email" invalid={!isEmailValid} errorMessage={emailError} />
```

> To coordinate validity across a full form, use the `validationState` pattern documented in the "Advanced patterns" section of `mwc.md`.

---

### 6. MsTable — custom column rendering

In React, the column `render` function can return JSX. Do not return HTML strings containing Web Component tags — in React that does not render correctly.

```tsx
// CORRECT in React
const columns = [
  {
    field: "status",
    header: "Status",
    render: (row) => (
      <MsBadge
        value={row.statusLabel}
        severity={row.active ? "success" : "danger"}
      />
    ),
  },
];

// INCORRECT in React — the HTML string does not execute the Web Component correctly
const columns = [
  {
    field: "status",
    header: "Status",
    render: (row) => `<ms-badge value="${row.statusLabel}"></ms-badge>`,
  },
];
```

---

### 7. MsDialog and MsNotification — never use native modals or alerts

For confirmation dialogs, alerts, and notifications, always use `MsDialog` and `MsNotification`. Never use `alert()`, `confirm()`, or native `<dialog>` elements.

```tsx
// CORRECT
<MsDialog visible={open} header="Confirm" onHide={() => setOpen(false)}>
  Do you want to continue?
</MsDialog>;

// For notifications — toggle visible prop (no show() method exists)
const [notif, setNotif] = useState({ visible: false, severity: "info", summary: "", detail: "" });
function showNotif(severity, summary, detail, life = 3000) {
  setNotif({ visible: true, severity, summary, detail });
  setTimeout(() => setNotif(n => ({ ...n, visible: false })), life);
}
<MsNotification visible={notif.visible} severity={notif.severity} summary={notif.summary} detail={notif.detail} />;

// INCORRECT
alert("Do you want to continue?");
confirm("Are you sure?");
```

---

### 8. MsPreload vs MsSpinner — when to use each

- `MsSpinner`: inline indicator inside a small component or section.
- `MsPreload`: overlay that blocks a section or full screen during loading.
- `MsButton` with `loading={true}`: when the load is a direct consequence of clicking that button.

```tsx
// Full page load
<MsPreload visible={isPageLoading} text="Loading data..." fullscreen />

// Section load
<MsPreload visible={isSectionLoading}>
  <MySection />
</MsPreload>

// Inline load (table, card)
{isLoading ? <MsSpinner /> : <MyContent />}  {/* default: 2rem × 2rem */}

// Load triggered by a button action
<MsButton label="Save" loading={isSaving} onClickEvent={handleSave} />
```

---

### 9. Components with public methods — always use refs, never querySelector

Some components expose methods that must be called via a ref, not by querying the DOM.

| Component        | Methods                                                                              |
| ---------------- | ------------------------------------------------------------------------------------ |
| `MsNavbar`       | `collapse()`, `expand()`, `toggle()`                                                 |
| `MsFileUpload`   | `upload()`, `clear()`, `getFiles()`, `setFiles(files)`, `getElement()`, `getInput()` |

```tsx
// CORRECT
const navRef = useRef<HTMLMsNavbarElement>(null);
<MsNavbar ref={navRef} items={items} />;
navRef.current?.collapse();

// INCORRECT — never use querySelector to call component methods
(document.querySelector("ms-navbar") as any).collapse();
```

> For the full method signatures, see `mwc.md` — section 7 (Advanced patterns) and each component's entry.

---

### 11. moment.js — import only from the styleguide

The `moment` package is re-exported from `@maxi/styleguide` to prevent each app from bundling its own copy.

```tsx
// CORRECT
import moment from "@maxi/styleguide/moment";

// INCORRECT — do not install moment in the app
import moment from "moment";
```

> For simple date manipulation, prefer the helpers from `src/helpers/date` before using moment directly.

---

### 10. Permissions — always validate with validatePermission before rendering actions

Any action that depends on user permissions must be validated with the `user-admin-sdk` utilities before rendering the element.

```tsx
// CORRECT
import { validatePermission } from "@maxi/styleguide";

{
  validatePermission("INVOICE_DELETE") && (
    <MsButton label="Delete" variant="danger" onClickEvent={handleDelete} />
  );
}

// INCORRECT — do not control action visibility with custom business logic
{
  user.role === "admin" && (
    <MsButton label="Delete" variant="danger" onClickEvent={handleDelete} />
  );
}
```

---

### 12. Skeleton before Spinner for initial content load

When a section loads its content for the first time (not as a response to an action), use `MsSkeleton` to preserve the layout and avoid visual jumps.

```tsx
// CORRECT — initial load of a card or list
{
  isLoading ? (
    <>
      <MsSkeleton height="2rem" />
      <MsSkeleton height="1rem" style={{ marginTop: 8 }} />
      <MsSkeleton height="1rem" width="60%" style={{ marginTop: 4 }} />
    </>
  ) : (
    <MyContent />
  );
}

// MsSpinner — only for actions or intermediate states
```

---

### 15. CSS overrides — always scope under class/customClass, never target internal classes globally

When a component needs a CSS fix, always add the `class` or `customClass` prop to the component and scope the CSS under that selector. Never target internal component classes (like `.ms-dialog-header`, `.ms-dropdown-menu`) globally — it would affect all instances of that component in the project.

```tsx
// ✅ CORRECT — scoped under a class prop
<MsDialog class="confirm-delete-dialog" header="Confirm" ...>

// In CSS:
.confirm-delete-dialog .ms-dialog-header h3 { padding-right: 2.5rem; }
```

```tsx
// ❌ INCORRECT — targets ALL dialogs in the project
// In CSS:
.ms-dialog-header h3 { padding-right: 2.5rem; }
```

This applies to all components that expose `class` or `customClass`:
`MsDialog` → `class` | `MsDropdown` → `class` | `MsMultiselect` → `class` | `MsTable` → `class` | `MsNavbar` → `customClass` | `MsMeterGroup` → `customClass` | `MsTooltip` → `class` | etc.

---

### 14. Form components in flex containers — always set explicit width

`ms-*` custom elements render as `display: inline` by default. Inside a `display: flex` row they shrink to the width of their arrow icon — the placeholder disappears and the component looks broken. This only affects form/selection components: `MsDropdown`, `MsMultiselect`, `MsAutocomplete`, `MsCalendar`, `MsInputField`, `MsInputNumber`, `MsSelectButton`.

**Always wrap each component in a sized div when using flex:**

```tsx
// ✅ CORRECT — wrapper div controls the flex item
<div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
  <div style={{ flex: '0 0 200px' }}>
    <MsDropdown label="Estado" options={opts} onSelected={(e) => setVal(e.detail)} />
  </div>
  <div style={{ flex: '0 0 220px' }}>
    <MsCalendar label="Fecha" onUpdate={(e) => setDate(e.detail)} />
  </div>
</div>

// ✅ CORRECT — grid layouts work without wrappers (items fill the column)
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
  <MsDropdown label="Estado" options={opts} onSelected={(e) => setVal(e.detail)} />
  <MsCalendar label="Fecha" onUpdate={(e) => setDate(e.detail)} />
</div>

// ❌ INCORRECT — component collapses to minimum width, placeholder invisible
<div style={{ display: 'flex', gap: '1rem' }}>
  <MsDropdown label="Estado" options={opts} onSelected={(e) => setVal(e.detail)} />
  <MsCalendar label="Fecha" onUpdate={(e) => setDate(e.detail)} />
</div>
```

> For the full list of affected components and CSS selector approach, see `mwc.md` → Section 7 "Components in flex / grid layouts".

---

### 13. Components that must never be reimplemented locally in any app

| Need                        | Correct component |
| --------------------------- | ----------------- |
| Data table                  | `MsTable`         |
| Any text input              | `MsInputField`    |
| Single select               | `MsDropdown`      |
| Multi select                | `MsMultiselect`   |
| Date / date range           | `MsCalendar`      |
| Modal / confirmation        | `MsDialog`        |
| Toast / notification        | `MsNotification`  |
| Full-page loading indicator | `MsPreload`       |
| Inline loading indicator    | `MsSpinner`       |
| Loading skeleton            | `MsSkeleton`      |
| Pagination                  | `MsPaginator`     |
| Icon                        | `MsIcon`          |
| Button                      | `MsButton`        |
| Chart                       | `MsChart`         |
| Gauge / speedometer         | `MsGaugeChart`    |
| File upload                 | `MsFileUpload`    |
| Back to top button          | `MsScrollTop`     |
| Rich text editor            | `MsTextEditor`    |
| Breadcrumb                  | `MsBreadcrumb`    |
| Tabs                        | `MsTabs`          |
| Stepper / wizard            | `MsSteps`         |
| Side menu                   | `MsSidebar`       |
| Cascade menu                | `MsCascadeMenu`   |

---

## TypeScript — declaraciones en `src/models/` *(solo proyectos TypeScript)*

> **Esta sección solo aplica cuando el proyecto usa TypeScript** (`.ts` / `.tsx`, tiene `tsconfig.json`). En proyectos JavaScript no se requiere ninguna acción.

`@maxi/styleguide` y `@maxi/login` son módulos de import-map resueltos en runtime — **no son paquetes npm instalados**. TypeScript no sabe de ellos a menos que existan stubs de declaración.

### Dónde viven los tipos

| Archivo | Contenido |
|---------|-----------|
| `src/models/modules.d.ts` | Bloques `declare module "@maxi/*"` |
| `src/models/config.d.ts`  | Interface `AppConfig` y otros tipos del config runtime |

> Nunca agregar estas declaraciones en `declarations.d.ts` (ese archivo es solo para assets: `*.png`, `*.svg`, `*.css`).

### Cuándo actualizar `modules.d.ts`

Actualizar cuando TypeScript reporte cualquiera de estos errores sobre un import `@maxi/*`:

- `Cannot find module '@maxi/...' or its corresponding type declarations. ts(2307)`
- `Module '"@maxi/styleguide"' has no exported member 'X'. ts(2305)`
- `Property 'X' does not exist on type 'Y'. ts(2339)`
- `Argument of type 'X' is not assignable to parameter of type 'Y'. ts(2345)`

### Reglas de tipado

**1. Tipos reales cuando el shape es conocido — `any` solo por prop específico**

```typescript
// CORRECTO — typed con shapes reales
declare module "@maxi/styleguide" {
  export function validatePermission(
    env: string,
    token: string,
    system: string,
    permission: string
  ): Promise<Record<string, unknown>>;
  export const ProtectedRouteComponent: import("react").FC<{
    permission: boolean | null;
    redirectPath: string;
    children: import("react").ReactNode;
  }>;
  export const MsPreload: import("react").FC<{ image?: any; [key: string]: any }>;
  export const MaxiAnimation: any; // asset opaco → any
}

// INCORRECTO — pierde toda la seguridad de tipos
declare module "@maxi/styleguide" {
  const exports: any;
  export = exports;
}
```

**2. Usar `import()` inline dentro de `declare module` — nunca `import` al tope**

```typescript
// CORRECTO
declare module "@maxi/styleguide" {
  export const ProtectedRouteComponent: import("react").FC<{
    permission: boolean | null;
    redirectPath: string;
    children: import("react").ReactNode;
  }>;
}

// INCORRECTO — TS1232: import declarations not allowed in ambient modules
declare module "@maxi/styleguide" {
  import React from "react";
  export const ProtectedRouteComponent: React.FC<{ permission: boolean | null }>;
}
```

**3. Agregar exports incrementalmente — solo los que el proyecto realmente importa**

No copiar la API completa de entrada. Agregar cada entrada cuando TypeScript se queje por primera vez.

**4. `[key: string]: any` como escape hatch para props no documentadas**

```typescript
export const MsButton: import("react").FC<{
  label?: string;
  variant?: "primary" | "secondary" | "danger" | "outlined" | string;
  loading?: boolean;
  disabled?: boolean;
  onClickEvent?: (e: any) => void;
  [key: string]: any; // props no documentadas
}>;
```

### Declaraciones base de referencia

**`src/models/modules.d.ts`** — punto de partida para los módulos `@maxi/*`:

```typescript
declare module "@maxi/login" {
  export const token$: import("rxjs").Observable<string>;
  export function validateToken(): Promise<boolean>;
  export function getUserRoles(token: string): Promise<string>;
  export function logout(): void;
  export function decodeJWT(token: string): {
    id: string;
    iat: number;
    exp: number;
    createdAt: string;
    expiresAt: string;
  } | null;
  export function getUserProfile(): Promise<string>;
  export const keycloak: {
    token: string | undefined;
    authenticated: boolean;
    resourceAccess: Record<string, { roles: string[] }> | undefined;
    realmAccess: { roles: string[] } | undefined;
    login(): Promise<void>;
    logout(): Promise<void>;
    updateToken(minValidity: number): Promise<boolean>;
    [key: string]: any;
  };
}

declare module "@maxi/styleguide" {
  export function validatePermission(
    env: string,
    token: string,
    system: string,
    permission: string
  ): Promise<Record<string, unknown>>;
  export function getPermissions(): string[];
  export function validateGroupPermissions(permissions: string[]): boolean;
  export const ProtectedRouteComponent: import("react").FC<{
    permission: boolean | null;
    redirectPath: string;
    children: import("react").ReactNode;
  }>;
  export const MsPreload: import("react").FC<{
    visible?: boolean;
    text?: string;
    fullscreen?: boolean;
    image?: any;
    [key: string]: any;
  }>;
  export const MsSpinner: import("react").FC<{
    width?: string | number;
    height?: string | number;
    color?: string;
    [key: string]: any;
  }>;
  export const MaxiAnimation: any;
}
```

**`src/models/config.d.ts`** — shape del config runtime:

```typescript
export interface AppConfig {
  REACT_APP_API: string;
  REACT_APP_PERMISSION_ENVIRONMENT: string;
  [key: string]: string;
}
```

### Reglas para Claude *(TypeScript únicamente)*

- **Solo actuar en proyectos TypeScript.** Si el proyecto usa `.js`, no hay declaraciones que agregar.
- **Nunca agregar declaraciones `@maxi/*` en `node_modules`, `declarations.d.ts` o paths de `tsconfig.json`.** Siempre en `src/models/modules.d.ts`.
- **Corregir un error a la vez.** Cuando TypeScript reporta un export faltante, agregar solo ese export. No pegar la API completa de entrada.
- **Preferir `import("pkg").Type` sobre `any` cuando el tipo está documentado** en este archivo o en `login.md`. Usar `any` solo cuando el shape no está documentado o es demasiado dinámico.
- **Cuando un prop de componente causa `ts(2345)`, verificar primero en este documento y en `mwc.md`.** Si el nombre o valor del prop está documentado, tiparlo con precisión. Si no, ampliar solo ese prop a `any`.
- **No tocar `src/models/config.d.ts` para declaraciones de módulos** — ese archivo es exclusivamente para el shape del config runtime (`AppConfig`).
