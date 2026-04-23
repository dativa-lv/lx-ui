# LxList

[← Back to Design Tokens](../DesignTokens.md)

## Layout

| Variable name                             | Default value                                                 |
|-------------------------------------------|---------------------------------------------------------------|
| `--list-button-border-radius`             | `--border-radius-0`                                           |
| `--list-button-max-height`                | `--row-size`                                                  |
| `--list-button-width`                     | `--row-size`                                                  |
| `--list-category-border-radius`           | 0                                                             |
| `--list-category-margin`                  | 0.25rem                                                       |
| `--list-category-width`                   | 0.25rem                                                       |
| `--list-item-border`                      | 2px solid transparent                                         |
| `--list-item-border-radius`               | `--border-radius-0`                                           |
| `--list-item-border-radius-inner`         | `--list-item-border-radius`                                   |
| `--list-item-gap`                         | 0.5rem                                                        |
| `--list-item-header-padding`              | 0.35rem 0.35rem 0.2rem 0.25rem                                |
| `--list-item-header-min-height`           | 2.75rem                                                       |
| `--list-icon-size`                        | `--icon-size-m`                                               |
| `--list-item-loader-padding`              | 0.85rem 1rem 0 1rem                                           |
| `--list-item-selecting-block-padding`     | 0.8rem 0.95rem 0 0.95rem                                      |
| `--list-item-width`                       | auto                                                          |
| `--list-item-min-height`                  | `--row-size`                                                  |
| `--list-grid-areas`                       | 'category content invalid-icon icon loader actions selecting' |
| `--list-grid-template-columns`            | auto 1fr auto auto auto auto auto                             |
| `--list-grid-inner-column-span`           | 1 / span 4                                                    |
| `--list-grid-outer-column-span`           | 1 / span 6                                                    |
| `--list-text-primary-font-size`           | `--font-size`                                                 |
| `--list-text-primary-font-weight`         | bold                                                          |
| `--list-text-primary-line-height`         | 1.2em                                                         |
| `--list-text-primary-margin`              | -0.1rem 0 0 0                                                 |
| `--list-text-primary-padding`             | 0.1rem 0 0.1rem 0                                             |
| `--list-text-secondary-font-size`         | `--small-font-size`                                           |
| `--list-text-secondary-font-weight`       | `--description-font-weight`                                   |
| `--list-text-secondary-line-height`       | 1.2em                                                         |
| `--list-text-secondary-margin`            | -0.15rem 0 -0.05rem 0                                         |
| `--list-text-secondary-padding`           | 0.1rem 0 0.05rem 0                                            |
| `--list-draggable-grid-inner-column-span` | 1 / span 3                                                    |
| `--list-draggable-grid-areas`             | 'handle category content icon actions'                        |
| `--list-draggable-grid-template-columns`  | auto auto 1fr auto auto                                       |
| `--list-draggable-grid-outer-column-span` | 2 / span 4                                                    |
| `--list-draggable-handle-icon-size`       | `--icon-size-l`                                               |
| `--list-draggable-handle-width`           | `--row-size`                                                  |
| `--list-treelist-expander-height`         | `--row-height`                                                |
| `--list-treelist-expander-width`          | `--row-size`                                                  |
| `--list-treelist-grid-areas`              | 'expander treelist-content'                                   |
| `--list-treelist-grid-template-columns`   | auto 1fr                                                      |
| `--list-treelist-indent-left`             | `--row-size`                                                  |
| `--list-treelist-indent-right`            | 0                                                             |
| `--list-treelist-indent-child-left`       | `--row-size`                                                  |
| `--list-treelist-indent-child-right`      | 0                                                             |

## Color

| Variable name                                | Default value                             |
|----------------------------------------------|-------------------------------------------|
| `--color-list-background`                    | `--color-region`                          |
| `--color-list-disabled-foreground`           | `--color-disabled`                        |
| `--color-list-handle-icon`                   | `--color-label`                           |
| `--color-list-hover-handle-icon`             | `--color-region-hover-foreground`         |
| `--color-list-hover-background`              | `--color-region-hover-background`         |
| `--color-list-icon`                          | `--color-data`                            |
| `--color-list-primary`                       | `--color-data`                            |
| `--color-list-hover-text-primary`            | `--color-region-hover-foreground`         |
| `--color-list-region-background`             | `--color-region-2`                        |
| `--color-list-secondary`                     | `--color-label`                           |
| `--color-list-hover-text-secondary`          | `--color-region-hover-foreground`         |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                                | Contrast mode value                       |
|----------------------------------------------|-------------------------------------------|
| `--color-list-category-contrast`             | transparent                               |
| `--color-list-disabled-selected-text`        | `--contrast-background`                   |
