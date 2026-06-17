# LX/UI Migration Guide

As LX/UI evolves, some features are refined, simplified, or replaced by better alternatives. This guide documents all breaking changes and recommended migration paths between releases.

Our goal is to make upgrading predictable, transparent, and worth the effort.

## 2.2.3 → 2.2.4

### Breaking changes

#### LxNumberSlider

**Decimal support removed**

`LxNumberSlider` now only supports whole numbers. Decimal `modelValue`, `step`, and `stepMultiplier` values are no longer accepted. Values are silently rounded to the nearest integer at runtime, and a warning is logged in development environments.

If your project passes decimal values to any of these props, round them before passing.

## 2.1.12 → 2.2.0

### Breaking changes

#### LxDropDown Component Removed

The `LxDropDown` component has been removed. Use `LxValuePicker` with `variant="dropdown"` instead.

**Before:**
```js
<LxDropDown 
  v-model="selectedValue" 
  :items="items" 
  :placeholder="placeholder"
/>
```

**After:**
```js
<LxValuePicker 
  v-model="selectedValue" 
  variant="dropdown"
  :items="items" 
  :placeholder="placeholder"
/>
```

#### CSS File Renames

Several CSS files have been renamed:

- `lx-modal.css` → `lx-modals.css`
- `lx-shell-grid-digimaks-lite.css` → `lx-shell-grid-digimaks.css`
- `lx-shell-grid-digimaks.css` → `lx-shell-grid-nobid.css`

If you are importing these files directly in your project, update your imports accordingly.

#### LxFileUploader

Removed `changeState` exposed function to change item states. Use emitted `v-model:itemsStates` instead.

#### LxFileViewer

Prop `stickyHeader` renamed and now it's `stickyToolbar`.

#### Popovers

**Token renames**
- `--padding-dropdown` -> `--popover-padding` (value changed from `--space-0500` to `--space-0125`)

**Token removals**
- `--popover-item-width` (100%)
- `--popover-item-min-width` (`--row-size`)

### Other changes

#### Builders moved to @dativa-lv/lx-builders 

The following builders have been moved out of the core package into a dedicated repository:
- LxFormBuilder
- LxViewBuilder
- LxFilterBuilder

They are now maintained in the `@dativa-lv/lx-builders` package.

If your project uses any of the builders listed above, you must install the new package:

pnpm example:
```bash
pnpm i @dativa-lv/lx-builders
```

Update your imports to reference `@dativa-lv/lx-builders` instead of `@dativa-lv/lx-ui`.

You must now explicitly register the builders plugin in your application, similar to how `createLX` is registered in `src/main.js`.

Example:
```js
myApp.use(createLxBuilders, {
  environment: 'local',
});
```

#### Package manager switch: pnpm → Bun

