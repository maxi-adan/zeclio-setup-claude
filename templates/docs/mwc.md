---
name: mwc
description: Implements components from the maxi-web-components library in React, Angular or Vanilla JS. Use when the user wants to add, install or use any ms-* component, configure .npmrc for Nexus, or asks what components are available.
---

# MAXI Web Components — Reference

> Auto-generated from source — 2026-05-28. Total: **50 components**. Version: **9.0.0**.

---

## Installation

```ini
# .npmrc
registry=https://artifacts.maxilabs.net/repository/npm-group/
//artifacts.maxilabs.net/repository/npm-group/:_authToken=<TOKEN>
```

```bash
npm install maxi-react-components    # React (includes maxi-web-components)
npm install maxi-angular-components  # Angular (includes maxi-web-components)
npm install maxi-web-components      # Vanilla JS only
```

Import global styles in the app entry point:

```ts
import 'maxi-web-components/global.css';
// or Zeclio theme:
// import 'maxi-web-components/global-zeclio.css';
```

> **Events in React:** component events are exposed as props with the `on` prefix.
> Example: `clickEvent` → `onClickEvent`, `selected` → `onSelected`.

---

## Forms

### `ms-checkbox`

## Properties

| Property   | Attribute  | Description                                   | Type      | Default     |
| ---------- | ---------- | --------------------------------------------- | --------- | ----------- |
| `checked`  | `checked`  | Checked - to manipulate checkbox from outside | `boolean` | `false`     |
| `class`    | `class`    | Custom class                                  | `string`  | `undefined` |
| `disabled` | `disabled` | Disabled                                      | `boolean` | `undefined` |
| `inputId`  | `input-id` | Input Id                                      | `string`  | `undefined` |
| `label`    | `label`    | Label                                         | `string`  | `undefined` |
| `name`     | `name`     | Name                                          | `string`  | `undefined` |
| `value`    | `value`    | Value                                         | `string`  | `undefined` |


## Events

| Event            | Description | Type                   |
| ---------------- | ----------- | ---------------------- |
| `checkboxChange` | On Change   | `CustomEvent<boolean>` |

---

### `ms-control-number`

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

---

### `ms-input-field`

## Properties

| Property       | Attribute       | Description | Type      | Default            |
| -------------- | --------------- | ----------- | --------- | ------------------ |
| `class`        | `class`         |             | `string`  | `null`             |
| `disabled`     | `disabled`      |             | `boolean` | `null`             |
| `errorMessage` | `error-message` |             | `string`  | `null`             |
| `idComponent`  | `id-component`  |             | `string`  | `'ms-input-field'` |
| `invalid`      | `invalid`       |             | `boolean` | `false`            |
| `label`        | `label`         |             | `string`  | `null`             |
| `maxLength`    | `max-length`    |             | `number`  | `null`             |
| `placeholder`  | `placeholder`   |             | `string`  | `null`             |
| `required`     | `required`      |             | `boolean` | `false`            |
| `value`        | `value`         |             | `any`     | `null`             |


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

---

### `ms-input-group`

> No readme.md found. Run `npm run build` in core/ to generate it.

---

### `ms-input-number`

## Properties

| Property            | Attribute             | Description | Type                     | Default             |
| ------------------- | --------------------- | ----------- | ------------------------ | ------------------- |
| `class`             | `class`               |             | `string`                 | `undefined`         |
| `currency`          | `currency`            |             | `string`                 | `'USD'`             |
| `disabled`          | `disabled`            |             | `boolean`                | `false`             |
| `errorMessage`      | `error-message`       |             | `string`                 | `null`              |
| `idComponent`       | `id-component`        |             | `string`                 | `'ms-input-number'` |
| `invalid`           | `invalid`             |             | `boolean`                | `false`             |
| `label`             | `label`               |             | `string`                 | `null`              |
| `locale`            | `locale`              |             | `string`                 | `'en-US'`           |
| `max`               | `max`                 |             | `number`                 | `undefined`         |
| `maxFractionDigits` | `max-fraction-digits` |             | `number`                 | `2`                 |
| `maxLength`         | `max-length`          |             | `number`                 | `20`                |
| `min`               | `min`                 |             | `number`                 | `undefined`         |
| `minFractionDigits` | `min-fraction-digits` |             | `number`                 | `0`                 |
| `mode`              | `mode`                |             | `"currency" \| "number"` | `undefined`         |
| `placeholder`       | `placeholder`         |             | `string`                 | `undefined`         |
| `prefixInput`       | `prefix-input`        |             | `string`                 | `undefined`         |
| `required`          | `required`            |             | `boolean`                | `false`             |
| `showControls`      | `show-controls`       |             | `boolean`                | `false`             |
| `suffix`            | `suffix`              |             | `string`                 | `undefined`         |
| `useGrouping`       | `use-grouping`        |             | `boolean`                | `true`              |
| `value`             | `value`               |             | `number`                 | `undefined`         |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `blurEvent`        |             | `CustomEvent<number>`           |
| `changeEvent`      |             | `CustomEvent<number>`           |
| `clickEvent`       |             | `CustomEvent<number>`           |
| `focusEvent`       |             | `CustomEvent<number>`           |
| `inputEvent`       |             | `CustomEvent<number>`           |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |

