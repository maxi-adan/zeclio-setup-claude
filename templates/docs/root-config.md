# Root-Config — Context for Claude

## Purpose of this module

`root-config` is the **shell and orchestrator** of the ZEUS single-spa application. Its only responsibilities are:

1. Bootstrap the single-spa runtime and load shared dependencies.
2. Define which microfrontend loads on which URL path (`microfrontend-layout.html`).
3. Resolve each microfrontend's bundle URL per environment (import maps).
4. Pass the session token to all applications as a shared prop.
5. Listen for lifecycle signals from microfrontends (e.g. `navbar:ready`) to coordinate the startup sequence.

**There is no business logic here.** Feature code belongs in individual microfrontends.

---

## How apps are registered

Registration is **layout-driven** — there are no explicit `registerApplication()` calls per app. The flow in [`src/maxi-root-config.js`](src/maxi-root-config.js) is:

```js
// 1. Parse the HTML layout to extract route → app mappings
const routes = constructRoutes(microfrontendLayout, { errors, props });

// 2. Build application descriptors from the routes
const applications = constructApplications({
  routes,
  loadApp({ name }) {
    return System.import(name); // resolves via SystemJS import map
  },
});

// 3. Wire the layout engine and start single-spa
const layoutEngine = constructLayoutEngine({ routes, applications });
applications.forEach(registerApplication);
layoutEngine.activate();
start();
```

To **add a new microfrontend**:

1. Add a `<route path="..."><application name="@maxi/app-name" error="appError"></application></route>` entry in `microfrontend-layout.html`.
2. Add the `appError` key to the `errors` object in `maxi-root-config.js`.
3. Add the `@maxi/app-name` bundle URL to the relevant import map files.

---

## Active routes

All routes are declared in [`src/microfrontend-layout.html`](src/microfrontend-layout.html).

| Path                          | Microfrontend                | Module name            |
| ----------------------------- | ---------------------------- | ---------------------- |
| _(default / homepage)_        | Static HTML (no app)         | —                      |
| `/stock`                      | Stock                        | `@maxi/stock`          |
| `/profit`                     | Profit MO                    | `@maxi/profit`         |
| `/speedometer`                | Velocimeter                  | `@maxi/velocimetro`    |
| `/ach`                        | ACH                          | `@maxi/ach`            |
| `/agency-list`                | Agency List                  | `@maxi/agencyList`     |
| `/bdu`                        | Bank Deposit Upload          | `@maxi/bdu`            |
| `/users-management`           | Users Administration         | `@maxi/users-admin`    |
| `/ofac`                       | OFAC                         | `@maxi/ofac`           |
| `/cfpb`                       | CFPB                         | `@maxi/cfpb`           |
| `/callcenter-ai`              | Call Center AI               | `@maxi/callcenter-ai`  |
| `/delphos`                    | Delphos                      | `@maxi/delphos`        |
| `/datalake-agent`             | Datalake Agent               | `@maxi/datalake-agent` |
| `/maxia-agent`                | Maxia Agent                  | `@maxi/maxia-agent`    |
| `/collection/commission-hold` | Collection / Commission Hold | `@maxi/collection`     |
| _(always visible)_            | Navbar                       | `@maxi/navbar`         |

> Commented-out routes (`/solutions`, `/anubis`) are disabled — the apps exist in the import map but are not activated.

---

## Import maps — environment resolution

Each microfrontend's bundle URL is resolved at runtime by SystemJS using an import map. The active map depends on the environment flag set in the Webpack/EJS build:

| File                                                            | Loaded when                                       |
| --------------------------------------------------------------- | ------------------------------------------------- |
| [`src/import-map.json`](src/import-map.json)                    | `isLocal` — local dev (all apps on `localhost`)   |
| [`src/import-map-dev.json`](src/import-map-dev.json)            | `isDev` — shared dev environment (S3 dev bundles) |
| [`src/import-map-stage.json`](src/import-map-stage.json)        | `isStage` — staging environment                   |
| External URL (`zeus.maxiagentes.net/maps/import-map-prod.json`) | `isProd` — production                             |

