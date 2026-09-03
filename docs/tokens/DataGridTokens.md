# LxDataGrid

[← Back to Design Tokens](../DesignTokens.md)

### Layout

| Variable name                                   | Default value                                 |
|-------------------------------------------------|-----------------------------------------------|
| `--data-grid-text-default-font-weight`          | `--font-weight`                               |
| `--data-grid-text-primary-font-weight`          | `--font-weight-bold`                          |
| `--data-grid-text-secondary-font-weight`        | `--font-weight`                               |
| `--data-grid-border-width`                      | `--border-width-0`                            |
| `--data-grid-border-style`                      | solid                                         |
| `--data-grid-border-radius`                     | `--border-radius-0`                           |
| `--data-grid-cell-padding`                      | `--space-0750` `--space-1000`                 |
| `--data-grid-cell-min-height`                   | 3rem                                          |
| `--data-grid-divider-border`                    | `--border-width-1` solid `--color-chrome`     |
| `--data-grid-action-set-padding`                | `--space-0`                                   |
| `--data-grid-action-set-gap`                    | `--space-0`                                   |
| `--data-grid-action-icon-size`                  | `--button-icon-size`                          |
| `--data-grid-action-border`                     | `--button-ghost-border`                       |
| `--data-grid-action-border-radius`              | `--button-border-radius`                      |
| `--data-grid-action-height`                     | 3rem                                          |
| `--data-grid-action-width`                      | 3rem                                          |
| `--data-grid-action-outline-offset`             | `--button-ghost-outline-offset`               |
| `--data-grid-footer-divider-border`             | `--border-width-1` solid `--color-chrome`     |
| `--data-grid-footer-divider-height`             | stretch                                       |
| `--data-grid-footer-button-icon-size`           | `--button-icon-size`                          |
| `--data-grid-footer-button-border`              | `--button-ghost-border`                       |
| `--data-grid-footer-button-border-radius`       | `--button-border-radius`                      |
| `--data-grid-footer-button-height`              | `--button-height`                             |
| `--data-grid-footer-button-width`               | `--button-width`                              |
| `--data-grid-footer-button-min-width`           | 5.5rem                                        |
| `--data-grid-footer-button-icon-only-width`     | `--button-icon-only-width`                    |
| `--data-grid-footer-button-icon-only-min-width` | `--button-icon-only-min-width`                |
| `--data-grid-footer-button-outline-offset`      | `--button-ghost-outline-offset`               |
| `--data-grid-footer-grid-template-columns`      | auto 1fr auto                                 |
| `--data-grid-footer-grid-areas`                 | 'count-selector count-display paging-buttons' |
| `--data-grid-column-header-icon-size`           | `--icon-size-s`                               |
| `--data-grid-column-header-padding`             | `--space-0`                                   |
| `--data-grid-column-header-cell-gap`            | `--space-0250`                                |
| `--data-grid-column-header-text-font-weight`    | `--font-weight`                               |
| `--data-grid-selecting-block-width`             | `--row-size`                                  |
| `--data-grid-selecting-block-height`            | `--row-size`                                  |
| `--data-grid-toolbar-gap-bottom`                | `--space-0`                                   |

### Color

