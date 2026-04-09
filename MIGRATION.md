# LX/UI Migration Guide

## 2.1.0 → 2.1.1

### Breaking changes

**Token renames**
- `--icon-size` → `--icon-size-l`
- `--toggle-s-width` → `--toggle-width-s`
- `--toggle-s-height` → `--toggle-height-s`

#### Icons

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
| `--input-invalid-icon-height`, `--input-invalid-icon-width`                       | `--input-invalid-icon-size`            |
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

The following tokens have been removed:
- `--toggle-border-invalid`
- `--toggle-padding-left-false`
- `--toggle-padding-left-true`
- `--toggle-indeterminate-padding-left`
- `--toggle-indeterminate-padding-right`
- `--toggle-s-indeterminate-padding-left`
- `--toggle-s-indeterminate-padding-right`
- `--toggle-s-padding-left-true`
- `--toggle-label-readonly-margin`
- `--toggle-text-margin-left`
- `--toggle-checked-icon-position-left`
- `--toggle-checked-icon-height`
- `--toggle-checked-icon-width`

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

## 1.11 → 2.0

### Breaking changes

#### Namespace

We'll be using **`@dativa-lv/lx-ui`** instead of ~~`@wntr/lx-ui`~~ from now on (make sure to update your component, css and font imports).

#### LxButton

The `kind` prop has been updated to reduce redundant variants.

- `main` has been removed


#### LxTabControl

The component API has changed to clearly separate data input from selection state.

Before:
   - `value` was used to pass the full tab `items` list
   - selection could be triggered imperatively via `setActiveTab` exposed function

Now:
   - `items` is passed via a dedicated prop
   - `modelValue` represents the selected item id
   - selection is controlled declaratively via `v-model`


#### LxMasterDetail, LxRating

The component API has been simplified by replacing the mode prop with a more explicit boolean.

**Prop changes**
- `mode` (removed) — previously accepted `'edit' | 'read'`
- `readOnly` (added) — `Boolean`, defaults to `false`

Before:
```js
<LxMasterDetail mode="read" />
<LxRating mode="read" />
```

Now:
```js
<LxMasterDetail :readOnly="true" />
<LxRating :readOnly="true" />
```


#### LxDataBlock, LxAppendableList

The component API has been updated to improve naming consistency and clarity.

**Prop renames**
- `forceUppercase` -> `uppercase`

#### LxDropDown, LxAutoComplete

The `variant` and `locale` prop has been removed.

Custom rendering should now be used to represent different item types such as state, country, or other visual variants.

```js
<LxDropDown v-model="dropdownModel" :items="items">
 <!-- State -->
  <template #customItem="{ id, name, displayType, displayShape }">
    <LxStateDisplay
      :value="id"
      :dictionary="[
        {
          value: id,
          displayName: name,
          displayType: displayType,
          displayShape: displayShape,
        },
      ]"
    />
  </template>


<!-- Country -->
 <template #customItem="{ name, country }">
   <div class="lx-item-display lx-aligned-row">
     <LxFlag :value="country" size="s" locale="lv" />
     <span class="lx-data">{{ name }}</span>
   </div>
 </template>
</LxDropDown>
```


#### LxShell

The component API has been updated to improve naming consistency and clarity.

**Event renames**
- `confirmModalClosed` → `confirmModalClose`
- `languageChanged` → `languageChange`
- `contextPersonChanged` → `contextPersonChange`
- `alternativeProfileChanged` → `alternativeProfileChange`

The `v-model` prop controlling animation preferences has been renamed and its semantics updated to reflect reduced-motion behavior.

- `v-model:hasAnimations` → `v-model:hasReducedAnimations`

Before:
```js
<LxShell v-model:hasAnimations="animationsEnabled" />
```
After:
```js
<LxShell v-model:hasReducedAnimations="prefersReducedMotion" />
```

**Texts prop changes**
`texts` prop badgeType attribute naming updated:
- `texts.badgeTypes.important` → `texts.badgeTypes.error`
- `texts.badgeTypes.good` → `texts.badgeTypes.success`

#### LxButton, LxExpander, LxFilterBuilder, LxFilter, LxSection, LxTile, LxShell

The `badgeType` prop values have been updated to use standardized identifiers.

- `good` → `success`
- `important` → `error`


#### LxDialog, LxModalForm