---

### `ms-input-otp`

## Properties

| Property       | Attribute       | Description | Type                                | Default          |
| -------------- | --------------- | ----------- | ----------------------------------- | ---------------- |
| `autoFocus`    | `auto-focus`    |             | `boolean`                           | `false`          |
| `customClass`  | `custom-class`  |             | `string`                            | `''`             |
| `disabled`     | `disabled`      |             | `boolean`                           | `false`          |
| `errorMessage` | `error-message` |             | `string`                            | `null`           |
| `idComponent`  | `id-component`  |             | `string`                            | `'ms-input-otp'` |
| `invalid`      | `invalid`       |             | `boolean`                           | `false`          |
| `length`       | `length`        |             | `number`                            | `4`              |
| `placeholder`  | `placeholder`   |             | `string`                            | `''`             |
| `required`     | `required`      |             | `boolean`                           | `false`          |
| `type`         | `type`          |             | `"numeric" \| "password" \| "text"` | `'text'`         |
| `value`        | `value`         |             | `any`                               | `null`           |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `blurEvent`        |             | `CustomEvent<number>`           |
| `completeEvent`    |             | `CustomEvent<string>`           |
| `focusEvent`       |             | `CustomEvent<number>`           |
| `inputEvent`       |             | `CustomEvent<string>`           |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

### `ms-input-password`

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

---

### `ms-input-switch`

## Properties

| Property          | Attribute          | Description                                  | Type             | Default     |
| ----------------- | ------------------ | -------------------------------------------- | ---------------- | ----------- |
| `checked`         | `checked`          | Checked, to manipulate checkbox from outside | `boolean`        | `false`     |
| `class`           | `class`            | Custom class                                 | `string`         | `undefined` |
| `disabled`        | `disabled`         | Disabled                                     | `boolean`        | `undefined` |
| `tooltip`         | `tooltip`          | Content for tooltip                          | `string`         | `undefined` |
| `tooltipPosition` | `tooltip-position` | Tooltip Position                             | `Position.Right` | `undefined` |


## Events

| Event         | Description | Type                   |
| ------------- | ----------- | ---------------------- |
| `changeEvent` |             | `CustomEvent<boolean>` |

---

### `ms-knob`

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

---

### `ms-radio`

## Properties

| Property    | Attribute    | Description | Type      | Default     |
| ----------- | ------------ | ----------- | --------- | ----------- |
| `checked`   | `checked`    |             | `boolean` | `undefined` |
| `class`     | `class`      |             | `string`  | `undefined` |
| `disabled`  | `disabled`   |             | `boolean` | `undefined` |
| `idRadio`   | `id-radio`   |             | `string`  | `undefined` |
| `isChecked` | `is-checked` |             | `boolean` | `undefined` |
| `label`     | `label`      |             | `string`  | `undefined` |
| `name`      | `name`       |             | `string`  | `undefined` |
| `value`     | `value`      |             | `string`  | `undefined` |


## Events

| Event         | Description | Type               |
| ------------- | ----------- | ------------------ |
| `radioChange` |             | `CustomEvent<any>` |

---

## Selection

### `ms-autocomplete`

## Properties

