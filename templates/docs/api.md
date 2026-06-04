---
name: api
description: HTTP service pattern for ZEUS microfrontends — how to set up axios with auth, base URL from APP_CONFIG, and token validation. Use when creating any service file that calls an API.
---

# API / Services — Context for Claude

## Purpose

Every ZEUS microfrontend that calls an external API must use a **pre-configured axios instance** that automatically:
1. Reads the base URL from `window.APP_CONFIG_[APP_NAME]`
2. Validates the Keycloak token before each request
3. Injects the `Authorization: Bearer <token>` header
4. Redirects to login if the token is invalid

Never use raw `axios` or `fetch` directly — always use a configured instance.

---

## Standard `instance.js` pattern

Every microfrontend creates one file `src/services/instance.js`:

```js
import axios from "axios";
import { token$, logout, validateToken } from "@maxi/login";
import { filter } from "rxjs/operators";

const instance = axios.create({
  baseURL: "",
});

instance.interceptors.request.use(
  async function (config) {
    try {
      // 1. Set base URL from runtime config
      if (window.APP_CONFIG_[APP_NAME] && window.APP_CONFIG_[APP_NAME].REACT_APP_API) {
        config.baseURL = window.APP_CONFIG_[APP_NAME].REACT_APP_API;
      }

      // 2. Validate token before request
      const isTokenValid = await validateToken();
      if (!isTokenValid) {
        logout();
        return Promise.reject(new Error("Token inválido"));
      }

      // 3. Get current token value from the RxJS observable
      const token = await new Promise((resolve, reject) => {
        token$
          .pipe(filter((t) => !!t && t.trim() !== ""))
          .subscribe(resolve, reject);
      });

      // 4. Inject auth header
      config.headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*",
      };

      return config;
    } catch (error) {
      console.error("Error en interceptor de request:", error);
      logout();
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => Promise.reject(error)
);

export default instance;
```

**Replace `[APP_NAME]` with the actual app constant** — e.g. `APP_CONFIG_AI_FORUM_ANALYZER`.

---

## `window.APP_CONFIG_[APP_NAME]` convention

Runtime configuration is injected into `window` by the root-config at startup. Each microfrontend reads its own namespace:

```js
// Base URL for API calls
window.APP_CONFIG_AI_FORUM_ANALYZER.REACT_APP_API

// Permission environment key
window.APP_CONFIG_AI_FORUM_ANALYZER.REACT_APP_PERMISSION_ENVIRONMENT
```

**Never hardcode the base URL** — always read it from `window.APP_CONFIG_*`. This allows the same build to run in dev, staging, and production.

---

## Service files

Create one file per API domain under `src/services/`:

```js
// src/services/jurisdictions.js
import instance from "./instance";

export const getJurisdictions = () =>
  instance.get("/jurisdictions");

export const getJurisdictionById = (id) =>
  instance.get(`/jurisdictions/${id}`);

export const createJurisdiction = (data) =>
  instance.post("/jurisdictions", data);
```

Usage in a component:

```jsx
import { getJurisdictions } from "../services/jurisdictions";

useEffect(() => {
  getJurisdictions()
    .then((res) => setData(res.data))
    .catch((err) => console.error(err));
}, []);
```

---

## Key rules

- **Always** use the `instance.js` interceptor — never raw axios or fetch.
- **Never** read the token from `localStorage` or `sessionStorage` — use `token$` from `@maxi/login`.
- **Always** call `validateToken()` via the interceptor — never manually in components.
- **Always** call `logout()` when the token is invalid — never silently fail.
- **Always** read base URL from `window.APP_CONFIG_*` — never hardcode URLs.
- The `token$` observable subscription in the interceptor must use `filter((t) => !!t && t.trim() !== "")` to skip empty/null values emitted during initialization.