The component API has been updated to improve naming consistency and clarity.

**Event renames**
- `closed` → `close`


#### LxModal

The component API has been updated to improve naming consistency and clarity.

**Event renames**
- `closed` → `close`

**Event removed**
- `primaryAction`
- `secondaryAction`

**Props added**
- `texts`

**Props removed**
- `buttonPrimaryVisible`
- `buttonPrimaryLoading`
- `buttonPrimaryBusy`
- `buttonPrimaryLabel`
- `buttonPrimaryDisabled`
- `buttonPrimaryIsDestructive`
- `buttonSecondaryVisible`
- `buttonSecondaryLoading`
- `buttonSecondaryBusy`
- `buttonSecondaryLabel`
- `buttonCloseLabel`

Use `actionDefinitions` prop to [define action buttons](docs/ActionDefinitions.md) instead.

To edit the close button label text change `texts` prop `close` attribute.


#### LxMap

The component API has been updated to improve naming consistency and clarity.

**Event renames**
- `searched` → `search`


#### LxDataGrid

The component API has been updated to improve naming consistency and clarity.

**Event renames**
- `selectionActionClicked` → `selectionActionClick`
- `toolbarActionClicked` → `toolbarActionClick`
- `sortingChanged` → `sortingChange`
- `itemsPerPageChanged` → `itemsPerPageChange`
- `selectionChanged` → `selectionChange`
- `searched` → `search`


#### LxCamera

The component API has been updated to improve naming consistency and clarity.

**Event renames**
- `actionClicked` → `actionClick`


#### LxEmptyState

The component API has been updated to improve naming consistency and clarity.

**Event renames**
- `emptyStateActionClick` → `actionClick`


#### LxDropDownMenu

LxDropDownMenu `actionDefinitions` `group` attribute has been renamed to `groupId`.


#### LxAutoComplete, LxList, LxDataBlock, LxDataGrid, LxAppendableList, LxVisualPicker, LxFormBuilder schema

The component API has been updated to improve naming consistency and clarity.

**Prop renames**
- `selectingKind` → `selectionKind`


#### LxValuePicker, LxQrScanner, LxFileUploader

The component API has been updated to improve naming consistency and clarity.

**Prop renames**
- `kind` → `selectionKind`


#### LxMasterDetail

The component API has changed to clearly separate data input from selection state.

Before:
   - `modelValue` was used to pass the full `items` list
   - selection could be triggered imperatively via `selectItem` exposed function
   - selection was tracked via a `selectionChanged` event

```js
<LxMasterDetail
  ref="masterDetails" // selectItem(id);
  v-model="items"
  @selectionChanged="handleSelectionChange"
/>
```

Now:
   - `items` is passed via a dedicated prop
   - `modelValue` represents the selected item id
   - selection is controlled declaratively via `v-model`

```js
<LxMasterDetail
  v-model="selectedItem"
  :items="items"
/>
```


#### LxFilters

LxFilter default `kind` is no longer supported. Therefore, `kind` prop have been removed.

The form `kind`, that uses LxForm, should be used from now on.

If your LxFilters components has div elements with _lx-column_ or _lx-row_ classes in default slots, they must be remade to use LxRow components.


#### LxAppendableList

LxAppendableList `addButtonLabel` prop have been removed. To edit the text change `texts` prop `addButtonLabel` attribute.

```js
{
  addButtonLabel: "Add item" 
}
```

#### LxList 

The component API has been updated to improve naming consistency and clarity.

**Event renames**
- `selectionChanged` → `selectionChange`
- `searched` → `search`

**Prop renames**
- `primaryAttribute` → `nameAttribute`
- `secondaryAttribute` → `descriptionAttribute`


#### LxModalForm

The component `slots` has been renamed to follow camelCase convention:

**Slot renames**
- `pre-header` → `preHeader`
- `pre-header-info` → `preHeaderInfo`
- `post-header` → `postHeader`
- `post-header-info` → `postHeaderInfo`


#### LxForm

The component API has been updated to improve naming consistency and clarity.

**Slot renames**
- `pre-header` → `preHeader`
- `pre-header-info` → `preHeaderInfo`
- `post-header` → `postHeader`
- `post-header-info` → `postHeaderInfo`
- `header-additional` → `headerAdditional`

**Event renames**
- `buttonClick` → `actionClick`


#### LxRatings