We have migrated from **pnpm** to **[Bun](https://bun.sh/) 1.3.14** as the package manager for LX/UI library. The `pnpm-lock.yaml` has been replaced with `bun.lock`.

If you are contributing to this project, refer to the [Development Guide](DEVELOPMENT.md) for updated install steps.

### Breaking changes

## 2.1.10 → 2.1.11

### Breaking changes

#### Inputs

**Token renames**

- `--color-input` → `--color-input-text`
- `--color-input-disabled` → `--color-input-text-disabled`
- `--color-input-disabled-background` → `--color-input-background-disabled`
- `--color-input-disabled-icon` → `--color-input-icon-disabled`
- `--color-input-selected-range-background` → `--color-input-background-selected`
- `--input-container-height` → `--input-height`
- `--input-container-width` → `--input-width-m`
- `--input-container-width-small` → `--input-width-s`
- `--input-container-width-large` → `--input-width-l`
- `--input-container-padding-left` → `--input-padding-left`
- `--input-container-padding-right` → `--input-padding-right`
- `--input-container-min-height-text-area` → `--input-text-area-min-height`
- `--input-container-padding-vertical-text-area` → `--input-text-area-padding-y` (previously `--space-0250`, now `--space-0500`)
- `--input-invalid-icon-size` → `--input-icon-invalid-size`
- `--input-invalid-icon-indent-left` → `--input-icon-invalid-indent-left`
- `--input-invalid-icon-indent-right` → `--input-icon-invalid-indent-right`

**Token removals**

- `--color-input-region-background` (`--color-region-2`)
- `--input-double-width-small` (use `calc(var(--input-width-s) * 2 + var(--space-0500))` instead)

The `--input-border`, `--input-border-bottom`, `--input-border-disabled` and `--input-border-bottom-disabled` tokens have been removed. Border styles are now split into `--input-border-width`, `--input-border-style`, and `--color-input-border`. Disabled inputs use `--color-input-border-disabled` for the border color.

## 2.1.8 → 2.1.9

### Breaking changes

#### LxModal

**Token renames**

- `--shadow-modal` → `--modal-shadow`
- `--modal-button-set-margin` → `--modal-footer-margin`
- `--modal-button-set-padding` → `--modal-footer-padding`
- `--modal-button-set-justify` → `--modal-button-set-justification`
- `--color-modal-button-set-background` → `--color-modal-footer-background`

The `--padding-modal` has been split into `--modal-content-padding` and `--modal-header-content-padding`.

## 2.1.7 → 2.1.8

### Breaking changes

#### LxToolbar

LxToolbar is now responsive and adapts to available space. Review all toolbars in your project to ensure layouts display correctly, especially in these components with built-in toolbars: 
- LxAppendableList
- LxCamera
- LxDataGrid
- LxDrawPad
- LxFileViewer
- LxList
- LxMap
- LxMarkdownTextArea
- LxQrScanner
- LxValuePicker.

#### LxContentSwitcher

**Token renames**

The `--content-switcher-alignment` token has been renamed to `--content-switcher-content-alignment`.

#### LxButton

**Token renames**
- `--*-text-align` → `--*-text-alignment`
- `--*-font-size` → `--*-text-font-size`
- `--*-font-weight` → `--*-text-font-weight`
- `--*-left-border-*` → `--*-border-left-*`

Button tokens have been renamed to follow a component-first convention. The prefix pattern has changed from `--button-{component}-*` to `--{component}-button-*`. This also applies to color tokens, following the same pattern - `--color-{component}-button-*`.

The order of property and state has been reversed in token names. For example, `--*-hover-border` is now `--*-border-hover`, and `--*-hover-background` is now `--*-background-hover`.

Color tokens that were used to color text now have a '-text' suffix added. For example, `--color-button-primary` is now `--color-button-primary-text`. The same applies to state tokens - `--color-button-primary-text-hover`, `--color-button-primary-text-disabled`, etc.

`LxDropDownMenu` buttons are now referred to as popover items, and `LxNavBar` buttons - as nav items, so these follow a different pattern as seen in the table below.

| Old prefix                     | New prefix                     |
|--------------------------------|--------------------------------|
| `--button-dropdown-*`          | `--popover-item-*`             |
| `--button-toolbar-*`           | `--toolbar-button-*`           |
| `--button-toolbar-selection-*` | `--toolbar-selection-button-*` |
| `--button-nav-*`               | `--nav-item-*`                 |
| `--button-nav-public-*`        | `--nav-public-item-*`          |
| `--button-modal-*`             | `--modal-button-*`             |

Find and replace each old prefix with its new counterpart in your token overrides and theme files. Most of the token names after the prefix are unchanged - only the prefix has changed.

**Token removals**
- `--button-icon-justify` (center)
- `--button-primary-align` (center)
- `--button-secondary-align` (center)
- `--button-tertiary-align` (center)
- `--button-ghost-align` (center)
- `--button-primary-margin` (0rem)
- `--button-secondary-margin` (0rem)
- `--button-tertiary-margin` (0rem)
- `--button-ghost-margin` (0rem)

Any `--*-align` (excluding `--*-text-align`) and `--*-margin` tokens under the renamed prefixes have also been removed.

For the full list of affected tokens, see the [design token documentation](docs/DesignTokens.md).

## 2.1.6 → 2.1.7

### Breaking changes

The `#userMenuButton` selector has been removed. Update any scripts, tests, or styles that depend on this ID.

#### LxBadge

Some LxBadge styles have been moved to a separate file - `lx-badges.css`. Import this file in your project to ensure correct badge appearance and behavior.

**Token & class removals**

The 'with-gap' class, as well as the `--color-badge-region-background` token, has been removed.

**Token renames**

- `--color-badge-text-color` → `--color-badge-text`
- `--badge-line-height` → `--badge-text-line-height`
- `--badge-border-radius` → `--badge-border-radius-s`
- `--badge-padding` → `--badge-padding-s`
- `--badge-min-width` → `--badge-min-width-s`
- `--badge-min-height` → `--badge-min-height-s`
- `--badge-gap` → `--badge-gap-s`

The `--color-badge-foreground` has been split into `--color-badge-text` and `--color-badge-icon`, with the default value being `--color-data`.

#### ViewBuilder changes

LxViewBuilder form section behavior has been unified.

You must now explicitly define the default section - it is no longer created automatically.
The first defined section will be treated as the default.

See the [ViewBuilder guide](/docs/ViewBuilder.md) for updated schema examples.

The schema and logic for LxFormBuilder and LxFilterBuilder have remained the same.

## 2.1.5 → 2.1.6

### Breaking changes

**Token removals**
- `--gap` (use `--space-1000` instead)
- `--content-padding` (8rem)
- `--content-padding-s` (use `--space-2000` instead)
- `--content-padding-l` (16rem)
- `--padding` (use `--space-0500` instead)
- `--padding-default` (use `--space-1000` instead)
- `--margin-default` (use `--space-0250` instead)
- `--button-icon-margin` (0 -0.4rem)

## 2.1.2 → 2.1.3

### Breaking changes

**Token renames**

- `--radius-default` → `--border-radius-default`

**Token removals**

- `--radius-1` (use `--border-radius-0250` instead)
- `--radius-2` (use `--border-radius-0500` instead)

#### LxAppendableList

The "Add record" button has moved from the bottom to the top of the list, now rendered inside a fully supported LxToolbar.

#### LxContentSwitcher

LxContentSwitcher styles have been moved to a separate file - `lx-content-switchers.css`. Import this file in your project to ensure correct content switcher appearance and behavior.

**Token renames**

The `--color-content-switcher-foreground` token has been split into `--color-content-switcher-text` and `--color-content-switcher-icon`, with the default value being `--color-data`.

**Class renames**
- `lx-content-switcher` → `lx-content-switcher-wrapper`
- `lx-content-switcher-grid` → `lx-content-switcher`
- `--content-switcher-height` → `--content-switcher-item-height`; container height is now derived from `--content-switcher-container-padding`

## 2.1.0 → 2.1.1

### Breaking changes

**Token renames**
- `--icon-size` → `--icon-size-l`
- `--toggle-s-width` → `--toggle-width-s`
- `--toggle-s-height` → `--toggle-height-s`

#### Icons

**Token renames**

Icon `height` and `width` tokens have been merged into a single `size` token. Update any usages to the new tokens listed below.

| Old tokens                                                                        | New token                              |
|-----------------------------------------------------------------------------------|----------------------------------------|
| `--list-icon-height`, `--list-icon-width`                                         | `--list-icon-size`                     |
| `--list-draggable-handle-icon-height`, `--list-draggable-handle-icon-width`       | `--list-draggable-handle-icon-size`    |
| `--tile-icon-height`, `--tile-icon-width`                                         | `--tile-icon-size`                     |
| `--data-block-icon-height`, `--data-block-icon-width`                             | `--data-block-icon-size`               |
| `--data-block-invalid-icon-height`, `--data-block-invalid-icon-width`             | `--data-block-invalid-icon-size`       |
| `--badge-icon-width`                                                              | `--badge-icon-size`                    |
| `--input-icon-height`, `--input-icon-width`                                       | `--input-icon-size`                    |
| `--input-invalid-icon-height`, `--input-invalid-icon-width`                       | `--input-icon-invalid-size`            |
| `--button-dropdown-icon-height`, `--button-dropdown-icon-width`                   | `--button-dropdown-icon-size`          |
| `--button-toolbar-primary-icon-height`, `--button-toolbar-primary-icon-width`     | `--button-toolbar-primary-icon-size`   |
| `--button-toolbar-secondary-icon-height`, `--button-toolbar-secondary-icon-width` | `--button-toolbar-secondary-icon-size` |
| `--button-toolbar-tertiary-icon-height`, `--button-toolbar-tertiary-icon-width`   | `--button-toolbar-tertiary-icon-size`  |
| `--button-toolbar-ghost-icon-height`, `--button-toolbar-ghost-icon-width`         | `--button-toolbar-ghost-icon-size`     |
| `--button-toolbar-selection-icon-height`, `--button-toolbar-selection-icon-width` | `--button-toolbar-selection-icon-size` |
| `--button-nav-icon-height`, `--button-nav-icon-width`                             | `--button-nav-icon-size`               |
| `--button-nav-public-icon-height`, `--button-nav-public-icon-width`               | `--button-nav-public-icon-size`        |
| `--button-primary-icon-height`, `--button-primary-icon-width`                     | `--button-primary-icon-size`           |
| `--button-secondary-icon-height`, `--button-secondary-icon-width`                 | `--button-secondary-icon-size`         |
| `--button-tertiary-icon-height`, `--button-tertiary-icon-width`                   | `--button-tertiary-icon-size`          |
| `--button-ghost-icon-height`, `--button-ghost-icon-width`                         | `--button-ghost-icon-size`             |
| `--loader-bar-indicator-height`, `--loader-bar-indicator-width`                   | `--loader-bar-indicator-size`          |
| `--loader-state-indicator-height-s`, `--loader-state-indicator-width-s`           | `--loader-state-indicator-size-s`      |

#### LxToggle

Most LxToggle styles have been moved to a separate file - `lx-toggles.css`. Import this file in your project to ensure correct toggle appearance and behavior.

**Token renames**

Some existing tokens have been divided into size-based (`m` / `s`) or state-based (`on` / `off`) variants.

| Old token                | New tokens                                                                                                                  |
|--------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `--toggle-border`        | `--toggle-border-m`, `--toggle-border-s`                                                                                    |
| `--toggle-width`         | `--toggle-width-m`, `--toggle-width-s`                                                                                      |
| `--toggle-height`        | `--toggle-height-m`, `--toggle-height-s`                                                                                    |
| `--toggle-border-radius` | `--toggle-border-radius-m`, `--toggle-border-radius-s`                                                                      |
| `--toggle-padding-right` | `--toggle-padding-right-m`, `--toggle-padding-right-s`                                                                      |
| `--toggle-thumb-width`   | `--toggle-thumb-width-off-m`, `--toggle-thumb-width-on-m`,<br>`--toggle-thumb-width-off-s`, `--toggle-thumb-width-on-s`     |
| `--toggle-thumb-height`  | `--toggle-thumb-height-off-m`, `--toggle-thumb-height-on-m`,<br>`--toggle-thumb-height-off-s`, `--toggle-thumb-height-on-s` |

**Token removals**
- `--toggle-border-invalid` (var(--border-width-2) solid transparent)
- `--toggle-padding-left-false` (0.165rem)
- `--toggle-padding-left-true` (1.7rem)
- `--toggle-indeterminate-padding-left` (0.935rem)
- `--toggle-indeterminate-padding-right` (0.935rem)
- `--toggle-s-indeterminate-padding-left` (0.625rem)
- `--toggle-s-indeterminate-padding-right` (0.625rem)
- `--toggle-s-padding-left-true` (1.075rem)
- `--toggle-label-readonly-margin` (0.4rem 0)
- `--toggle-text-margin-left` (0.5rem)
- `--toggle-checked-icon-position-left` (0.185rem)
- `--toggle-checked-icon-height` (use `--toggle-checkmark-size` instead)
- `--toggle-checked-icon-width` (use `--toggle-checkmark-size` instead)

Check for any unintended visual changes in toggles.

## 2.0.8 → 2.1

### Breaking changes

#### LxLogoDisplay

The default value of the `value` prop in `LxLogoDisplay` has changed from `zzdats` to `dativa`. If you rely on the previous default (`zzdats`), you must now set it explicitly.

## 2.0.5 → 2.0.6

### Breaking changes

#### LxList

Exposed functions `selectRows` and `cancelSelection` no longer accept `shouldFocus` parameter, because focus now returns to "Select all" button automatically without interfering with other focus events.

## 2.0.4 → 2.0.5

### Breaking changes

#### LxList

The `--list-icon-padding` token has been removed. Check for any layout shifts or visual misalignment in lists that include icons.

## 2.0.2 → 2.0.3

### Breaking changes

#### LxToolbar

By default, all actions and default slot content are placed on the right side when `area` is not specified in action definitions. This can be changed using the new `defaultArea` prop.

## 2.0.1 → 2.0.2

### Breaking changes

#### LxVisualPicker, LxDataVisualizer

In LxVisualPicker and LxDataVisualizer components with kind `latvia`, "Varakļānu novads" has been merged into "Madonas novads" to reflect the updated administrative map.

## 2.0 → 2.0.1

### Breaking changes

#### LxForm

Forms using the `indexType` prop with `tabs` or `wizard` values now require the `LxSection` component to be preloaded in order to work correctly.

These modes rely on `LxSection` internally for layout and structure.

```js
import { createLx, LxSection } from '@dativa-lv/lx-ui';

const myApp = createApp(App);

myApp.use(createLx, {
  ...
  preload: {
    components: [LxSection],
  },
});
```

#### LxShell

The component API has been updated to improve naming consistency and clarity.

**Event renames**
- `settingsClicked` → `settingsClick`

## ... → 2.0

See the [Migration Guide for older versions](https://github.com/dativa-lv/lx-ui/blob/main/docs/migrationArchive/0-2.md).