| Property       | Attribute       | Description | Type                                  | Default               |
| -------------- | --------------- | ----------- | ------------------------------------- | --------------------- |
| `class`        | `class`         |             | `string`                              | `null`                |
| `disabled`     | `disabled`      |             | `boolean`                             | `false`               |
| `errorMessage` | `error-message` |             | `string`                              | `null`                |
| `idComponent`  | `id-component`  |             | `string`                              | `'ms-autocomplete'`   |
| `invalid`      | `invalid`       |             | `boolean`                             | `false`               |
| `label`        | `label`         |             | `string`                              | `null`                |
| `optionGroup`  | `option-group`  |             | `boolean`                             | `false`               |
| `placeholder`  | `placeholder`   |             | `string`                              | `'Type to search...'` |
| `required`     | `required`      |             | `boolean`                             | `false`               |
| `showIcon`     | `show-icon`     |             | `boolean`                             | `false`               |
| `suggestions`  | --              |             | `{ label: string; value: string; }[]` | `[]`                  |
| `value`        | `value`         |             | `number \| string`                    | `null`                |


## Events

| Event              | Description | Type                                                                                               |
| ------------------ | ----------- | -------------------------------------------------------------------------------------------------- |
| `completeMethod`   |             | `CustomEvent<{ query: string; resolve: (results: { label: string; value: string; }[]) => void; }>` |
| `selected`         |             | `CustomEvent<{ label: string; value: string; }>`                                                   |
| `validationChange` |             | `CustomEvent<ValidationDetail>`                                                                    |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

### `ms-chips`

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

---

### `ms-dropdown`

## Properties

| Property       | Attribute       | Description | Type                    | Default           |
| -------------- | --------------- | ----------- | ----------------------- | ----------------- |
| `class`        | `class`         |             | `string`                | `null`            |
| `disabled`     | `disabled`      |             | `boolean`               | `false`           |
| `errorMessage` | `error-message` |             | `string`                | `null`            |
| `filter`       | `filter`        |             | `boolean`               | `false`           |
| `idComponent`  | `id-component`  |             | `string`                | `'ms-dropdown'`   |
| `invalid`      | `invalid`       |             | `boolean`               | `false`           |
| `label`        | `label`         |             | `string`                | `null`            |
| `optionGroup`  | `option-group`  |             | `boolean`               | `false`           |
| `options`      | --              |             | `GroupItem[] \| Item[]` | `[]`              |
| `placeholder`  | `placeholder`   |             | `string`                | `'Select option'` |
| `required`     | `required`      |             | `boolean`               | `false`           |
| `value`        | `value`         |             | `number \| string`      | `null`            |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `selected`         |             | `CustomEvent<string>`           |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |

---

### `ms-multiselect`

## Properties

| Property              | Attribute                | Description | Type                    | Default            |
| --------------------- | ------------------------ | ----------- | ----------------------- | ------------------ |
| `class`               | `class`                  |             | `string`                | `null`             |
| `disabled`            | `disabled`               |             | `boolean`               | `false`            |
| `display`             | `display`                |             | `string`                | `'comma'`          |
| `errorMessage`        | `error-message`          |             | `string`                | `null`             |
| `idComponent`         | `id-component`           |             | `string`                | `'ms-multiselect'` |
| `invalid`             | `invalid`                |             | `boolean`               | `false`            |
| `label`               | `label`                  |             | `string`                | `null`             |
| `optionGroup`         | `option-group`           |             | `boolean`               | `false`            |
| `options`             | --                       |             | `GroupItem[] \| Item[]` | `[]`               |
| `placeholder`         | `placeholder`            |             | `string`                | `'Select an item'` |
| `required`            | `required`               |             | `boolean`               | `false`            |
| `selectAllOptionText` | `select-all-option-text` |             | `string`                | `''`               |
| `showFilter`          | `show-filter`            |             | `boolean`               | `false`            |
| `showSelectAll`       | `show-select-all`        |             | `boolean`               | `true`             |
| `value`               | --                       |             | `GroupItem[] \| Item[]` | `undefined`        |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `filter`           |             | `CustomEvent<string>`           |
| `hide`             |             | `CustomEvent<boolean>`          |
| `selectAll`        |             | `CustomEvent<any>`              |
| `selected`         |             | `CustomEvent<string>`           |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |

