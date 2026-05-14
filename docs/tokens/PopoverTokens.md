# Popovers

[← Back to Design Tokens](../DesignTokens.md)

> **Note:** Some popover tokens use [LxButton and base button](./ButtonTokens.md) tokens as default values. Changes should be made with caution to avoid unintended effects.

## Layout

| Variable name                          | Default value                                                    |
|----------------------------------------|------------------------------------------------------------------|
| `--popover-item-align`                 | center                                                           |
| `--popover-item-border`                | var(--border-width-2) solid var(--color-popover-item-background) |
| `--popover-item-border-radius`         | `--border-radius-default`                                        |
| `--popover-item-text-font-size`        | inherit                                                          |
| `--popover-item-text-font-weight`      | `--font-weight-interactive`                                      |
| `--popover-item-text-align`            | left                                                             |
| `--popover-item-text-decoration`       | none                                                             |
| `--popover-item-gap`                   | `--space-0750`                                                   |
| `--popover-item-grid-areas`            | 'content icon'                                                   |
| `--popover-item-grid-template-columns` | 1fr auto                                                         |
| `--popover-item-grid-template-rows`    | 1fr                                                              |
| `--popover-item-height`                | `--row-size-dynamic`                                             |
| `--popover-item-icon-size`             | `--icon-size-m`                                                  |
| `--popover-item-min-width`             | `--row-size`                                                     |
| `--popover-item-outline-offset`        | -2px                                                             |
| `--popover-item-padding`               | var(--space-0) calc(var(--space-1000) - var(--border-width-2))   |
| `--popover-item-set-gap`               | `--space-0125`                                                   |
| `--popover-item-width`                 | 100%                                                             |

## Color

| Variable name                              | Default value                            |
|--------------------------------------------|------------------------------------------|
| `--color-popover-item-text`                | `--color-data`                           |
| `--color-popover-item-background`          | transparent                              |
| `--color-popover-item-text-active`         | `--color-interactive-active-foreground`  |
| `--color-popover-item-background-active`   | `--color-interactive-active-background`  |
| `--color-popover-item-border-active`       | `--color-popover-item-background-active` |
| `--color-popover-item-text-disabled`       | `--color-disabled-foreground`            |
| `--color-popover-item-background-disabled` | transparent                              |
| `--color-popover-item-border-disabled`     | transparent                              |
| `--color-popover-item-text-focus`          | `--color-data`                           |
| `--color-popover-item-background-focus`    | `--color-popover-item-background`        |
| `--color-popover-item-border-focus`        | `--color-popover-item-background-focus`  |
| `--color-popover-item-text-hover`          | `--color-data`                           |
| `--color-popover-item-background-hover`    | `--color-region-hover`                   |
| `--color-popover-item-border-hover`        | `--color-popover-item-background-hover`  |
| `--color-popover-item-icon`                | `--color-popover-item-text`              |
| `--color-popover-item-icon-active`         | `--color-interactive-active-foreground`  |
| `--color-popover-item-icon-disabled`       | `--color-disabled-foreground`            |
| `--color-popover-item-icon-focus`          | `--color-popover-item-text-focus`        |
| `--color-popover-item-icon-hover`          | `--color-popover-item-text-hover`        |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                     | Contrast mode value      |
|-----------------------------------|--------------------------|
| `--color-popover-item-text`       | `--contrast-interactive` |
| `--color-popover-item-background` | `--contrast-background`  |
| `--color-popover-item-text-focus` | `--contrast-background`  |
| `--color-popover-item-text-hover` | `--contrast-background`  |
