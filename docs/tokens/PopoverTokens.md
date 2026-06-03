# Popovers

[← Back to Design Tokens](../DesignTokens.md)

> **Note:** Some popover tokens use [LxButton and base button](./ButtonTokens.md) tokens as default values. Changes should be made with caution to avoid unintended effects.

## Layout

| Variable name                                 | Default value                           |
| --------------------------------------------- | --------------------------------------- |
| `--popover-item-border-radius-outer`          | `--border-radius-default`               |
| `--popover-item-border-radius-inner`          | `--border-radius-default`               |
| `--popover-item-border-radius-selected`       | `--border-radius-default`               |
| `--popover-item-text-font-size`               | `--button-text-font-size`               |
| `--popover-item-text-font-weight`             | `--button-text-font-weight`             |
| `--popover-item-text-alignment`               | `--button-text-alignment`               |
| `--popover-item-text-decoration`              | `--button-text-decoration`              |
| `--popover-item-gap`                          | `--space-0500`                          |
| `--popover-item-grid-areas`                   | 'content icon-toggle'                   |
| `--popover-item-grid-template-columns`        | 1fr auto                                |
| `--popover-item-grid-template-rows`           | `--button-grid-template-rows`           |
| `--popover-item-button-grid-areas`            | `--popover-item-grid-areas`             |
| `--popover-item-button-grid-template-columns` | `--popover-item-grid-template-columns`  |
| `--popover-item-button-grid-template-rows`    | `--popover-item-grid-template-rows`     |
| `--popover-item-toggle-grid-areas`            | `--popover-item-grid-areas`             |
| `--popover-item-toggle-grid-template-columns` | `--popover-item-grid-template-columns`  |
| `--popover-item-toggle-grid-template-rows`    | `--popover-item-grid-template-rows`     |
| `--popover-item-height`                       | `--row-size-dynamic`                    |
| `--popover-item-icon-size-s`                  | `--icon-size-s`                         |
| `--popover-item-icon-size-l`                  | `--icon-size-m`                         |
| `--popover-item-outline-offset`               | 0                                       |
| `--popover-item-padding-s`                    | `--space-0250` `--space-0750`           |
| `--popover-item-padding-l`                    | `--space-0750`                          |
| `--popover-item-set-gap`                      | `--space-0125`                          |
| `--popover-padding`                           | `--space-0250`                          |
| `--popover-border-width`                      | `--border-width-1`                      |
| `--popover-border-style`                      | solid                                   |
| `--popover-border-radius`                     | `--border-radius-0`                     |
| `--popover-divider-margin`                    | `--space-0`                             |
| `--popover-divider-height`                    | `--border-width-1`                      |
| `--popover-item-border-width`                 | `--border-width-0` `--border-width-2`   |
| `--popover-item-border-style`                 | solid                                   |
| `--popover-label-padding`                     | `--space-0500` `--space-0750`           |
| `--popover-label-font-size`                   | `--small-font-size`                     |
| `--popover-checkmark-inset-s`                 | `--space-0375` `--space-0750` auto auto |
| `--popover-checkmark-inset-l`                 | `--space-0750` `--space-0750` auto auto |
| `--popover-checkmark-size`                    | `--icon-size-s`                         |
| `--popover-checkmark-display`                 | none                                    |
| `--popover-item-tag-grid-areas`               | 'icon' 'text'                           |
| `--popover-item-tag-grid-template-columns`    | 1fr                                     |
| `--popover-item-tag-grid-template-rows`       | auto auto                               |
| `--popover-item-tag-set-margin`               | `--space-0500` `--space-0250`           |
| `--popover-item-tag-height`                   | 4rem                                    |
| `--popover-item-tag-icon-alignment`           | start                                   |
| `--popover-item-tag-text-alignment`           | start                                   |
| `--popover-item-tag-padding`                  | `--space-0500`                          |
| `--popover-item-tag-gap`                      | `--space-0250`                          |
| `--popover-item-tag-border-radius`            | `--border-radius-0`                     |
| `--popover-item-tag-border-width`             | `--border-width-2`                      |
| `--popover-item-tag-border-style`             | solid                                   |

## Color

| Variable name                              | Default value                                                 |
|--------------------------------------------|---------------------------------------------------------------|
| `--color-popover-item-text`                | `--color-data`                                                |
| `--color-popover-item-background`          | transparent                                                   |
| `--color-popover-item-border`              | `--color-popover-item-background`                             |
| `--color-popover-item-text-active`         | `--color-interactive-active-foreground`                       |
| `--color-popover-item-background-active`   | `--color-interactive-active-background`                       |
| `--color-popover-item-border-active`       | `--color-interactive-active-background`                       |
| `--color-popover-item-text-disabled`       | `--color-disabled-foreground`                                 |
| `--color-popover-item-background-disabled` | transparent                                                   |
| `--color-popover-item-border-disabled`     | transparent                                                   |
| `--color-popover-item-text-focus`          | `--color-data`                                                |
| `--color-popover-item-background-focus`    | transparent                                                   |
| `--color-popover-item-border-focus`        | transparent                                                   |
| `--color-popover-item-text-hover`          | `--color-data`                                                |
| `--color-popover-item-background-hover`    | `--color-region-hover`                                        |
| `--color-popover-item-border-hover`        | `--color-region-hover`                                        |
| `--color-popover-item-icon`                | `--color-data`                                                |
| `--color-popover-item-icon-active`         | `--color-interactive-active-foreground`                       |
| `--color-popover-item-icon-disabled`       | `--color-disabled-foreground`                                 |
| `--color-popover-item-icon-focus`          | `--color-data`                                                |
| `--color-popover-item-icon-hover`          | `--color-data`                                                |
| `--color-popover-item-icon-selected`       | `--color-selected`                                            |
| `--color-popover-item-text-selected`       | `--color-selected`                                            |
| `--color-popover-item-background-selected` | `--color-selected-background`                                 |
| `--color-popover-item-border-selected`     | transparent transparent transparent `--color-selected-border` |
| `--color-popover-border`                   | `--color-chrome`                                              |
| `--color-popover-divider`                  | `--color-chrome`                                              |
| `--color-popover-label`                    | `--color-label`                                               |
| `--color-popover-checkmark`                | `--color-brand`                                               |
| `--color-popover-item-tag-border`          | `--color-chrome`                                              |
| `--color-popover-item-tag-border-selected` | `--color-selected-border`                                     |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                     | Contrast mode value      |
|-----------------------------------|--------------------------|
| `--popover-border-width`          | `--border-width-2`       |
| `--color-popover-checkmark`       | `--contrast-background`  |
| `--color-popover-item-text`       | `--contrast-interactive` |
| `--color-popover-item-background` | `--contrast-background`  |
| `--color-popover-item-text-hover` | `--contrast-background`  |
| `--color-popover-item-icon-hover` | `--contrast-background`  |
