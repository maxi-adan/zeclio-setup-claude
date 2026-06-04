# ZEUS Platform Constitution

## I. Módulos compartidos (NON-NEGOTIABLE)

Todos los componentes UI deben venir de `@maxi/styleguide`.
Nunca instalar `maxi-react-components` directamente en un microfrontend.
Nunca incluir en el bundle React, RxJS ni single-spa — están en el import map global de root-config.
Importar siempre vía nombre de módulo (`@maxi/styleguide`), nunca por ruta relativa interna.

## II. Autenticación

Nunca re-implementar autenticación en un microfrontend.
Usar `token$` o `props.token` de `@maxi/login` para acceder a la sesión.
Nunca almacenar el token en `localStorage` ni `sessionStorage`.
Usar `validateToken()` antes de operaciones críticas o de larga duración.
Nunca llamar `keycloak.init()` desde un microfrontend — ya corre en el módulo login.

## III. Controles HTML nativos (PROHIBIDO)

Nunca usar `<input>`, `<select>`, `<textarea>`, `<table>`, `<dialog>`, `alert()`, `confirm()`.
Usar siempre los equivalentes de `@maxi/styleguide`:
- Texto → `MsInputField`
- Select simple → `MsDropdown`
- Select múltiple → `MsMultiselect`
- Fecha → `MsCalendar`
- Tabla → `MsTable`
- Modal → `MsDialog`
- Notificación → `MsNotification`
- Carga de archivos → `MsFileUpload`

## IV. Permisos

Usar `validatePermission()` o `validateGroupPermissions()` de `@maxi/styleguide` para controlar visibilidad de acciones.
Nunca derivar permisos de lógica propia como `user.role === 'admin'`.
`getUserRoles()` retorna el raw de Keycloak — preferir siempre los helpers del styleguide.

## V. Props y eventos de componentes Ms*

Antes de usar cualquier componente `Ms*`, verificar los props y eventos exactos en `.claude/docs/mwc.md`.
Los nombres no siguen HTML estándar — son no obvios (ej. `activeTab` no `activeIndex`, `clickEvent` no `click`).
En React, los eventos se exponen con prefijo `on`: `clickEvent` → `onClickEvent`.
Pasar objetos y arrays como props JavaScript, nunca como strings JSON.

## VI. Dependencias

Nunca duplicar dependencias compartidas (React, ReactDOM, RxJS, Vue, single-spa).
Están provistas globalmente vía CDN en el import map de root-config/index.ejs.
Nunca re-exportar ni re-importar estas librerías desde el bundle del microfrontend.

## VII. CSS y tema

El CSS global (`global.css` o `global-zeclio.css`) se importa una sola vez en el entry point.
Nunca re-importarlo dentro de componentes individuales.
Para personalizar el tema, sobreescribir las CSS custom properties en el stylesheet global del proyecto.

Nunca targetear clases internas de componentes `ms-*` sin scope (ej. `.ms-dialog-header { ... }` afecta todos los diálogos del proyecto).
Siempre agregar el prop `class` o `customClass` al componente y scopear el override bajo ese selector:
```css
/* ✅ */ .mi-dialogo .ms-dialog-header h3 { padding-right: 2.5rem; }
/* ❌ */ .ms-dialog-header h3 { padding-right: 2.5rem; }
```

## Governance

Esta constitution tiene precedencia sobre cualquier otra convención del proyecto.
Cualquier violación detectada durante `/speckit-plan` o `/speckit-implement` debe reportarse antes de continuar.
Para agregar o modificar principios, usar `/speckit-constitution`.

**Version**: 1.1.0 | **Ratified**: 2026-06-03 | **Last Amended**: 2026-06-04
