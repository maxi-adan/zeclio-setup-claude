---
name: state
description: Redux Toolkit state management pattern for ZEUS microfrontends — local store per app, permissions slice, Provider setup, usePermissions hook. Use when adding state management or the permissions flow to a microfrontend.
---

# State Management — Context for Claude

## Architecture rule: one store per microfrontend

Each microfrontend owns its **own isolated Redux store**. There is no shared Redux store between microfrontends or with the root-config. State sharing between apps is done through `@maxi/login` observables (`token$`) and URL params — never through a shared Redux store.

---

## Store setup — `src/redux/store.js`

```js
import { configureStore } from "@reduxjs/toolkit";
import permissionsReducer from "./reducers/permissions";

export const store = configureStore({
  reducer: {
    permissions: permissionsReducer,
    // add feature reducers here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,   // required: RxJS observables are non-serializable
      immutableCheck: false,      // required: avoids false positives with Keycloak objects
    }),
});
```

> **`serializableCheck: false` and `immutableCheck: false` are required** in ZEUS. The permissions payload coming from Keycloak/UM contains non-serializable values that would otherwise crash Redux Toolkit's default checks.

---

## Permissions slice — `src/redux/reducers/permissions.js`

The canonical slice every microfrontend includes. Stores the token and the UM permission response:

```js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userToken: "",
  permissionUM: null,
};

export const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    setUserToken: (state, action) => ({ ...state, userToken: action.payload }),
    setPermissionUM: (state, action) => {
      const payload = action.payload;
      if (!payload || typeof payload !== "object") {
        return { ...state, permissionUM: payload };
      }
      const firstKey = Object.keys(payload)[0];
      return {
        ...state,
        permissionUM: payload,
        ...(firstKey && { [firstKey]: payload[firstKey] }),
      };
    },
  },
});

export const permissionsSelector = (state) => state.permissions;
export const { setUserToken, setPermissionUM } = permissionsSlice.actions;
export default permissionsSlice.reducer;
```

---

## Provider — `src/root.component.js`

Wrap the entire app in the `Provider` at the root level:

```jsx
import React from "react";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { RouterComponent } from "./router";

export const Root = () => (
  <Provider store={store}>
    <RouterComponent />
  </Provider>
);
```

---

## `usePermissions` hook — `src/hooks/usePermission.jsx`

The standard hook that loads the token, checks UM permissions, and checks Keycloak roles. Returns `isCanView` — the app renders its content only when `isCanView === true`.

```jsx
import { useState, useEffect } from "react";
import { token$, getUserRoles } from "@maxi/login";
import { validatePermission } from "@maxi/styleguide";
import { useDispatch, useSelector } from "react-redux";
import { setPermissionUM, setUserToken } from "../redux/reducers/permissions";
import { filter } from "rxjs/operators";
import { PERMISSION_NAME, PERMISSION_SYSTEM } from "../constants";

export const usePermissions = () => {
  const [isCanView, setIsCanView] = useState(null);
  const [uniquePermission, setUniquePermission] = useState(null);
  const [rolesKeycloak, setRolesKeycloak] = useState(null);
  const [permissionLoaded, setPermissionLoaded] = useState(false);

  const { userToken } = useSelector((state) => state.permissions);
  const dispatch = useDispatch();

  // Step 1: subscribe to token$ and store in Redux
  useEffect(() => {
    token$.pipe(filter((t) => !!t && t.trim() !== "")).subscribe(
      (token) => dispatch(setUserToken(token))
    );
  }, []);

  // Step 2: once token is available, load UM permissions and Keycloak roles
  useEffect(() => {
    if (!userToken) return;

    validatePermission(
      window.APP_CONFIG_[APP_NAME]?.REACT_APP_PERMISSION_ENVIRONMENT ?? "",
      userToken,
      PERMISSION_SYSTEM,
      PERMISSION_NAME
    )
      .then((res) => { setUniquePermission(res ?? "error"); setPermissionLoaded(true); })
      .catch(() => setPermissionLoaded(true));

    getUserRoles(userToken)
      .then((res) => setRolesKeycloak(JSON.parse(res)?.zeus?.roles || []));
  }, [userToken]);

  // Step 3: determine access when both permission sources are loaded
  useEffect(() => {
    if (rolesKeycloak === null || !permissionLoaded) return;

    uniquePermission && dispatch(setPermissionUM(uniquePermission?.permission));

    const fromUM = uniquePermission?.permission?.[PERMISSION_NAME]?.view;
    const fromRole = rolesKeycloak.includes(PERMISSION_NAME);
    setIsCanView(!!(fromUM || fromRole));
  }, [uniquePermission, rolesKeycloak, permissionLoaded]);

  return { isCanView };
};
```

**Replace `[APP_NAME]` with the actual app constant** — e.g. `APP_CONFIG_AI_FORUM_ANALYZER`.

---

## Constants — `src/constants/index.js`

```js
export const PERMISSION_SYSTEM = "zeus";
export const PERMISSION_NAME  = "YOUR_APP_PERMISSION_KEY";  // e.g. "ZEUS_LAB_MAXIA_VIEW"
export const TOOLTIP_MESSAGE_PERMISSION = "Insufficient permissions to complete this action.";
```

---

## Router pattern with permission guard — `src/router.js`

```jsx
import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { usePermissions } from "./hooks/usePermission";
import { MsSpinner } from "@maxi/styleguide";

export const RouterComponent = () => {
  const { isCanView } = usePermissions();

  if (isCanView === null) return <MsSpinner />;   // loading
  if (isCanView === false) return <p>{TOOLTIP_MESSAGE_PERMISSION}</p>;

  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/your-app" component={HomePage} />
      </Switch>
    </BrowserRouter>
  );
};
```

---

## When to use Redux vs local state

| State type | Use |
|---|---|
| Token + UM permissions | Redux (`permissions` slice) — needed across all components |
| UI state (open/close, filters, selection) | `useState` — local to the component |
| Server data (API responses) | `useState` or a `useQuery` hook — not Redux |
| Cross-component form state | `useState` lifted to parent, or React Context |

**Rule:** Redux is for the permissions/auth state that must be available app-wide. Everything else defaults to local state.
