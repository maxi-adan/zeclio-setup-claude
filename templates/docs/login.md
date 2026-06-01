# Login — Context for Claude

## Purpose of this module

`@maxi/login` is the **authentication layer** of the ZEUS platform. It initializes and manages a [Keycloak](https://www.keycloak.org/) session using the official `keycloak-js` adapter, and exposes the session state to all other microfrontends via a shared RxJS observable and utility functions.

This module has **no UI of its own** — it runs silently in the background. When the page loads, it immediately initializes Keycloak with `onLoad: "login-required"`, which redirects unauthenticated users to the SSO login page automatically.

**All other apps depend on this module.** The root-config waits for `token$` to emit a valid token before registering any microfrontend.

---

## Keycloak configuration

The Keycloak client is configured at runtime by fetching `config.json` from the module's public path. This allows the same bundle to connect to different realms per environment without rebuilding.

| Field      | Value                            |
| ---------- | -------------------------------- |
| `realm`    | `zeusDev`                        |
| `url`      | `https://sso.maxilabs.net/auth/` |
| `clientId` | `zeus`                           |

> To change the Keycloak server or realm for a specific environment, update `config.json` in the **login module repo** (or the deployed `config.json`in S3/CDN for that environment). Do not hardcode these values in `maxi-login.js`.

---

## Exported API

Everything exported from `maxi-login.js` is available to any microfrontend via:

```js
import {
  decodeJWT,
  getUserProfile,
  getUserRoles,
  keycloak,
  logout,
  token$,
  validateToken,
} from "@maxi/login";
```

---

### `token$` — `BehaviorSubject<string>`

The **primary session observable**. Emits the current JWT access token as a string.

- Emits `""` (empty string) on initialization and after logout.
- Emits the JWT string once Keycloak authenticates the user.
- Re-emits a new token string whenever the token is silently refreshed.

```js
import { filter } from "rxjs/operators";
import { token$ } from "@maxi/login";

// Wait for a valid token before doing anything
token$.pipe(filter((t) => !!t)).subscribe((token) => {
  // token is a valid JWT string
  initMyApp(token);
});
```

> This is the pattern used by root-config to delay microfrontend registration until the session is ready.

---

### `keycloak` — Keycloak instance

The raw `keycloak-js` instance, initialized after `initKeycloak()` runs on module load.

**Available on the instance (selection):**

| Property / Method                   | Description                                                             |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `keycloak.token`                    | Current raw JWT access token string                                     |
| `keycloak.tokenParsed`              | Decoded JWT payload object                                              |
| `keycloak.subject`                  | User ID (`sub` claim)                                                   |
| `keycloak.resourceAccess`           | Object with client roles per resource                                   |
| `keycloak.realmAccess`              | Object with realm-level roles                                           |
| `keycloak.authenticated`            | `true` if the session is active                                         |
| `keycloak.login()`                  | Redirects to the Keycloak login page                                    |
| `keycloak.logout()`                 | Terminates the session and redirects                                    |
| `keycloak.updateToken(minValidity)` | Silently refreshes the token if it expires within `minValidity` seconds |
| `keycloak.loadUserProfile()`        | Async — fetches the full Keycloak user profile                          |

> Prefer the exported utility functions below over accessing `keycloak` directly in apps. Direct access is fine for advanced use cases only.

---

### `validateToken()` — `Promise<boolean>`

Checks whether the current token is still valid and refreshes it proactively if it expires within 60 seconds.

- Returns `true` if the token is valid (or was successfully refreshed).
- Returns `false` if the refresh failed, and **redirects to the login page** as a side effect.
- Use this before making critical API calls in long-lived sessions.

```js
import { validateToken } from "@maxi/login";

async function fetchSensitiveData() {
  const isValid = await validateToken();
  if (!isValid) return; // user will be redirected to login
  return api.get("/sensitive-endpoint");
}
```

---

### `decodeJWT(token)` — `object | null`

Decodes a JWT string client-side (no signature verification) and returns a normalized object.

**Input:** a JWT string, optionally prefixed with `"Bearer "`.

**Returns:**

```ts
{
  id: string; // sub / id / user_id claim
  iat: number; // issued-at Unix timestamp
  exp: number; // expiry Unix timestamp
  createdAt: string; // human-readable issue date (America/Chicago timezone)
  expiresAt: string; // human-readable expiry date (America/Chicago timezone)
}
```

Returns `null` if the token is empty, malformed, or cannot be decoded.

```js
import { decodeJWT, token$ } from "@maxi/login";

token$.subscribe((token) => {
  const decoded = decodeJWT(token);
  if (decoded) {
    console.log("User ID:", decoded.id);
    console.log("Expires at:", decoded.expiresAt);
  }
});
```

> This function only decodes — it does **not** verify the signature. Use it for reading claims, not for security decisions.

---

### `getUserProfile()` — `Promise<string>`

Fetches the full Keycloak user profile for the authenticated user and returns it as a JSON string.

Returns `"No User"` if the user is not authenticated.

```js
import { getUserProfile } from "@maxi/login";

const profile = await getUserProfile();
console.log(JSON.parse(profile));
// { username, firstName, lastName, email, ... }
```

---

### `getUserRoles()` — `string`

Returns the `resourceAccess` object from the Keycloak instance as a formatted JSON string.

This contains the client-level roles assigned to the user per Keycloak resource/client.

Returns `"No roles assigned"` if the user is not authenticated.

```js
import { getUserRoles } from "@maxi/login";

const roles = JSON.parse(getUserRoles());
// { zeus: { roles: ['ZEUS_FINANCE_ACH', 'ZEUS_LAB_MAXIA_VIEW', ...] } }
```

> For permission checks in microfrontends, prefer `validatePermission` / `getPermissions` from `@maxi/styleguide`, which wraps this in a cleaner API.

---

### `logout()` — `void`

Terminates the Keycloak session and clears the token. Redirects the user to the Keycloak logout endpoint.

```js
import { logout } from "@maxi/login";

<MsButton label="Sign out" variant="outlined" onClickEvent={logout} />;
```

---

## Session state — how to consume from other apps

### Pattern 1 — via shared `token` prop (recommended for initialization)

root-config resolves `token$` once and passes the token to every app as a lifecycle prop. Apps receive it in their `mount` function:

```js
// In your single-spa lifecycle (e.g. src/main.js or index.js)
export async function mount(props) {
  const { token } = props; // JWT string, ready to use
  renderApp({ token });
}
```

Use this pattern to initialize your HTTP client or Axios instance at mount time.

### Pattern 2 — subscribe to `token$` directly (recommended for re-auth and refresh)

For apps that need to react to token refreshes (e.g. long-lived sessions with rotating tokens):

```js
import { filter } from "rxjs/operators";
import { token$ } from "@maxi/login";

token$.pipe(filter((t) => !!t)).subscribe((newToken) => {
  // Update your HTTP client's Authorization header
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
});
```

### Pattern 3 — validate before sensitive operations

```js
import { validateToken } from "@maxi/login";

async function submitForm(data) {
  await validateToken(); // ensures token is fresh, redirects if invalid
  return api.post("/endpoint", data);
}
```

---

## Automatic token lifecycle

The module handles the full token lifecycle without any intervention from apps:

| Event                    | Behavior                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Page load                | Redirects to SSO if unauthenticated (`onLoad: "login-required"`)                                 |
| Token near expiry        | `onTokenExpired` fires — token is refreshed silently via `updateToken(30)` and `token$` re-emits |
| Refresh fails            | `keycloak.login()` redirects to SSO                                                              |
| User logs out externally | `onAuthLogout` fires — `token$` emits `""`                                                       |

---

## Rules for Claude

- **Never re-implement authentication** in a microfrontend. All session management is centralized here.
- **Never store the token in `localStorage` or `sessionStorage`.** Keycloak manages the token lifecycle via the `onTokenExpired` hook and `token$`.
- **Never call `keycloak.init()` again** from another module. It is called once on module load in `maxi-login.js`. Calling it a second time breaks the session.
- **Use `token$` (not `keycloak.token`) to react to token changes.** `keycloak.token` is a snapshot; `token$` is the live stream.
- **Use `validateToken()` before long-running or sensitive API calls** in apps where the user might stay on a page for extended periods.
- **Use `@maxi/styleguide`'s `validatePermission` / `getPermissions`** for permission checks in app code, not `getUserRoles()` directly. `getUserRoles()` returns raw Keycloak resource access, which requires parsing.
- **Do not add business logic or UI to this module.** It is a pure authentication/session utility.
