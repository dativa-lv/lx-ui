# Inputs

[← Back to Design Tokens](../DesignTokens.md)

The following input components share these tokens as they are visually and functionally similar:

- LxTextInput
- LxAutoComplete
- LxValuePicker `variant='dropdown'`
- LxRotator
- LxDayInput
- LxDateTimePicker
- LxDateTimeRange
- LxTextArea
- LxMarkdownTextArea
- LxDrawPad

## Layout

| Variable name                       | Default value                                                               |
|-------------------------------------|-----------------------------------------------------------------------------|
| `--input-border-width`              | `--border-width-2` `--border-width-2` `--border-width-1` `--border-width-2` |
| `--input-border-style`              | solid                                                                       |
| `--input-border-radius`             | `--border-radius-0`                                                         |
| `--input-height`                    | 2.5rem                                                                      |
| `--input-padding-left`              | `--space-1000`                                                              |
| `--input-padding-right`             | `--space-1000`                                                              |
| `--input-width-s`                   | 10.5rem                                                                     |
| `--input-width-m`                   | auto                                                                        |
| `--input-width-l`                   | 14rem                                                                       |
| `--input-grid-areas`                | 'tag input invalid-icon icon button'                                        |
| `--input-grid-template-columns`     | auto 1fr auto auto auto                                                     |
| `--input-icon-size`                 | `--icon-size-s`                                                             |
| `--input-icon-indent-left`          | `--space-0`                                                                 |
| `--input-icon-indent-right`         | `--input-icon-wrapper-width`                                                |
| `--input-icon-wrapper-height`       | 100%                                                                        |
| `--input-icon-wrapper-width`        | `--input-button-width`                                                      |
| `--input-icon-invalid-size`         | `--icon-size-s`                                                             |
| `--input-icon-invalid-indent-left`  | `--space-0`                                                                 |
| `--input-icon-invalid-indent-right` | `--input-icon-wrapper-width`                                                |
| `--input-text-font-size`            | `--font-size`                                                               |
| `--input-text-font-weight`          | `--font-weight`                                                             |
| `--input-text-line-height`          | 1.5                                                                         |
| `--input-button-border`             | `--button-ghost-border`                                                     |
| `--input-button-outline-offset`     | `--button-ghost-outline-offset`                                             |
| `--input-button-border-radius`      | `--border-radius-0`                                                         |
| `--input-button-height`             | 2.5rem                                                                      |
| `--input-button-indent-left`        | `--space-0`                                                                 |
| `--input-button-indent-right`       | `--input-icon-wrapper-width`                                                |
| `--input-button-width`              | 2.5rem                                                                      |
| `--input-button-icon-size`          | `--button-ghost-icon-size`                                                  |
| `--input-tag-height`                | 1.5rem                                                                      |
| `--input-tag-width`                 | 2.75rem                                                                     |
| `--input-tag-indent-left`           | calc(`--input-tag-width` + `--space-1000`)                                  |
| `--input-tag-indent-right`          | `--space-0`                                                                 |
| `--input-tag-margin`                | `--space-0` `--space-0500`                                                  |
| `--input-text-area-padding-y`       | `--space-0500`                                                              |
| `--input-text-area-min-height`      | 6rem                                                                        |

## Color

| Variable name                              | Default value                                                     |
|--------------------------------------------|-------------------------------------------------------------------|
| `--color-input-border`                     | transparent transparent `--color-label` transparent               |
| `--color-input-border-disabled`            | transparent transparent `--color-disabled-foreground` transparent |
| `--color-input-text`                       | `--color-data`                                                    |
| `--color-input-background`                 | `--color-region`                                                  |
| `--color-input-icon`                       | `--color-label`                                                   |
| `--color-input-icon-interactive`           | `--color-data`                                                    |
| `--color-input-text-disabled`              | `--color-disabled-foreground`                                     |
| `--color-input-background-disabled`        | transparent                                                       |
| `--color-input-icon-disabled`              | `--color-disabled-foreground`                                     |
| `--color-input-background-selected`        | `--color-highlight`                                               |
| `--color-input-button-border`              | `--color-button-ghost-border`                                     |
| `--color-input-button-border-focus`        | `--color-button-ghost-border-focus`                               |
| `--color-input-button-border-hover`        | `--color-button-ghost-border-hover`                               |
| `--color-input-button-border-disabled`     | `--color-button-ghost-border-disabled`                            |
| `--color-input-button-background`          | `--color-button-ghost-background`                                 |
| `--color-input-button-background-focus`    | `--color-button-ghost-background-focus`                           |
| `--color-input-button-background-hover`    | `--color-button-ghost-background-hover`                           |
| `--color-input-button-background-disabled` | `--color-button-ghost-background-disabled`                        |
| `--color-input-button-icon`                | `--color-data`                                                    |
| `--color-input-button-icon-focus`          | `--color-data`                                                    |
| `--color-input-button-icon-hover`          | `--color-button-ghost-icon-hover`                                 |
| `--color-input-button-icon-disabled`       | `--color-button-ghost-icon-disabled`                              |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                    | Contrast mode value                              |
|----------------------------------|--------------------------------------------------|
| `--input-border`                 | `--border-width-2` solid `--contrast-foreground` |
| `--input-border-disabled`        | `--input-border`                                 |
| `--input-border-bottom`          | `--input-border`                                 |
| `--input-border-bottom-disabled` | `--input-border`                                 |
| `--color-input-disabled`         | `--contrast-foreground`                          |
| `--color-input-disabled-border`  | `--contrast-foreground`                          |