The `LxRatings` component has been renamed to **LxRating**.


#### LxFlag

The `size` prop values have been updated to use short, standardized identifiers.

- `small` → `s`
- `normal` → `m`
- `big` → `l`


#### LxDropDownMenu

`openMenu` function signature change:

```js
// Before:
openMenu(source?: string)
// Now:
openMenu(options?: { source?: string, focus?: string })
```

Examples:

```js
// Before:
openMenu('mouse')
// Now:
openMenu({ source: 'keyboard', focus: 'last' })
```

`closeMenu` function signature change:

```js
// Before:
closeMenu(source?: string)
// Now:
closeMenu(options?: { source?: string })
```

Examples:

```js
// Before:
closeMenu('keyboard')
// Now:
closeMenu({ source: 'keyboard' })
```


#### LxButton

The `kind` prop now accepts new value `menuitem`, which should be used for buttons defined inside LxDropDownMenu.


#### Builders

All previous listed changes affects builders aswell.
Update the schemas accordingly to this migration guide and updated FormBuilder documentation.


### Other changes

#### lx-form styles

_lx-form_ css styles are no longer supported.
LxForm component must be used for form creation.

#### LxAccessibilitySettings

There is now a setting customization button in the accessibility and theme menu. This button is **non-optional** and **must** have a dedicated view, which renders the `LxAccessibilitySettings` component and is exposed via a route (e.g. `/accessibility-settings`). 

Pressing the button emits `settingsClick`, which must be handled to navigate to the view. For example:

```js
<LxShell
  @settingsClick="router.push({ name: 'accessibilitySettings' })"
/>
```

## 1.10 → 1.11

### Breaking changes

#### LxDataBlock custom header styles

Due to the refactoring of LxDataBlock styles, some custom header styles may have shifted, including sizing of icons, text and alignment. Check any custom LxDataBlock, LxAppendableList and small-screen LxDataGrid styles and adjust them where necessary.

#### LxDialog new default kind value

The default value of the `kind` prop in `LxDialog` has been changed from `default` to `question`.

#### confirmStore now uses LxDialog component

confirmStore now uses LxDialog component instead of LxModal.

The overall appearance remains similar — the main difference is that the dialog now includes an illustration.

`question` illustration is used by default, however if confirmStore is displaying message that is not a question, different `kind` should be used.

Available `kind` prop options:
- `question`
- `info`
- `warning`
- `error`
- `success`

`kind` can be set using confirmStore `push` or `pushSimple` confirmStore functions.

Examples:
```js
confirmStore.pushSimple('Do you want to leave without saving?', null, primaryAction, 'question');

confirmStore.pushSimple('Are you sure you want to delete this item?', 'This action cannot be undone', primaryAction, 'warning');
```

#### LxDataGrid behavior on large screens

LxDataGrid will now stretch beyond the main content column on screens 1921px and wider, when both the `scrollable` and `showAllColumns` props are enabled.

To disable this behavior, set the `fullBleed` prop to `false`.

#### LxInfoWrapper open/close delay

The `openDelay` and `closeDelay` props have been **removed**.  
Instead, `LxInfoWrapper` now uses a **fixed hover delay of 100ms** for opening and closing the popper.  

## 1.9 → 1.10

### Breaking changes

#### LxDropDownMenu tabindex

The default slot button inside LxDropDownMenu should use `tabindex="-1"` since the LxDropDownMenu itself is focusable.
```js
<LxDropDownMenu>
	<LxButton :tabindex="-1"/>
</LxDropDownMenu>
```

#### Disabling LxDropDownMenu

The way LxDropDownMenu components are disabled has changed.

Before the dropdown could be disabled by disabling only the button inside it:
```js
<LxDropDownMenu>
	<LxButton :disabled="true"/>
</LxDropDownMenu>
```
Now both the LxDropDownMenu and the LxButton must be disabled explicitly:
```js
<LxDropDownMenu :disabled="true">
	<LxButton :disabled="true"/>
</LxDropDownMenu>
```

#### Builder changes

##### Builder LxRow actionDefinitions

Changed the way `actionDefinitions` can be defined for LxRow. Use `rowActionDefinitions` instead of `actionDefinitions`.

```js
{
  properties: {
    firstName: {
      type: 'string',
      lx: {
        rowActionDefinitions: [
          {
            id: 'open',
            name: 'Open',
            icon: 'open', 
          }
        ]
      }
    }
  }
}
```

