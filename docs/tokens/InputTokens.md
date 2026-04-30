# Inputs

[← Back to Design Tokens](../DesignTokens.md)

The following input components share these tokens as they are visually and functionally similar:

- LxTextInput
- LxAutoComplete
- LxDropDown
- LxValuePicker `variant='dropdown'`
- LxRotator
- LxDayInput
- LxDateTimePicker
- LxDateTimeRange
- LxTextArea
- LxMarkdownTextArea
- LxDrawPad

## Layout

| Variable name                                  | Default value                                                |
|------------------------------------------------|--------------------------------------------------------------|
| `--input-border`                               | var(--border-width-2) solid transparent                      |
| `--input-border-bottom`                        | var(--border-width-1) solid var(--color-label)               |
| `--input-border-disabled`                      | var(--border-width-2) solid transparent                      |
| `--input-border-bottom-disabled`               | var(--border-width-1) solid var(--color-disabled-foreground) |
| `--input-border-radius`                        | `--border-radius-0`                                          |
| `--input-button-border-radius`                 | `--border-radius-0`                                          |
| `--input-button-height`                        | 2.5rem                                                       |
| `--input-button-indent-left`                   | `--space-0`                                                  |
| `--input-button-indent-right`                  | `--input-icon-wrapper-width`                                 |
| `--input-button-width`                         | 2.5rem                                                       |
| `--input-container-width-large`                | 14rem                                                        |
| `--input-container-width-small`                | 10.5rem                                                      |
| `--input-container-double-width-small`         | 21.5rem                                                      |
| `--input-text-font-size`                       | `--font-size`                                                |
| `--input-text-font-weight`                     | 400                                                          |
| `--input-grid-areas`                           | 'tag input invalid-icon icon button'                         |
| `--input-grid-template-columns`                | auto 1fr auto auto auto                                      |
| `--input-container-height`                     | 2.5rem                                                       |
| `--input-icon-size`                            | `--icon-size-s`                                              |
| `--input-icon-indent-left`                     | `--space-0`                                                  |
| `--input-icon-indent-right`                    | `--input-icon-wrapper-width`                                 |
| `--input-icon-wrapper-height`                  | 100%                                                         |
| `--input-icon-wrapper-width`                   | `--input-button-width`                                       |
| `--input-invalid-icon-size`                    | `--icon-size-s`                                              |
| `--input-invalid-icon-indent-left`             | `--space-0`                                                  |
| `--input-invalid-icon-indent-right`            | `--input-icon-wrapper-width`                                 |
| `--input-container-padding-left`               | `--space-1000`                                               |
| `--input-container-padding-right`              | `--space-1000`                                               |
| `--input-tag-height`                           | 1.5rem                                                       |
| `--input-tag-indent-left`                      | calc(var(--input-tag-width) + var(--space-1000))             |
| `--input-tag-margin`                           | var(--space-0) var(--space-0500)                             |
| `--input-tag-indent-right`                     | `--space-0`                                                  |
| `--input-tag-width`                            | 2.75rem                                                      |
| `--input-container-min-height-text-area`       | 6rem                                                         |
| `--input-container-padding-vertical-text-area` | `--space-0250`                                               |
| `--input-container-width`                      | auto                                                         |

## Color

| Variable name                       | Default value                 |
|-------------------------------------|-------------------------------|
| `--color-input`                     | `--color-data`                |
| `--color-input-background`          | `--color-region`              |
| `--color-input-icon`                | `--color-label`               |
| `--color-input-disabled`            | `--color-disabled-foreground` |
| `--color-input-disabled-background` | transparent                   |
| `--color-input-disabled-icon`       | `--color-disabled-foreground` |
| `--color-input-region-background`   | `--color-region-2`            |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                    | Contrast mode value                                    |
|----------------------------------|--------------------------------------------------------|
| `--input-border`                 | var(--border-width-2) solid var(--contrast-foreground) |
| `--input-border-disabled`        | `--input-border`                                       |
| `--input-border-bottom`          | `--input-border`                                       |
| `--input-border-bottom-disabled` | `--input-border`                                       |
| `--color-input-disabled`         | `--contrast-foreground`                                |
| `--color-input-disabled-border`  | `--contrast-foreground`                                |
