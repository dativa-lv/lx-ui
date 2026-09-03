# LxValuePicker, LxCheckbox, LxRadioButton

[← Back to Design Tokens](../DesignTokens.md)

Here you may find tokens for LxCheckbox and LxRadioButton as well as LxValuePicker `default`, `horizontal`, `indicator`,`tiles`, and `tags` variants.

## Shared across all LxValuePicker variants

### Layout

| Variable name                       | Default value  |
|-------------------------------------|----------------|
| `--value-picker-toolbar-gap-bottom` | `--space-0500` |

## Variant="default", variant="horizontal", LxCheckbox, LxRadioButton

> Note: `--selecting-block-*` tokens describe the wrapper around radio buttons and checkboxes, and are shared between the two.

### Layout

| Variable name                                | Default value              |
|----------------------------------------------|----------------------------|
| `--selecting-block-margin`                   | `--space-0500` `--space-0` |
| `--selecting-block-text-padding`             | `--space-0125` `--space-0` |
| `--selecting-block-text-primary-font-size`   | `--font-size`              |
| `--selecting-block-text-primary-font-weight` | `--font-weight`            |
| `--selecting-block-text-primary-line-height` | 1.25                       |
| `--selecting-block-width`                    | 1.5rem                     |
| `--selecting-block-height`                   | 1.5rem                     |
| `--selecting-block-gap`                      | `--space-0500`             |
| `--selecting-block-horizontal-width`         | `--row-size`               |
| `--selecting-block-horizontal-height`        | `--row-size`               |
| `--selecting-block-horizontal-gap`           | `--space-0500`             |
| `--selecting-block-horizontal-set-gap`       | `--space-0500`             |
| `--radio-button-height`                      | 1.25rem                    |
| `--radio-button-width`                       | 1.25rem                    |
| `--radio-button-border-width`                | `--border-width-1`         |
| `--radio-button-border-style`                | solid                      |
| `--radio-button-border-radius`               | `--border-radius-full`     |
| `--radio-button-thumb-height`                | 0.625rem                   |
| `--radio-button-thumb-width`                 | 0.625rem                   |
| `--radio-button-thumb-border-radius`         | `--border-radius-full`     |
| `--checkbox-height`                          | 1rem                       |
| `--checkbox-width`                           | 1rem                       |
| `--checkbox-border-width`                    | `--border-width-1`         |
| `--checkbox-border-style`                    | solid                      |
| `--checkbox-border-radius`                   | `--border-radius-0`        |
| `--checkbox-tick-size`                       | `--icon-size-m`            |

### Color

| Variable name                               | Default value                          |
|---------------------------------------------|----------------------------------------|
| `--color-selecting-block-text-primary`      | `--color-data`                         |
| `--color-selecting-block-text-secondary`    | `--color-label`                        |
| `--color-radio-button-background-off`       | transparent                            |
| `--color-radio-button-background-on`        | transparent                            |
| `--color-radio-button-border-off`           | `--color-data`                         |
| `--color-radio-button-border-on`            | `--color-data`                         |
| `--color-radio-button-thumb`                | `--color-data`                         |
| `--color-radio-button-background-hover-off` | `--color-interactive-hover-background` |
| `--color-radio-button-border-hover-off`     | transparent                            |
| `--color-radio-button-background-hover-on`  | `--color-interactive-hover-background` |
| `--color-radio-button-border-hover-on`      | transparent                            |
| `--color-radio-button-thumb-hover`          | `--color-interactive-hover-foreground` |
| `--color-checkbox-background-off`           | transparent                            |
| `--color-checkbox-background-on`            | `--color-data`                         |
| `--color-checkbox-border-off`               | `--color-data`                         |
| `--color-checkbox-border-on`                | `--color-data`                         |
| `--color-checkbox-tick`                     | `--color-region`                       |
| `--color-checkbox-background-hover-off`     | `--color-interactive-hover-background` |
| `--color-checkbox-border-hover-off`         | transparent                            |
| `--color-checkbox-background-hover-on`      | `--color-interactive-hover-background` |
| `--color-checkbox-border-hover-on`          | transparent                            |
| `--color-checkbox-tick-hover`               | `--color-interactive-hover-foreground` |


## Variant="indicator"

### Layout