##### Builder LxDataGrid emits

Builder LxDataGrid emits have been standardized to match other component emits.

#### LxAutoComplete, LxDropDownMenu, LxDropDown, LxInfoWrapper, LxDateTimePicker, LxDateTimeRange, LxValuePicker :variant='dropdown' 

**Inner LxPopper component is now rendered via `Teleport`** instead of using `position: fixed` inside the component tree.  
Popper content is moved to the root container (`#poppers`) rather than staying within its parent context.  
This ensures correct layering when used inside modals or other high-level containers. 
If your project has **custom CSS overrides targeting `.popper` or its children**, these styles may no longer work as expected.  

#### LxAutoComplete and LxDropDown

Removed `dictionary` prop, instead you should directly pass the `displayType` and `displayShape` into items prop how it is with other values

#### changes to toolbar configuration in LxList & LxDataGrid

If you previously used custom styles or layout inside the toolbar slot (slot="toolbar"), please review your implementation to ensure nothing is broken in the new version. Custom toolbar setups may no longer render correctly without adjustments.

A new approach for defining toolbar buttons has been introduced via toolbarActions. This method simplifies the configuration of actions and provides additional flexibility — buttons can now also be placed on the left side of the toolbar.
 
### vue update

We have upgraded the `vue` version used for our library to `3.5.17`. Improved render and reactivity performance. Added minor optimizations and fixed bugs for more stable application behavior.

### removed vue3-click-away

We no longer use the `vue3-click-away` library
instead, we use the built-in `onClickOutside` from `@vueuse/core`.
In your projects, if you are not using `vue3-click-away`, it is recommended to remove its import from `main.js`.

## 1.8 → 1.9

### viewStore goBack value

The default value of `goBack` in `viewStore` has been changed to `null`. Make sure to update any checks that relied on it being `false`.

### LxWidget actions prop

LxWidget `actions` prop has been renamed to `actionDefinitions`.

LxWidget `actionDefinitions` `isDestructive` attribute has been renamed to `destructive`.

LxWidget `actionClick` emit now returns actions id, so make sure it is defined.

### removed slots

The components `LxAutoComplete`, `LxButton`, and `LxDropDown` no longer have a default slot.

### LxShell theme

LxShell `theme` prop has been removed. 

It is no longer possible to set the selected theme from code, however the theme selection should work automatically.

### customHeader slots

Unified slot prop structure: customHeader (in LxAppendableList) and customExpanderHeader (in LxList) slots now receive props as a single object e.g. { item, expanded }, improving consistency and enabling access to the expanded state.

If you previously used the `customExpanderHeader` or `customHeader` slot like this:  
```js  
<template #customExpanderHeader="item">  
```  
you now need to update it to:  
```js  
<template #customExpanderHeader="{ item }">  
```

### pnpm update

We have upgraded the pnpm version used for our library to `10.7.0`. To ensure smooth dependency management and avoid potential compatibility issues, we recommend that all users verify their pnpm version and update it accordingly.

To check your current pnpm version, use:
```sh
pnpm -v
```

If you manage pnpm globally, update it with:
```sh
npm install -g pnpm@10.7.0
```

If you prefer to update pnpm only for one project, modify your `package.json` to specify the required version:
```json
{
  "packageManager": "pnpm@10.7.0"
}
```

To ensure dependencies update correctly and resolve potential lockfile changes, run:
```sh
pnpm i
```

## 1.7 → 1.8

### Layout changes

In the effort of making styles and theming more customizable and accessible, some components have their layouts and styles changed. Normally, you wouldn't notice a difference, but if you're using locally copied components, you might get surprised.

Affected components:
- LxButton;
- LxShell;

### Breaking changes

#### LxFileViewer

- `resolution` prop no longer supported.


#### vue-i18n

