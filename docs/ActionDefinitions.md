# Action Definitions

The prop `actionDefinitions` is available for following components:
- LxAppendableList
- LxDataBlock
- LxDataGrid
- LxDialog
- LxDropDownMenu
- LxEmptyState
- LxErrorPage
- LxForm
- LxInfoBox
- LxList
- LxListItem
- LxModal
- LxModalForm
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
| `kind` | String | Visual style and prominence of the action button. Allowed values: `primary`, `secondary`, `tertiary`, `ghost`, `additional`, `main`, `menuitem`, `toggle`. |
| `variant` | String | Display variant for the action button. Allowed values: `default`, `icon-only`. Controls whether the button shows both icon and label or just the icon. |
| `visibleByAttribute` | String | Attribute name from the data object. Action is only visible when this attribute evaluates to true. |
| `enableByAttribute` | String | Attribute name from the data object. Action is only enabled when this attribute evaluates to true. |
| `groupId` | String | Identifier for grouping related actions together. **Note:** Currently only supported in LxDropDownMenu, LxForm, LxToolbar. |
| `area` | String | Position where the action should be placed. Allowed values: `left`, `right`. **Note:** Only supported in LxToolbar. |
| `customClass` | String | Custom CSS class name(s) to apply to the action button for additional styling. Multiple classes can be separated by spaces (e.g., `class-1 class-2`). |
| `href` | String | URL for navigation when the action is clicked. Converts the action into a link. |
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
