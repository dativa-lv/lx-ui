# Action Definitions Guide

The prop `actionDefinitions` is available for following components:
- LxAppendableList
- LxCamera
- LxDataBlock
- LxDataGrid
- LxDataGrid -> columnDefinitions -> options
- LxDialog
- LxDrawPad
- LxDropDownMenu
- LxEmptyState
- LxErrorPage
- LxFileViewer
- LxForm
- LxInfoBox
- LxList
- LxListItem
- LxMap
- LxMarkdownTextArea
- LxModal
- LxModalForm
- LxQrScanner
- LxRow
- LxSection
- LxToolbar
- LxTreeItem
- LxTreeList
- LxWidget

The prop `toolbarActionDefinitions` is available for following components:
- LxAppendableList
- LxDataGrid
- LxList


The prop `selectionActionDefinitions` is available for following components:
- LxDataGrid
- LxList


### Properties

`actionDefinitions`, `toolbarActionDefinitions`, `selectionActionDefinitions` are an arrays of action definition objects. Each object can contain following properties:

| Property | Scope | Type | Description |
|----------|------|------|-------------|
| `id` | All | String | Unique identifier for the action. Used in event handlers to identify which action was triggered. |
| `name` | All | String | Label text displayed on the action button. Also used as fallback for accessibility labels. |
| `icon` | All | String | Icon identifier to display on the action button. Must exist in the specified icon set. |
| `iconSet` | All | String | Specifies which icon set to use. Allowed values: `cds`, `material`, `phosphor`, `brand`. |
| `title` | All | String | Tooltip text shown when hovering over the action button. |
| `kind` | All | String | Visual style and prominence of the action button. Allowed values: `primary`, `secondary`, `tertiary`, `ghost`, `additional`, `main`, `menuitem`, `toggle`, `slot`. |
| `variant` | All | String | Display variant for the action button. Controls whether the button shows both icon and label or just the icon. Allowed values: `default`, `icon-only`. |
| `visibleByAttribute` | **B** | String | Attribute name from the data object. Action is only visible when this attribute evaluates to true. |
| `enableByAttribute` | **B** | String | Attribute name from the data object. Action is only enabled when this attribute evaluates to true. |
| `groupId` | All | String | Identifier for grouping related actions together. |
| `nestedGroupId` | All | String | Identifier for turning this action into a dropdown menu trigger. Actions whose `groupId` matches this value will be rendered as items inside the dropdown menu. See [Nested actions](#nested-actions). |
| `area` | **A** | String | Position where the action should be placed. Allowed values: `left`, `right`. |
| `customClass` | All | String | Custom CSS class name(s) to apply to the action button for additional styling. Multiple classes can be separated by spaces (e.g., `class-1 class-2`). |
| `badge` | All | String | Badge text or count to display on the action button. |
| `badgeType` | All | String | Visual style for the badge. Allowed values: `default`, `info`, `success`, `warning`, `error`. |
| `badgeIcon` | All | String | Icon identifier to display inside the badge instead of text. |
| `badgeTitle` | All | String | Accessibility label for the badge. Required when `badge` or `badgeIcon` is provided. |
| `destructive` | All | Boolean | Indicates a destructive action (e.g., delete). Applies warning styling. |
| `disabled` | All | Boolean | Disables the action button, preventing user interaction. |
| `busy` | All | Boolean | Shows busy state, typically disabling interaction while preserving visual context. |
| `loading` | All | Boolean | Shows loading indicator on the action button and disables interaction. |
| `active` | All | Boolean | Applies active/selected styling to indicate the action is currently active. |
| `nonResponsive` | **A** | Boolean | Prevents the action from being responsive. It will not collapse into overflow menus on smaller screens. |
| `builtIn` | **A** | Boolean | Reserved for internal framework use - do not set this property manually! (When `true`, the action is treated as built-in and will stay visible longer than other actions.) |
| `extra` | **A** | Boolean | Reserved for internal framework use - do not set this property manually! (When `true`, the action is treated as supplemental and placed after built-in actions.) |
| `priority` | **A** | Number | Order in responsive visibility queue. Lower numbers stay visible longer. Overrides the automatic type-based priority (dropdowns > toggles > regular actions). Supported only in toolbars. Allowed values: any positive integer. |
| `href` | All | Object | Route for navigation when the action is clicked. Converts the action into a link. Example: `{ name: 'info' }`. |
| `value` | All | Boolean | Initial state value for toggle actions (kind: `toggle`). When `true`, the toggle is initially active. |

Groups:

**A**: 
- LxList `toolbarActionDefinitions`
- LxList `selectionActionDefinitions`
- LxDataGrid `toolbarActionDefinitions`
- LxDataGrid `selectionActionDefinitions`
- LxAppendableList `toolbarActionDefinitions`
- LxDrawPad `actionDefinitions`
- LxMap `actionDefinitions`
- LxMarkdownTextArea `actionDefinitions`
- LxCamera `actionDefinitions`
- LxQrScanner `actionDefinitions`

**B**:
- LxList `actionDefinitions`
- LxDataGrid `actionDefinitions`
- LxAppendableList `actionDefinitions`
- LxChat `messageActionDefinitions`


### Usage Details

`LxDataGrid -> columnDefinitions -> options`

The `LxDataGrid` component allows you to define `options` inside the `columnDefinitions` prop. You can now also add `actionDefinitions` inside `options`, using the standard properties defined for `actionDefinitions`.

Currently, this feature works only for columns of type `person`, and only the first item from the array is used. This makes it possible to add an action button to person-type columns.

The event is handled via `@actionClick` and returns the same payload as regular `actionDefinitions`.

### Action groups

Actions are added to a group with `groupId`. Groups can be defined in two ways:

- with `actionGroupDefinitions`, described below;
- inside `actionDefinitions`, with a trigger action that has `nestedGroupId` (see [Nested actions](#nested-actions)), and with `groupDefinitions` of `LxDropDownMenu` for group titles and kinds.

Starting from version 2.4, groups will be defined only with `actionGroupDefinitions`, and trigger actions with `nestedGroupId` and `groupDefinitions` of `LxDropDownMenu` will be removed. Use `actionGroupDefinitions` for new code.

Every component that accepts `actionDefinitions` also accepts `actionGroupDefinitions`. `LxDataGrid`, `LxList` and `LxAppendableList` also have `toolbarActionGroupDefinitions`, `LxDataGrid` and `LxList` have `selectionActionGroupDefinitions` and `emptyStateActionGroupDefinitions`. `LxChat` has `messageActionGroupDefinitions` and `typingActionGroupDefinitions`.

Each group definition can contain:

| Property | Type | Description |
|----------|------|-------------|
| `id` | String | Unique identifier of the group, referenced by `groupId` of actions and other groups. |
| `name` | String | Group title, shown as the section label in dropdown menus. |
| `area` | String | Toolbar area of the group: `left` or `right`. Actions with their own `area` keep it. |
| `nested` | Boolean | Shows the group as a dropdown menu with its actions. Ignored when the group has no actions. |
| `kind` | String | Group kind, the same as in `groupDefinitions` of `LxDropDownMenu`, for example `tags`. Button kinds are also used by the nested group trigger. |
| `groupId` | String | Places the group inside another group, for example a nested group next to other actions. |

A nested group is shown with its own `name`, `icon`, `iconSet`, `kind`, `title`, `disabled` and the other button properties, the same way as a trigger action with `nestedGroupId`.

- Groups follow the order of `actionGroupDefinitions`. Actions without a group, or with an unknown group, go last.
- Group titles are shown in dropdown menus.
- In toolbars, the group `area` places all of its actions.

```js
const actionGroupDefinitions = [
  { id: 'main' },
  { id: 'share', groupId: 'main', nested: true, name: 'Share', icon: 'share' },
  { id: 'more', name: 'More', area: 'left' },
];

const actionDefinitions = [
  { id: 'save', name: 'Save', icon: 'save', kind: 'primary', groupId: 'main' },
  { id: 'email', name: 'Send by email', icon: 'email', groupId: 'share' },
  { id: 'link', name: 'Copy link', icon: 'link', groupId: 'share' },
  { id: 'print', name: 'Print', icon: 'print', groupId: 'more' },
];
```

### Primary actions

Components show at most one action as primary: `LxToolbar` (and components with a toolbar) promotes the first primary action, `LxErrorPage` and `LxViewLayout` show further primary actions as secondary, and `LxModal`, `LxModalForm` and `LxDialog` show only the first one. `LxForm` is the exception and shows up to two primary actions.

### Nested actions

A nested group is defined with `nested: true` in `actionGroupDefinitions` (see [Action groups](#action-groups)), or with a trigger action that has `nestedGroupId`. Both work in every component that accepts actions:

```js
[
  { id: 'save', name: 'Save', icon: 'save', kind: 'primary' },
  { id: 'share', name: 'Share', icon: 'share', nestedGroupId: 'share' },
  { id: 'shareEmail', name: 'Send by email', icon: 'email', groupId: 'share' },
  { id: 'shareLink', name: 'Copy link', icon: 'link', groupId: 'share' },
]
```

`LxToolbar` renders the trigger as a dropdown menu with its children. Components that cannot render submenus skip the trigger and use its children instead:

- In dropdown menus (for example `LxDropDownMenu`, row menus in `LxList` and `LxDataGrid`, `⋮` menus in `LxWidget` or `LxSection`) the children are shown as their own group, the same way `LxToolbar` shows nested actions in its overflow menu.
- Components that show actions as separate buttons count the children instead of the trigger, so a trigger with a single child is shown as one button.
- Children inherit the trigger's `disabled`, `visibleByAttribute` and `enableByAttribute` unless they define their own.
- Components that place actions by `kind` (`LxForm`, `LxModal`, `LxModalForm`, `LxDialog`, `LxErrorPage`, `LxViewLayout`) also give the children the trigger's `kind`, so they appear where the trigger would be. Limits of the component still apply, for example `LxModal` shows only one primary and one secondary action.

The trigger is skipped only when other actions have a matching `groupId`. An action with `nestedGroupId` and no matching actions is rendered as a regular action.
