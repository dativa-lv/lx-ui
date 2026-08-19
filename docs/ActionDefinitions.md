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
| `nestedGroupId` | **A** | String | Identifier for turning this action into a dropdown menu trigger. Actions whose `groupId` matches this value will be rendered as items inside the dropdown menu. |
| `area` | **A** | String | Position where the action should be placed. Allowed values: `left`, `right`. |
| `customClass` | All | String | Custom CSS class name(s) to apply to the action button for additional styling. Multiple classes can be separated by spaces (e.g., `class-1 class-2`). |
| `badge` | All | String | Badge text or count to display on the action button. |
| `badgeType` | All | String | Visual style for the badge. Allowed values: `default`, `info`, `success`, `warning`, `error`. |
| `badgeIcon` | All | String | Icon identifier to display inside the badge instead of text. |
| `badgeTitle` | All | String | Accessibility label for the badge. Required when `badge` or `badgeIcon` is provided. |
| `destructive` | All | Boolean | Indicates a destructive action (e.g., delete). Applies warning styling. |
| `disabled` | All | Boolean | Disables the action button, preventing user interaction. |
| `busy` | All | Boolean | Shows busy state, typically disabling interaction while preserving visual context. |
| `loading` | All| Boolean | Shows loading indicator on the action button and disables interaction. |
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