---

### `ms-select-button`

## Properties

| Property          | Attribute          | Description | Type                                                                 | Default              |
| ----------------- | ------------------ | ----------- | -------------------------------------------------------------------- | -------------------- |
| `class`           | `class`            |             | `string`                                                             | `null`               |
| `disabled`        | `disabled`         |             | `boolean`                                                            | `false`              |
| `errorMessage`    | `error-message`    |             | `string`                                                             | `null`               |
| `idComponent`     | `id-component`     |             | `string`                                                             | `'ms-select-button'` |
| `invalid`         | `invalid`          |             | `boolean`                                                            | `false`              |
| `label`           | `label`            |             | `string`                                                             | `null`               |
| `multiple`        | `multiple`         |             | `boolean`                                                            | `false`              |
| `options`         | --                 |             | `Item[] \| string[]`                                                 | `[]`                 |
| `required`        | `required`         |             | `boolean`                                                            | `false`              |
| `tooltip`         | `tooltip`          |             | `string`                                                             | `null`               |
| `tooltipPosition` | `tooltip-position` |             | `Position.Bottom \| Position.Left \| Position.Right \| Position.Top` | `Position.Top`       |
| `value`           | `value`            |             | `any`                                                                | `null`               |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `changeValue`      |             | `CustomEvent<any>`              |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |

---

## Navigation and layout

### `ms-accordion`

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


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

### `ms-breadcrumb`

## Properties

| Property        | Attribute        | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                          | Default                  |
| --------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `customClass`   | `custom-class`   |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                      | `''`                     |
| `home`          | --               |             | `BreadcrumbItem`                                                                                                                                                                                                                                                                                                                                                                                              | `null`                   |
| `idPrefix`      | `id-prefix`      |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                      | `'ms-breadcrumb'`        |
| `model`         | --               |             | `BreadcrumbItem[]`                                                                                                                                                                                                                                                                                                                                                                                            | `[]`                     |
| `separatorIcon` | `separator-icon` |             | `"info" \| "success" \| "alert" \| "close" \| "home" \| "breadcrumb-separator" \| "chevron-double-left" \| "chevron-left" \| "chevron-double-right" \| "chevron-right" \| "next" \| "previous" \| "close-circle" \| "search" \| "calendar" \| "increment" \| "decrement" \| "up-arrow" \| "down-arrow" \| "expanded-up" \| "expanded-down" \| "sort" \| "sort-up" \| "sort-down" \| "warning" \| "not-found"` | `'breadcrumb-separator'` |

---

### `ms-navbar`

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

---

### `ms-sidebar`

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


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

### `ms-steps`

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

---

### `ms-tabs`

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


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

## Display and visualization

### `ms-badge`

## Properties

| Property   | Attribute  | Description                                           | Type                                      | Default      |
| ---------- | ---------- | ----------------------------------------------------- | ----------------------------------------- | ------------ |
| `class`    | `class`    | Style Class                                           | `string`                                  | `undefined`  |
| `severity` | `severity` | Severity Type of Badge                                | `string`                                  | `undefined`  |
| `size`     | `size`     | Size of the badge, valid options are large and xlarge | `Size.Large \| Size.Medium \| Size.Small` | `Size.Small` |
| `value`    | `value`    | The first name                                        | `string`                                  | `undefined`  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

### `ms-icon`

## Properties

| Property      | Attribute      | Description                               | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Default          |
| ------------- | -------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `color`       | `color`        | Color of the icon (default: currentColor) | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `'currentColor'` |
| `customClass` | `custom-class` | Additional CSS class                      | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`      |
| `name`        | `name`         | Name of the icon to display               | `"filter" \| "info" \| "copy" \| "menu" \| "download" \| "x" \| "home" \| "chevron-left" \| "chevron-right" \| "search" \| "calendar" \| "alert-circle" \| "alert-triangle" \| "arrow-left" \| "arrow-right" \| "bell" \| "check" \| "check-circle" \| "chevron-down" \| "chevron-up" \| "edit" \| "eye" \| "eye-off" \| "lock" \| "mail" \| "minus" \| "plus" \| "refresh" \| "settings" \| "trash" \| "unlock" \| "upload" \| "user" \| "nav-administration" \| "nav-agent" \| "nav-business-intelligence" \| "nav-callcenter-ai" \| "nav-compliance" \| "nav-customer" \| "nav-finance" \| "nav-home" \| "nav-operations" \| "nav-owner" \| "nav-product" \| "nav-sales" \| "nav-zeus-lab"` | `undefined`      |
| `size`        | `size`         | Size of the icon in pixels (default: 24)  | `number \| string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `24`             |

