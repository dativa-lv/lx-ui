# Inputs

[← Back to Design Tokens](../DesignTokens.md)

The following input components share these tokens as they are visually and functionally similar:

- LxTextInput
- LxAutoComplete
- LxValuePicker `variant='dropdown'`
- LxRotator
- LxDurationInput
- LxDateTimePicker
- LxDateTimeRange
- LxTextArea
- LxMarkdownTextArea
- LxDrawPad
- LxQrScanner
- LxCamera
- LxNumberInput

LxMarkdownTextArea, LxQrScanner, LxDrawPad and LxCamera are considered complex inputs - they have separate tokens but appear visually similar to other inputs and [complex displayers](./DisplayerTokens.md) (LxMap, LxFileViewer) by default. Both complex inputs and complex displayers use an [embedded toolbar](./ToolbarTokens.md).

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

### Number Input

| Variable name                                 | Default value                                                               |
|-----------------------------------------------|-----------------------------------------------------------------------------|
| `--input-slider-min-width`                    | 3rem                                                                        |
| `--input-slider-max-width`                    | 12.5rem                                                                     |
| `--input-slider-track-gap`                    | `--space-0`                                                                 |
| `--input-slider-stop-indicator-margin-right`  | `--space-0250`                                                              |
| `--input-slider-stop-indicator-width`         | 0.25rem                                                                     |
| `--input-slider-stop-indicator-height`        | 0.25rem                                                                     |
| `--input-slider-thumb-width`                  | 1rem                                                                        |
| `--input-slider-thumb-height`                 | 1rem                                                                        |
| `--input-slider-thumb-width-active`           | 1.25rem                                                                     |
| `--input-slider-thumb-height-active`          | 1.25rem                                                                     |
| `--input-slider-thumb-width-hover`            | 1.25rem                                                                     |
| `--input-slider-thumb-height-hover`           | 1.25rem                                                                     |
| `--input-slider-thumb-border-radius`          | `--border-radius-full`                                                      |
| `--input-slider-thumb-border-width`           | `--border-width-0`                                                          |
| `--input-slider-thumb-border-style`           | solid                                                                       |
| `--input-slider-track-height`                 | 0.25rem                                                                     |
| `--input-slider-track-unfilled-border-radius` | `--border-radius-0`                                                         |
| `--input-slider-track-filled-border-radius`   | `--border-radius-0`                                                         |
| `--input-slider-text-font-size`               | `--font-size`                                                               |
| `--input-slider-text-font-weight`             | `--font-weight`                                                             |
| `--input-slider-text-line-height`             | 1.5                                                                         |
| `--input-slider-gap`                          | `--space-0500`                                                              |
| `--input-stepper-grid-areas`                  | 'input button-decrease button-increase'                                     |
| `--input-stepper-grid-template-columns`       | 1fr auto auto                                                               |
| `--input-stepper-padding-right`               | calc(2 * `--input-button-width` + `--space-0250`)                           |
| `--input-stepper-padding-left`                | `--input-padding-left`                                                      |
| `--input-stepper-divider-height`              | 1.5rem                                                                      |
| `--input-stepper-divider-border`              | `--border-width-1` solid `--color-chrome`                                   |
| `--input-stepper-display-border-width`        | `--border-width-2` `--border-width-2` `--border-width-1` `--border-width-2` |
| `--input-stepper-display-border-style`        | `--input-border-style`                                                      |
| `--input-stepper-display-text-font-weight`    | `--font-weight-data`                                                        |


### Complex Input