If your project uses the latest versions of the `vue-i18n` library, make sure to carefully check the correctness of translations with variables, such as here [AutoComplete.vue](https://github.com/wntrtech/lx-ui/blob/main/src/components/AutoComplete.vue)  
and here [Shell.vue](https://github.com/wntrtech/lx-ui/blob/main/src/components/shell/Shell.vue).  

Some projects have reported that when passing text via translation into a prop, if the text contains curly braces (e.g., `{0}` or `{count}`), they are replaced with an empty value.  

In such cases, it is recommended to use variables. For example, instead of:  

```js
texts: {
    ...
    tryEndingWith1: translate.t('pages.autocomplete.try1')
    ...
}
```
Use: 
```js
texts: {
    ...
    tryEndingWith1: translate.t('pages.autocomplete.try1', ['{0}'])
    ...
}
```
Or other options (see the list [here](https://vue-i18n.intlify.dev/guide/essentials/syntax) Vue I18n Syntax ).

This will replace the variable correctly in the component resolving the issue.



## 1.6 → 1.7


### Layout changes

In the effort of making styles and theming more customizable and accessible, some components have their layouts and styles changed. Normally, you wouldn't notice a difference, but if you're using locally copied components, you might get surprised.

Affected components:
- LxList;
- LxButton;
- LxDataGrid;
- Virtually every input:
  - LxTextInput;
  - LxAutoComplete;
  - LxDropDown;
  - LxValuePicker (`dropdown' variant);
  - LxRotator;
  - LxDayInput;
  - LxDateTimePicker;
  - LxDateTimeRange;
  - LxTextArea;
  - LxMarkdownTextArea;
  - LxDrawPad;

### Breaking changes

#### LxDateTimePicker

- You should use `lx-date-pickers.css` file instead of ~~`lx-calendars.css`~~.

#### LxPersonDisplay

- `kind` prop no longer supported.

#### LxContentSwitcher

- `changed` event no longer supported.

#### LxMasterDetail

- `label` prop no longer supported.
- `description` prop no longer supported.
- `newLabel` prop no longer supported. Use `texts` prop's `add` attribute instead.
- `placeHolder` prop no longer supported.
- `level` prop no longer supported.
- `dragAndDrop` prop no longer supported.
- `invalidItems` prop no longer supported. Define invalid items using `modelValue` and `invalidAttribute` props.

## 1.5 → 1.6

### Navbar for public LxShell

LxShell `public` mode has a navbar enabled by default. If you want to go back to it being hidden, make sure to add `:hideNavBar="true"` to `LxShell`.

### Layout changes

Since we've updated styles for semantic HTML, if for some weird reason you were using `.lx-article` as your View's root element, styles will break. Please, use `.lx-article` only for text articles (like privacy policy, help or terms & conditions), not for interactive views.

### LxValuePicker, LxList

Numerical values of `id` attributes in `items` are now represented as strings. Consider updating your implementation to handle IDs as strings rather than numbers.

### LxAutoComplete

`idAttribute` attribute supported type changes: `Array of Strings` or `String` changed to just `String`.

## 1.3 → 1.5

### Namespace

Starting 1.5 we're using different namespace for LX/UI library.

We'll be using **`@wntr/lx-ui`** instead of ~~`@zzdats/lx-ui`~~ from now on (make sure to update your css and font imports, which are probably in your `main.js` and `vite.config.js`). Other than that - no breaking changes.

### Date format

We've also changed default date format from "dd.MM.yyyy" to "dd.MM.yyyy." (in accordance to [Latvian law](https://likumi.lv/ta/id/301436#p15)). If, for any reason, you want to change it back, you can always use LX globals (most likely, in your `main.js`), like so:

```js
myApp.use(createLx, {
  dateFormat: 'dd.MM.yyyy',
  dateTimeFormat: 'dd.MM.yyyy HH:mm',
  dateTimeFullFormat: 'dd.MM.yyyy HH:mm:ss',
});
```

### List item grouping

LxList items that have no groups defined, will be shown ungrouped by default (previously, they were not rendered at all). If for some reason you want the old behavior back - try assigning them groups that aren't defined in `group-definitions`.

## 1.2 → 1.3

### Prop changes

#### LxQrScanner

- `fileUploader` changed to `hasFileUploader`

### Some HTML changes

To make LX/UI more compliant to Semantic Web Guidelines, we've changed markup for some components. If you're not using local copies of the components, it should be all fine. If you are, check the list below for possible breaking changes.

#### LxDataBlock

- `<main>` changed to `<div class="lx-main">`

#### LxDataGrid

- `<label>` changed to `<p class="lx-primary">`
- `div` changed to `article`

#### LxExpander

- `<div class="lx-body">` changed to `<article class="lx-body">`

#### LxForm

- `<main>` changed to `<div class="lx-main">`
- `<label>` changed to `<p class="lx-description">`

#### LxHeader

- `<label>` changed to `<p class="lx-primary"`
- `<label class="lx-description">` changed to `<p class="lx-description"`

#### LxMap

- `<label class="lx-menu-label">` changed to `<p class="lx-menu-label">`

#### LxMarkdownTextArea

- `<label>` changed to `<p class="lx-description">`

#### LxModal

- `<main>` changed to `<article class="lx-main">`
- `<label>` changed to `<p class="lx-primary">`

#### LxStateDisplay

- `<label>` changed to `<p class="lx-primary">`

#### LxSteps

- `<label>` changed to `<p class="lx-description">`

#### LxTabControl

- `<label>` changed to `<p class="lx-primary">`
- `<div class="lx-tab-body">` changed to `<article class="lx-tab-body">`

#### LxTile

- `<main>` changed to `<article class="lx-main">`
- `<label>` changed to `<p class="lx-primary">`

#### LxWidget

- `<main>` changed to `<article class="lx-main">`

---

## 1.1 → 1.2

### Using themes

Make sure you import `'@zzdats/lx-ui/dist/styles/lx-ut-carbon-dark.css';` **and** `'@zzdats/lx-ui/dist/styles/lx-ut-carbon-contrast.css';`, as well as set `systemId` parameter in `createLx` for themes to work properly.

All themes come in a bundle, if deciding to use LX theming, you should implement all three of those (`light`, `dark` and `contrast`).

### Notable changes

#### LxShell

LxShell now displays alerts in `cover` mode by default (but only if they're defined).

If you want to use alerts only in the non-cover mode's header, but not in `cover`, make sure to leave `:alerts` prop empty when navigating to `/`!

### Breaking changes

#### LxDataGrid

- `actionDefinitions` changes:
  - `enableByAttributeName` changed to `enableByAttribute`

#### LxList

- `groupDefinitions` changes:
  - `expander` changed to `expanded`

---

## 1.0 → 1.1

### createLX

Make sure you're using [`myApp.use(createLx)`](src/main.js) in your project. A lot of future changes will require settings from this call.

### Using themes

Make sure you import `'@zzdats/lx-ui/dist/styles/lx-ut-carbon-dark.css';` and set `systemId` parameter in `createLx` for themes to work properly.

### Breaking changes

Make sure you don't use `:root` styles in your local styles and use `.lx` instead. You probably don't, but just in case, make sure 🙂. We've made some global style architecture changes, it might break something if you haven't been using LX styles properly before.

Sadly, we've also missed some breaking changes when updating to 1.0. Here are some of the missing ones. Hopefully, that's it for now:

**LxErrorPage**

- `actionDefinitions` changes:
  - `actionName` changed to `id`
  - `label` changed to `name`
  - `isDestructive` changed to `destructive`
  - `isDisabled` changed to `disabled`

**LxForm**

- `actionDefinitions` changes:
  - `actionName` changed to `id`
  - `label` changed to `name`

**LxList:**

- `groupDefinitions` changes:
  - `code` changed to `id`

**LxListItem** (only if you're using it standalone. If not - LxList takes care of that)

- `data` changed to `value`

**LxShell**

- `systemNameFormatted` functionality added. If defined, this prop will be used as portal cover heading instead of `systemName`. If `systemNameFormatted` was previously defined, then cover heading will be changed. Please, make sure that the desired text is displayed!!!

---

## 0.4 → 1.0

For every ongoing project, please consider migrating to 1.0, as this will be the version that will be maintained starting November 1, 2023.

### Prop naming changes

**LxContentSwitcher:**

- `idAttribute` default value changed from `code` to `id`
- `nameAttribute` default value changed from `displayName` to `name`

**LxDataBlock**

- `actionDefinitions` changes:
  - `actionName` changed to `id`
  - `label` changed to `name`
  - `isDestructive` changed to `destructive`

**LxDataGrid:**

- `rowIdAttributeName` with default value `code` changed to `idAttribute` with default value `id`
- `columnDefinitions` changes:
  - `code` changed to `id`
  - `displayName` changed to `name`
- `value` changed to `items`
- `actionDefinitions` changes:
  - `actionName` changed to `id`
  - `label` changed to `name`
  - `isDestructive` changed to `destructive`

**LxFilters:**

- `fastIdAttribute` with default value `id` added. Can be used for fast filters
- `fastNameAttribute` with default value `name` added. Can be used for fast filters

**LxFlag:**

- `country` changed to `value`

**LxIcon:**

- `icon` changed to `value`
- `class` changed to `customClass`

**LxList:**

- `modelValue` changed to `items`
- `itemIdAttributeName` with default value `code` changed to `idAttribute` with default value `id`
- `itemPrimaryAttributeName` changed to `primaryAttribute`
- `itemSecondaryAttributeName` changed to `secondaryAttribute`
- `itemHrefAttributeName` changed to `hrefAttribute`
- `itemGroupAttributeName` changed to `groupAttribute`
- `itemClickableAttributeName` changed to `clickableAttribute`
- `itemIconAttributeName` changed to `iconAttribute`
- `itemIconSetAttributeName` changed to `iconSetAttribute`
- `itemTooltipAttributeName` changed to `tooltipAttribute`
- `itemCategoryAttributeName` changed to `categoryAttribute`
- `actionDefinitions` changes:
  - `actionName` changed to `id`
  - `label` changed to `name`
  - `isDestructive` changed to `destructive`

**LxListItem**

- `actionDefinitions` changes:
  - `actionName` changed to `id`
  - `label` changed to `name`
  - `isDestructive` changed to `destructive`

**LxMasterDetail:**

- `idAttribute` with default value `id` added
- `nameAttribute` with default value `name` added
- `descriptionAttribute` with default value _null_ added

**LxSteps:**

- `codeAttribute` with default value `code` changed to `idAttribute` with default value `id`

**LxValuePicker:**

- `alwaysAsArray` default value changed to `false` from `true`

### Changes to importing styles

Starting v1.0 lx/styles library is obsolete, if you're using `lx-ui@1.0.0` and up, you should use lx/ui styles.

To do that,

1. Change your imports (usually in `main.js`) to use `@zzdats/lx-ui/dist/styles/`, like so:

```js
import '@zzdats/lx-ui/dist/styles/lx-reset.css';
import '@zzdats/lx-ui/dist/styles/lx-fonts-carbon.css';
import '@zzdats/lx-ui/dist/styles/lx-pt-carbon.css';
import '@zzdats/lx-ui/dist/styles/lx-ut-carbon-light.css';

import '@zzdats/lx-ui/dist/styles/lx-buttons.css';
import '@zzdats/lx-ui/dist/styles/lx-data-grid.css';
import '@zzdats/lx-ui/dist/styles/lx-inputs.css';
import '@zzdats/lx-ui/dist/styles/lx-steps.css';
import '@zzdats/lx-ui/dist/styles/lx-forms.css';
import '@zzdats/lx-ui/dist/styles/lx-notifications.css';
import '@zzdats/lx-ui/dist/styles/lx-modal.css';
import '@zzdats/lx-ui/dist/styles/lx-loaders.css';
import '@zzdats/lx-ui/dist/styles/lx-lists.css';
import '@zzdats/lx-ui/dist/styles/lx-expanders.css';
import '@zzdats/lx-ui/dist/styles/lx-tabs.css';
import '@zzdats/lx-ui/dist/styles/lx-animations.css';
import '@zzdats/lx-ui/dist/styles/lx-master-detail.css';
import '@zzdats/lx-ui/dist/styles/lx-ratings.css';

import '@zzdats/lx-ui/dist/styles/lx-shell-grid.css';
import '@zzdats/lx-ui/dist/styles/lx-shell-grid-public.css';
import '@zzdats/lx-ui/dist/styles/lx-forms-grid.css';

import '@/assets/lx-pt-demo.css'; /* use your product theme file here */
```

2. Update your `vite.config.js` to use `@zzdats/lx-ui/dist/lx-fonts`, like so:

```js
  resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '/lx-fonts': fileURLToPath(
          new URL('./node_modules/@zzdats/lx-ui/dist/lx-fonts', import.meta.url)
        ),
      },
    },
```

### Other changes

**LxTextInput:**

- `mask="password"` removed
- `kind="password"` added

---

## 0.X.X → 1.0.X

To migrate to 1.0, please, migrate to 0.4 first.

## 0.X.X → 0.4.X

If you can't afford to migrate to 1.0, please consider updating to 0.4.

Breaking changes from your Beta version to Beta 0.4 should be solved case-by-case, there is no guide.