---

### `ms-image`

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

---

### `ms-message`

## Properties

| Property      | Attribute      | Description | Type                                                          | Default  |
| ------------- | -------------- | ----------- | ------------------------------------------------------------- | -------- |
| `customClass` | `custom-class` |             | `string`                                                      | `''`     |
| `noIcon`      | `no-icon`      |             | `boolean`                                                     | `false`  |
| `variant`     | `variant`      |             | `"danger" \| "info" \| "secondary" \| "success" \| "warning"` | `'info'` |

---

### `ms-notification`

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


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

### `ms-skeleton`

## Properties

| Property       | Attribute       | Description | Type     | Default |
| -------------- | --------------- | ----------- | -------- | ------- |
| `borderRadius` | `border-radius` |             | `string` | `null`  |
| `class`        | `class`         |             | `string` | `null`  |
| `height`       | `height`        |             | `string` | `null`  |
| `shape`        | `shape`         |             | `string` | `null`  |
| `width`        | `width`         |             | `string` | `null`  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

### `ms-spinner`

## Properties

| Property | Attribute | Description | Type     | Default     |
| -------- | --------- | ----------- | -------- | ----------- |
| `color`  | `color`   |             | `string` | `"#8CA2D4"` |
| `height` | `height`  |             | `string` | `'2rem'`    |
| `width`  | `width`   |             | `string` | `'2rem'`    |

---

## Interactive and complex

### `ms-button`

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

---

### `ms-calendar`

## Properties

| Property             | Attribute              | Description | Type                                          | Default                |
| -------------------- | ---------------------- | ----------- | --------------------------------------------- | ---------------------- |
| `class`              | `class`                |             | `string`                                      | `null`                 |
| `closeOnSelect`      | `close-on-select`      |             | `boolean`                                     | `false`                |
| `disabled`           | `disabled`             |             | `boolean`                                     | `false`                |
| `errorMessage`       | `error-message`        |             | `string`                                      | `null`                 |
| `hourFormat`         | `hour-format`          |             | `"12" \| "24"`                                | `'24'`                 |
| `idComponent`        | `id-component`         |             | `string`                                      | `'ms-calendar'`        |
| `invalid`            | `invalid`              |             | `boolean`                                     | `false`                |
| `label`              | `label`                |             | `string`                                      | `null`                 |
| `maxDate`            | --                     |             | `Date`                                        | `null`                 |
| `minDate`            | --                     |             | `Date`                                        | `null`                 |
| `placeholder`        | `placeholder`          |             | `string`                                      | `'Select a date'`      |
| `required`           | `required`             |             | `boolean`                                     | `false`                |
| `selectionMode`      | `selection-mode`       |             | `SelectionMode.Range \| SelectionMode.Single` | `SelectionMode.Single` |
| `showAmPmControls`   | `show-am-pm-controls`  |             | `boolean`                                     | `true`                 |
| `showHourControls`   | `show-hour-controls`   |             | `boolean`                                     | `true`                 |
| `showIcon`           | `show-icon`            |             | `boolean`                                     | `false`                |
| `showMinuteControls` | `show-minute-controls` |             | `boolean`                                     | `true`                 |
| `showTime`           | `show-time`            |             | `boolean`                                     | `false`                |
| `stepHour`           | `step-hour`            |             | `number`                                      | `1`                    |
| `stepMinute`         | `step-minute`          |             | `number`                                      | `1`                    |
| `value`              | `value`                |             | `number \| string \| string[]`                | `null`                 |


## Events

| Event              | Description | Type                            |
| ------------------ | ----------- | ------------------------------- |
| `update`           |             | `CustomEvent<any>`              |
| `validationChange` |             | `CustomEvent<ValidationDetail>` |

---

