# LxList

[← Back to Design Tokens](../DesignTokens.md)

## Layout

| Variable name                                     | Default value                                                 |
|---------------------------------------------------|---------------------------------------------------------------|
| `--list-button-outline-offset`                    | -2px                                                          |
| `--list-button-icon-size`                         | `--button-icon-size`                                          |
| `--list-button-border`                            | `--button-ghost-border`                                       |
| `--list-button-border-radius`                     | `--button-border-radius`                                      |
| `--list-button-max-height`                        | `--row-size`                                                  |
| `--list-button-width`                             | `--row-size`                                                  |
| `--list-category-border-radius`                   | `--border-radius-0`                                           |
| `--list-category-margin`                          | `--space-0250`                                                |
| `--list-category-width`                           | 0.25rem                                                       |
| `--list-icon-size`                                | `--icon-size-m`                                               |
| `--list-icon-wrapper-max-height`                  | `--list-button-max-height`                                    |
| `--list-icon-wrapper-width`                       | `--list-button-width`                                         |
| `--list-item-min-height`                          | `--row-size`                                                  |
| `--list-item-gap`                                 | `--space-0500`                                                |
| `--list-item-header-padding`                      | 0.25rem 0.35rem 0.2rem 0.25rem                                |
| `--list-item-header-min-height`                   | 2.75rem                                                       |
| `--list-item-border-width`                        | `--border-width-2`                                            |
| `--list-item-border-style`                        | `solid`                                                       |
| `--list-item-inner-border-radius`                 | `--border-radius-0`                                           |
| `--list-item-outer-border-radius`                 | `--border-radius-0`                                           |
| `--list-item-header-inner-border-radius`          | `--list-item-inner-border-radius`                             |
| `--list-item-header-outer-border-radius`          | `--list-item-outer-border-radius`                             |
| `--list-item-inner-border-radius-selected`        | `--border-radius-0`                                           |
| `--list-item-outer-border-radius-selected`        | `--border-radius-0`                                           |
| `--list-item-header-inner-border-radius-selected` | `--list-item-inner-border-radius-selected`                    |
| `--list-item-header-outer-border-radius-selected` | `--list-item-inner-border-radius-selected`                    |
| `--list-item-loader-padding`                      | `--space-1000` `--space-0` `--space-0` `--space-0`            |
| `--list-item-selecting-block-padding`             | `--space-1000` `--space-0` `--space-0` `--space-0`            |
| `--list-item-width`                               | auto                                                          |
| `--list-grid-areas`                               | 'category content invalid-icon icon loader actions selecting' |
| `--list-grid-inner-column-span`                   | 1 / span 4                                                    |
| `--list-grid-outer-column-span`                   | 1 / span 6                                                    |
| `--list-grid-template-columns`                    | auto 1fr auto auto auto auto auto                             |
| `--list-text-primary-font-size`                   | `--font-size`                                                 |
| `--list-text-primary-font-weight`                 | `--font-weight-bold`                                          |
| `--list-text-primary-line-height`                 | 1.2em                                                         |
| `--list-text-primary-margin`                      | -0.1rem 0 0 0                                                 |
| `--list-text-primary-padding`                     | 0.1rem 0 0.1rem 0                                             |
| `--list-text-secondary-font-size`                 | `--font-size-small`                                           |
| `--list-text-secondary-font-weight`               | `--font-weight-description`                                   |
| `--list-text-secondary-line-height`               | 1.2em                                                         |
| `--list-text-secondary-margin`                    | -0.15rem 0 -0.05rem 0                                         |
| `--list-text-secondary-padding`                   | 0.1rem 0 0.05rem 0                                            |
| `--list-draggable-grid-areas`                     | 'handle category content icon actions'                        |
| `--list-draggable-grid-inner-column-span`         | 1 / span 3                                                    |
| `--list-draggable-grid-outer-column-span`         | 2 / span 4                                                    |
| `--list-draggable-grid-template-columns`          | auto auto 1fr auto auto                                       |
| `--list-draggable-handle-icon-size`               | `--icon-size-l`                                               |
| `--list-draggable-handle-width`                   | `--row-size`                                                  |
| `--list-treelist-expander-height`                 | `--row-size`                                                  |
| `--list-treelist-expander-width`                  | `--row-size`                                                  |
| `--list-treelist-grid-areas`                      | 'expander treelist-content'                                   |
| `--list-treelist-grid-template-columns`           | auto 1fr                                                      |
| `--list-treelist-indent-left`                     | `--row-size`                                                  |
| `--list-treelist-indent-right`                    | `--space-0`                                                   |
| `--list-treelist-indent-child-left`               | `--row-size`                                                  |
| `--list-treelist-indent-child-right`              | `--space-0`                                                   |
| `--list-selecting-block-width`                    | `--row-size`                                                  |
| `--list-selecting-block-height`                   | `--row-size`                                                  |

## Color

| Variable name                              | Default value                              |
|--------------------------------------------|--------------------------------------------|
| `--color-list-item-border`                 | `transparent`                              |
| `--color-list-item-background`             | `--color-region`                           |
| `--color-list-draggable-handle-icon`       | `--color-label`                            |
| `--color-list-draggable-handle-icon-hover` | `--color-region-hover-foreground`          |
| `--color-list-item-background-hover`       | `--color-region-hover-background`          |
| `--color-list-icon`                        | `--color-data`                             |
| `--color-list-icon-hover`                  | `--color-region-hover-foreground`          |
| `--color-list-text-primary`                | `--color-data`                             |
| `--color-list-text-primary-hover`          | `--color-region-hover-foreground`          |
| `--color-list-text-secondary`              | `--color-label`                            |
| `--color-list-text-secondary-hover`        | `--color-region-hover-foreground`          |
| `--color-list-button-background`           | `--color-button-ghost-background`          |
| `--color-list-button-background-focus`     | `--color-button-ghost-background-focus`    |
| `--color-list-button-background-hover`     | `--color-button-ghost-background-hover`    |
| `--color-list-button-background-active`    | `--color-button-ghost-background-active`   |
| `--color-list-button-background-disabled`  | `--color-button-ghost-background-disabled` |
| `--color-list-button-icon`                 | `--color-data`                             |
| `--color-list-button-icon-focus`           | `--color-data`                             |
| `--color-list-button-icon-hover`           | `--color-button-ghost-icon-hover`          |
| `--color-list-button-icon-active`          | `--color-button-ghost-icon-active`         |
| `--color-list-button-icon-disabled`        | `--color-button-ghost-icon-disabled`       |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                         | Contrast mode value     |
|---------------------------------------|-------------------------|
| `--color-list-item-border`            | `--contrast-foreground` |
