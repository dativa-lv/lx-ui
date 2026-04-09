# LxTile

[← Back to Design Tokens](../DesignTokens.md)

> **Note:** Most LxTile tokens use [LxList](../ListTokens.md) tokens as default values. Changes should be made with caution to avoid unintended effects.

## Layout

| Variable name                       | Default value                            |
|-------------------------------------|------------------------------------------|
| `--tile-width`                      | 20rem                                    |
| `--tile-width-x2-size`              | calc(var(--tile-width) * 2 + 1rem)       |
| `--tile-min-height`                 | 12rem                                    |
| `--tile-mini-min-height`            | 3rem                                     |
| `--tile-mini-grid-areas`            | 'icon-loader content'                    |
| `--tile-mini-grid-template-columns` | auto 1fr                                 |
| `--tile-mini-grid-template-rows`    | 1fr                                      |
| `--tile-header-min-height`          | `--list-item-header-min-height`          |
| `--tile-mini-header-min-height`     | 2.25rem                                  |
| `--tile-grid-areas`                 | 'icon-loader' 'content' 'custom-content' |
| `--tile-grid-template-columns`      | 1fr                                      |
| `--tile-grid-template-rows`         | auto 1fr auto                            |
| `--tile-border`                     | `--list-item-border`                     |
| `--tile-border-radius`              | `--list-item-border-radius`              |
| `--tile-border-radius-inner`        | `--tile-border-radius`                   |
| `--tile-icon-padding`               | 0                                        |
| `--tile-mini-icon-padding`          | `--tile-icon-padding`                    |
| `--tile-icon-size`                  | `--icon-size-l`                          |
| `--tile-loader-padding`             | 0.4rem 0rem 0.35rem 0rem                 |
| `--tile-mini-loader-padding`        | 0 0.75rem 0 0                            |
| `--tile-header-padding`             | 0                                        |
| `--tile-padding`                    | 1rem                                     |
| `--tile-text-primary-font-size`     | `--list-text-primary-font-size`          |
| `--tile-text-primary-line-height`   | `--list-text-primary-line-height`        |
| `--tile-text-primary-font-weight`   | `--list-text-primary-font-weight`        |
| `--tile-text-primary-padding`       | 0                                        |
| `--tile-text-primary-margin`        | 1.45rem 0 0 0                            |
| `--tile-text-secondary-font-size`   | `--list-text-secondary-font-size`        |
| `--tile-text-secondary-line-height` | `--list-text-secondary-line-height`      |
| `--tile-text-secondary-font-weight` | `--list-text-secondary-font-weight`      |
| `--tile-text-secondary-padding`     | 0                                        |
| `--tile-text-secondary-margin`      | 1.2rem 0 0 0                             |

## Color

| Variable name                       | Default value                       |
|-------------------------------------|-------------------------------------|
| `--color-tile-background`           | `--color-list-background`           |
| `--color-tile-disabled-foreground`  | `--color-list-disabled-foreground`  |
| `--color-tile-hover-background`     | `--color-list-hover-background`     |
| `--color-tile-icon`                 | `--color-list-icon`                 |
| `--color-tile-icon-hover`           | `--color-list-icon-hover`           |
| `--color-tile-primary`              | `--color-tile-primary`              |
| `--color-tile-secondary`            | `--color-list-secondary`            |
| `--color-tile-hover-text-primary`   | `--color-list-hover-text-primary`   |
| `--color-tile-hover-text-secondary` | `--color-list-hover-text-secondary` |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                       | Contrast mode value     |
|-------------------------------------|-------------------------|
| `--color-tile-hover-text-secondary` | `--contrast-background` |