| Variable name                           | Default value                                                               |
|-----------------------------------------|-----------------------------------------------------------------------------|
| `--input-complex-row-gap`               | `--space-0`                                                                 |
| `--input-complex-border-radius`         | `--border-radius-0`                                                         |
| `--input-complex-border-width`          | `--border-width-0` `--border-width-0` `--border-width-1` `--border-width-0` |
| `--input-complex-border-style`          | `--input-border-style`                                                      |
| `--input-complex-content-border-radius` | `--border-radius-0`                                                         |
| `--input-complex-content-border-width`  | `--border-width-0`                                                          |
| `--input-complex-content-border-style`  | solid                                                                       |

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
| `--color-input-button-border-active`       | `--color-button-ghost-border-active`                              |
| `--color-input-button-border-disabled`     | `--color-button-ghost-border-disabled`                            |
| `--color-input-button-background`          | `--color-button-ghost-background`                                 |
| `--color-input-button-background-focus`    | `--color-button-ghost-background-focus`                           |
| `--color-input-button-background-hover`    | `--color-button-ghost-background-hover`                           |
| `--color-input-button-background-active`   | `--color-button-ghost-background-active`                          |
| `--color-input-button-background-disabled` | `--color-button-ghost-background-disabled`                        |
| `--color-input-button-icon`                | `--color-data`                                                    |
| `--color-input-button-icon-focus`          | `--color-data`                                                    |
| `--color-input-button-icon-hover`          | `--color-button-ghost-icon-hover`                                 |
| `--color-input-button-icon-active`         | `--color-button-ghost-icon-active`                                |
| `--color-input-button-icon-disabled`       | `--color-button-ghost-icon-disabled`                              |

### Number Input

| Variable name                                       | Light value                                                       |
|-----------------------------------------------------|-------------------------------------------------------------------|
| `--color-input-slider-track-filled`                 | `--color-data`                                                    |
| `--color-input-slider-track-unfilled`               | `--color-chrome`                                                  |
| `--color-input-slider-track-filled-disabled`        | `--color-disabled-foreground`                                     |
| `--color-input-slider-track-unfilled-disabled`      | `--color-disabled-background`                                     |
| `--color-input-slider-track-filled-focus`           | `--color-interactive-background`                                  |
| `--color-input-slider-track-filled-active`          | `--color-interactive-background`                                  |
| `--color-input-slider-thumb`                        | `--color-data`                                                    |
| `--color-input-slider-thumb-border`                 | `--color-data`                                                    |
| `--color-input-slider-thumb-disabled`               | `--color-disabled-foreground`                                     |
| `--color-input-slider-thumb-border-disabled`        | `--color-disabled-foreground`                                     |
| `--color-input-slider-thumb-focus`                  | `--color-interactive-background`                                  |
| `--color-input-slider-thumb-border-focus`           | `--color-interactive-background`                                  |
| `--color-input-slider-thumb-active`                 | `--color-interactive-background`                                  |
| `--color-input-slider-thumb-border-active`          | `--color-interactive-background`                                  |
| `--color-input-slider-text`                         | `--color-data`                                                    |
| `--color-input-slider-text-disabled`                | `--color-disabled-foreground`                                     |
| `--color-input-slider-stop-indicator`               | transparent                                                       |
| `--color-input-slider-stop-indicator-disabled`      | transparent                                                       |
| `--color-input-stepper-display-border`              | transparent transparent `--color-chrome` transparent              |
| `--color-input-stepper-display-text`                | `--color-data`                                                    |
| `--color-input-stepper-display-background`          | transparent                                                       |
| `--color-input-stepper-display-border-disabled`     | transparent transparent `--color-disabled-foreground` transparent |
| `--color-input-stepper-display-background-disabled` | transparent                                                       |

### Complex Input

| Variable name                                       | Default value                       |
|-----------------------------------------------------|-------------------------------------|
| `--color-input-complex-background`                  | `--color-input-background`          |
| `--color-input-complex-content-background`          | transparent                         |
| `--color-input-complex-border`                      | `--color-input-border`              |
| `--color-input-complex-border-disabled`             | `--color-input-border-disabled`     |
| `--color-input-complex-content-border`              | transparent                         |
| `--color-input-complex-content-border-disabled`     | transparent                         |
| `--color-input-complex-background-disabled`         | `--color-input-background-disabled` |
| `--color-input-complex-content-background-disabled` | transparent                         |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                         | Contrast mode value     |
|---------------------------------------|-------------------------|
| `--input-border-width`                | `--border-width-2`      |
| `--color-input`                       | `--contrast-foreground` |
| `--color-input-disabled`              | `--contrast-foreground` |
| `--color-input-text-disabled`         | `--contrast-foreground` |
| `--color-input-background-selected`   | `--contrast-hover`      |
| `--color-input-slider-track-unfilled` | `--contrast-background` |