| Variable name                                         | Default value                              |
|-------------------------------------------------------|--------------------------------------------|
| `--color-data-grid-border`                            | transparent                                |
| `--color-data-grid-background`                        | `--color-region`                           |
| `--color-data-grid-background-hover`                  | `--color-region-hover-background`          |
| `--color-data-grid-foreground-hover`                  | `--color-data`                             |
| `--color-data-grid-foreground-default`                | `--color-data`                             |
| `--color-data-grid-foreground-primary`                | `--color-data`                             |
| `--color-data-grid-foreground-secondary`              | `--color-label`                            |
| `--color-data-grid-header-background`                 | `--color-region`                           |
| `--color-data-grid-column-header-foreground`          | `--color-data`                             |
| `--color-data-grid-column-header-foreground-hover`    | `--color-data`                             |
| `--color-data-grid-column-header-background`          | `--color-chrome`                           |
| `--color-data-grid-column-header-background-hover`    | #d0d0d0                                  |
| `--color-data-grid-footer-background`                 | `--color-region`                           |
| `--color-data-grid-footer-text`                       | `--color-label`                            |
| `--color-data-grid-action-border-focus`               | `--color-button-ghost-border-focus`        |
| `--color-data-grid-action-border-hover`               | `--color-button-ghost-border-hover`        |
| `--color-data-grid-action-border-active`              | `--color-button-ghost-border-active`       |
| `--color-data-grid-action-border-disabled`            | `--color-button-ghost-border-disabled`     |
| `--color-data-grid-action-background`                 | `--color-button-ghost-background`          |
| `--color-data-grid-action-background-focus`           | `--color-button-ghost-background-focus`    |
| `--color-data-grid-action-background-hover`           | `--color-button-ghost-background-hover`    |
| `--color-data-grid-action-background-active`          | `--color-button-ghost-background-active`   |
| `--color-data-grid-action-background-disabled`        | `--color-button-ghost-background-disabled` |
| `--color-data-grid-action-icon`                       | `--color-data`                             |
| `--color-data-grid-action-icon-focus`                 | `--color-data`                             |
| `--color-data-grid-action-icon-hover`                 | `--color-button-ghost-icon-hover`          |
| `--color-data-grid-action-icon-active`                | `--color-button-ghost-icon-active`         |
| `--color-data-grid-action-icon-disabled`              | `--color-button-ghost-icon-disabled`       |
| `--color-data-grid-footer-button-border-focus`        | `--color-button-ghost-border-focus`        |
| `--color-data-grid-footer-button-border-hover`        | `--color-button-ghost-border-hover`        |
| `--color-data-grid-footer-button-border-active`       | `--color-button-ghost-border-active`       |
| `--color-data-grid-footer-button-border-disabled`     | `--color-button-ghost-border-disabled`     |
| `--color-data-grid-footer-button-background`          | `--color-button-ghost-background`          |
| `--color-data-grid-footer-button-background-focus`    | `--color-button-ghost-background-focus`    |
| `--color-data-grid-footer-button-background-hover`    | `--color-button-ghost-background-hover`    |
| `--color-data-grid-footer-button-background-active`   | `--color-button-ghost-background-active`   |
| `--color-data-grid-footer-button-background-disabled` | `--color-button-ghost-background-disabled` |
| `--color-data-grid-footer-button-text`                | `--color-data`                             |
| `--color-data-grid-footer-button-text-focus`          | `--color-data`                             |
| `--color-data-grid-footer-button-text-hover`          | `--color-button-ghost-text-hover`          |
| `--color-data-grid-footer-button-text-active`         | `--color-button-ghost-text-active`         |
| `--color-data-grid-footer-button-text-disabled`       | `--color-button-ghost-text-disabled`       |
| `--color-data-grid-footer-button-icon`                | `--color-data`                             |
| `--color-data-grid-footer-button-icon-focus`          | `--color-data`                             |
| `--color-data-grid-footer-button-icon-hover`          | `--color-button-ghost-icon-hover`          |
| `--color-data-grid-footer-button-icon-active`         | `--color-button-ghost-icon-active`         |
| `--color-data-grid-footer-button-icon-disabled`       | `--color-button-ghost-icon-disabled`       |

<br/>
Customized values for dark mode:
<br />
<br />

| Variable name                                      | Dark mode value |
|----------------------------------------------------|-----------------|
| `--color-data-grid-column-header-background-hover` | #252525       |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                                      | Contrast mode value     |
|----------------------------------------------------|-------------------------|
| `--color-data-grid-column-header-background-hover` | `--contrast-background` |
| `--color-data-grid-column-header-background`       | `--contrast-background` |
| `--color-data-grid-background-hover`               | `--contrast-hover`      |
| `--color-data-grid-foreground-hover`               | `--contrast-background` |
