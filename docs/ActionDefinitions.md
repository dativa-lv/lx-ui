# Action Definitions

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


### Properties

`actionDefinitions` is an array of action definition objects. Each object can contain following properties:

| Property | Type | Description |
|----------|------|-------------|
| `id` | String | Unique identifier for the action. Used in event handlers to identify which action was triggered. |
| `name` | String | Label text displayed on the action button. Also used as fallback for accessibility labels. |
| `icon` | String | Icon identifier to display on the action button. Must exist in the specified icon set. |
| `iconSet` | String | Specifies which icon set to use. Allowed values: `cds`, `material`, `phosphor`, `brand`. |
| `title` | String | Tooltip text shown when hovering over the action button. |
| `kind` | String | Visual style and prominence of the action button. Allowed values: `primary`, `secondary`, `tertiary`, `ghost`, `additional`, `main`, `menuitem`, `toggle`, `slot`. |
| `variant` | String | Display variant for the action button. Controls whether the button shows both icon and label or just the icon. Allowed values: `default`, `icon-only`. |
| `visibleByAttribute` | String | Attribute name from the data object. Action is only visible when this attribute evaluates to true. |
| `enableByAttribute` | String | Attribute name from the data object. Action is only enabled when this attribute evaluates to true. |
| `groupId` | String | Identifier for grouping related actions together. |
| `nestedGroupId` | String | Identifier for turning this action into a dropdown menu trigger. Actions whose `groupId` matches this value will be rendered as items inside the dropdown menu. |
| `area` | String | Position where the action should be placed. Allowed values: `left`, `right`. |
| `customClass` | String | Custom CSS class name(s) to apply to the action button for additional styling. Multiple classes can be separated by spaces (e.g., `class-1 class-2`). |
| `badge` | String | Badge text or count to display on the action button. |
| `badgeType` | String | Visual style for the badge. Allowed values: `default`, `info`, `success`, `warning`, `error`. |
| `badgeIcon` | String | Icon identifier to display inside the badge instead of text. |
| `badgeTitle` | String | Accessibility label for the badge. Required when `badge` or `badgeIcon` is provided. |
| `destructive` | Boolean | Indicates a destructive action (e.g., delete). Applies warning styling. |
| `disabled` | Boolean | Disables the action button, preventing user interaction. |
| `busy` | Boolean | Shows busy state, typically disabling interaction while preserving visual context. |
| `loading` | Boolean | Shows loading indicator on the action button and disables interaction. |
| `active` | Boolean | Applies active/selected styling to indicate the action is currently active. |
| `nonResponsive` | Boolean | Prevents the action from being responsive. It will not collapse into overflow menus on smaller screens. |
| `builtIn` | Boolean | Reserved for internal framework use - do not set this property manually! (When `true`, the action is treated as built-in and will stay visible longer than other actions.) |
| `extra` | Boolean | Reserved for internal framework use - do not set this property manually! (When `true`, the action is treated as supplemental and placed after built-in actions.) |
| `priority` | Number | Order in responsive visibility queue. Lower numbers stay visible longer. Overrides the automatic type-based priority (dropdowns > toggles > regular actions). Supported only in toolbars. Allowed values: any positive integer. |
| `href` | Object | Route for navigation when the action is clicked. Converts the action into a link. Example: `{ name: 'info' }`. |

### Usage Details

`LxDataGrid -> columnDefinitions -> options`

The `LxDataGrid` component allows you to define `options` inside the `columnDefinitions` prop. You can now also add `actionDefinitions` inside `options`, using the standard properties defined for `actionDefinitions`.

Currently, this feature works only for columns of type `person`, and only the first item from the array is used. This makes it possible to add an action button to person-type columns.

The event is handled via `@actionClick` and returns the same payload as regular `actionDefinitions`.