### `ms-carousel`

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

---

### `ms-cascade-menu`

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

---

### `ms-chart`

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

---

### `ms-dialog`

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


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

### `ms-inplace`

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

---

### `ms-menubar`

## Properties

| Property           | Attribute             | Description | Type                      | Default |
| ------------------ | --------------------- | ----------- | ------------------------- | ------- |
| `cascadeMenuClass` | `cascade-menu-class`  |             | `string`                  | `''`    |
| `customClass`      | `custom-class`        |             | `string`                  | `''`    |
| `items`            | `items`               |             | `MenubarItem[] \| string` | `[]`    |
| `menuActiveItemId` | `menu-active-item-id` |             | `string`                  | `''`    |

---

### `ms-popover`

## Properties

| Property        | Attribute         | Description | Type                                                                     | Default            |
| --------------- | ----------------- | ----------- | ------------------------------------------------------------------------ | ------------------ |
| `closeOnEscape` | `close-on-escape` |             | `boolean`                                                                | `true`             |
| `customClass`   | `custom-class`    |             | `string`                                                                 | `''`               |
| `dismissable`   | `dismissable`     |             | `boolean`                                                                | `true`             |
| `placement`     | `placement`       |             | `Placement.Bottom \| Placement.Left \| Placement.Right \| Placement.Top` | `Placement.Bottom` |
| `showCloseIcon` | `show-close-icon` |             | `boolean`                                                                | `false`            |
| `trigger`       | `trigger`         |             | `Trigger.Click \| Trigger.Focus \| Trigger.Hover`                        | `Trigger.Click`    |

---

### `ms-table`

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

---

### `ms-text-editor`

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

---

## Feedback and progress

### `ms-meter-group`

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

---

### `ms-progress-bar`

## Properties

| Property               | Attribute | Description | Type                               | Default         |
| ---------------------- | --------- | ----------- | ---------------------------------- | --------------- |
| `displayValueTemplate` | --        |             | `(value: number) => any`           | `undefined`     |
| `mode`                 | `mode`    |             | `"determinate" \| "indeterminate"` | `'determinate'` |
| `unit`                 | `unit`    |             | `string`                           | `'%'`           |
| `value`                | `value`   |             | `number`                           | `undefined`     |

---

### `ms-timeline`

## Properties

| Property      | Attribute      | Description | Type                                                       | Default          |
| ------------- | -------------- | ----------- | ---------------------------------------------------------- | ---------------- |
| `align`       | `align`        |             | `Alignment.Alternate \| Alignment.Left \| Alignment.Right` | `Alignment.Left` |
| `class`       | `class`        |             | `string`                                                   | `null`           |
| `events`      | --             |             | `{ [key: string]: any; }[]`                                | `[]`             |
| `idComponent` | `id-component` |             | `string`                                                   | `''`             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

### `ms-tooltip`

## Properties

| Property      | Attribute      | Description | Type                                                                 | Default        |
| ------------- | -------------- | ----------- | -------------------------------------------------------------------- | -------------- |
| `class`       | `class`        |             | `string`                                                             | `null`         |
| `content`     | `content`      |             | `string`                                                             | `''`           |
| `position`    | `position`     |             | `Position.Bottom \| Position.Left \| Position.Right \| Position.Top` | `Position.Top` |
| `showContent` | `show-content` |             | `boolean`                                                            | `true`         |

---

## Utilities

### `ms-fieldset`

## Properties

| Property      | Attribute      | Description | Type      | Default |
| ------------- | -------------- | ----------- | --------- | ------- |
| `customClass` | `custom-class` |             | `string`  | `''`    |
| `legend`      | `legend`       |             | `string`  | `''`    |
| `toggleable`  | `toggleable`   |             | `boolean` | `false` |

---

### `ms-file-upload`

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

---

### `ms-gauge-chart`

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

---

### `ms-paginator`

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

---

### `ms-preload`

## Properties

| Property | Attribute | Description | Type     | Default     |
| -------- | --------- | ----------- | -------- | ----------- |
| `image`  | `image`   |             | `string` | `undefined` |
| `text`   | `text`    |             | `string` | `undefined` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

### `ms-scroll-top`

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

---

## New components

### `ms-web-card`

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


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

---