| Variable name               | Default value       |
|-----------------------------|---------------------|
| `--indicator-width`         | 2.5rem              |
| `--indicator-height`        | 2.5rem              |
| `--indicator-border-radius` | `--border-radius-0` |
| `--indicator-border-width`  | `--border-width-2`  |
| `--indicator-border-style`  | solid               |
| `--indicator-icon-size`     | `--icon-size-m`     |
| `--indicator-set-gap`       | `--space-0250`      |

### Color

| Variable name                           | Default value                     |
|-----------------------------------------|-----------------------------------|
| `--color-indicator-border`              | `--color-data`                    |
| `--color-indicator-background`          | `--color-region`                  |
| `--color-indicator-icon`                | `--color-data`                    |
| `--color-indicator-background-hover`    | `--color-region-hover-background` |
| `--color-indicator-border-hover`        | `--color-brand`                   |
| `--color-indicator-icon-hover`          | `--color-data`                    |
| `--color-indicator-background-selected` | `--color-data`                    |
| `--color-indicator-border-selected`     | `--color-data`                    |
| `--color-indicator-icon-selected`       | `--color-region`                  |

## Variant="tiles"

### Layout

| Variable name                       | Default value        |
|-------------------------------------|----------------------|
| `--tile-height`                     | 12rem                |
| `--tile-width`                      | 20rem                |
| `--tile-border-radius`              | `--space-0`          |
| `--tile-set-gap`                    | `--space-0500`       |
| `--tile-row-gap`                    | `--space-1000`       |
| `--tile-column-gap`                 | `--space-1000`       |
| `--tile-text-primary-font-weight`   | `--font-weight-bold` |
| `--tile-text-primary-font-size`     | `--font-size`        |
| `--tile-text-primary-line-height`   | 1.5                  |
| `--tile-text-secondary-font-weight` | `--font-weight`      |
| `--tile-text-secondary-font-size`   | `--font-size-small`  |
| `--tile-text-secondary-line-height` | 1.286                |
| `--tile-padding`                    | `--space-1000`       |
| `--tile-border-width`               | `--border-width-2`   |
| `--tile-border-style`               | solid                |

### Color

| Variable name                          | Default value                     |
|----------------------------------------|-----------------------------------|
| `--color-tile-background`              | `--color-region`                  |
| `--color-tile-border`                  | `--color-chrome`                  |
| `--color-tile-text-primary`            | `--color-data`                    |
| `--color-tile-text-secondary`          | `--color-label`                   |
| `--color-tile-background-selected`     | `--color-selected-background`     |
| `--color-tile-border-selected`         | `--color-brand`                   |
| `--color-tile-text-primary-selected`   | `--color-selected`                |
| `--color-tile-text-secondary-selected` | `--color-selected`                |
| `--color-tile-background-hover`        | `--color-region-hover`            |
| `--color-tile-border-hover`            | `--color-chrome`                  |
| `--color-tile-text-primary-hover`      | `--color-region-hover-foreground` |
| `--color-tile-text-secondary-hover`    | `--color-region-hover-foreground` |

## Variant="tags"

### Layout

| Variable name            | Default value                 |
|--------------------------|-------------------------------|
| `--tag-height`           | auto                          |
| `--tag-width`            | auto                          |
| `--tag-border-radius`    | `--space-0`                   |
| `--tag-set-gap`          | `--space-0250`                |
| `--tag-text-font-weight` | `--font-weight`               |
| `--tag-text-font-size`   | `--font-size`                 |
| `--tag-text-line-height` | 1.5                           |
| `--tag-padding`          | `--space-0250` `--space-1000` |
| `--tag-border-width`     | `--border-width-2`            |
| `--tag-border-style`     | solid                         |

### Color

| Variable name                     | Default value                     |
|-----------------------------------|-----------------------------------|
| `--color-tag-background`          | `--color-region`                  |
| `--color-tag-border`              | `--color-chrome`                  |
| `--color-tag-text`                | `--color-data`                    |
| `--color-tag-background-selected` | `--color-selected-background`     |
| `--color-tag-border-selected`     | `--color-brand`                   |
| `--color-tag-text-selected`       | `--color-selected`                |
| `--color-tag-background-hover`    | `--color-region-hover`            |
| `--color-tag-border-hover`        | `--color-chrome`                  |
| `--color-tag-text-hover`          | `--color-region-hover-foreground` |