**Shared dependencies** (loaded once for all apps) are declared inline in `index.ejs`:

```json
{
  "single-spa": "cdn.../single-spa.min.js",
  "react": "cdn.../react.production.min.js",
  "react-dom": "cdn.../react-dom.production.min.js",
  "vue": "cdn.../vue.min.js",
  "vue-router": "cdn.../vue-router.min.js",
  "rxjs": "cdn.../rxjs.umd.min.js"
}
```

> These are loaded via CDN and shared across all microfrontends — **never bundle them inside an individual app**.

### Local override tool

`import-map-overrides` is included in every environment. Open the devtools panel (`localStorage.setItem('devtools', true)`) to override individual module URLs at runtime without redeploying.

---

## Startup sequence

```
index.ejs loads
  → SystemJS loads import map for current env
  → System.import('@maxi/root-config')
  → System.import('@maxi/utilities')        ← loads in parallel, no route dependency
      → token$ observable resolves (from @maxi/login)
      → constructRoutes / constructApplications / layoutEngine.activate()
      → applications.forEach(registerApplication) + start()
      → waitForNavbarReady() — waits for 'navbar:ready' event (5s timeout)
          → hideLoader() — fades out the loading overlay
```

---

## Cross-microfrontend communication

Apps in this shell communicate through three mechanisms:

### 1. Session token — shared prop

The session token is resolved once at boot from `@maxi/login`'s `token$` observable (RxJS) and passed to **all** microfrontends as a prop named `token` via `constructRoutes`:

```js
const token = await new Promise((resolve) => {
  token$.pipe(filter((token) => !!token)).subscribe(resolve);
});

constructRoutes(layout, { props: { token } });
```

Each app receives `token` as a lifecycle prop (`mount(props)` → `props.token`).

### 2. Custom DOM events

Apps dispatch and listen to browser native custom events on `document`. The root-config itself uses one:

| Event          | Direction            | Description                                                                        |
| -------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `navbar:ready` | navbar → root-config | Signals the navbar has mounted. root-config uses this to hide the loading overlay. |

**Pattern for inter-app events:**

```js
// Emitting app
document.dispatchEvent(new CustomEvent('zeus:some-event', { detail: { ... } }));

// Listening app
document.addEventListener('zeus:some-event', (e) => {
  console.log(e.detail);
});
```

> Prefer namespaced event names (`zeus:*`) to avoid collisions with browser or library events.

### 3. SystemJS import map (`@maxi/utilities`)

`@maxi/utilities` is loaded globally at startup (`System.import('@maxi/utilities')`) outside the route system, making its exports available to any app that imports it. Use it for truly shared, stateless utilities that must not live in a specific microfrontend.

---

## Rules for Claude

- **No business logic in root-config.** Route definitions, error messages, and startup orchestration only. Feature code belongs in microfrontends.
- **Never add app-specific CSS or components here.** Global styles (`global-styles.css`) are limited to layout primitives (body reset, navbar/main positioning).
- **To add a new microfrontend**, three files need to change: `microfrontend-layout.html` (route), `maxi-root-config.js` (error key), and the relevant import map files. Nothing else.
- **Never hardcode bundle URLs** outside the import map files. The import map is the single source of truth for module resolution.
- **Never duplicate shared dependencies** (React, ReactDOM, Vue, RxJS, single-spa) in an app's own bundle. They are provided globally via the inline import map in `index.ejs`.
- **The `token` prop is the only authentication mechanism** passed from root-config. Apps must not re-implement auth or re-fetch a session independently.
- **Custom events must be namespaced** (`zeus:event-name`) to prevent collisions. Document any new event in this file.
- **Do not add new `System.import()` calls** in `index.ejs` outside of the root-config and utilities bootstrap. Global eagerly-loaded modules hurt startup performance.
