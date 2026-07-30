# LxTile

[← Back to Design Tokens](../DesignTokens.md)

> **Note:** Most LxTile tokens use [LxList](./ListTokens.md) tokens as default values. Changes should be made with caution to avoid unintended effects.

## Layout

| Variable name                       | Default value                                         |
|-------------------------------------|-------------------------------------------------------|
| `--tile-width`                      | 20rem                                                 |
| `--tile-width-x2-size`              | calc(`--tile-width` * 2 + 1rem)                       |
| `--tile-min-height`                 | 12rem                                                 |
| `--tile-mini-min-height`            | 3rem                                                  |
| `--tile-mini-grid-areas`            | 'icon-loader content'                                 |
| `--tile-mini-grid-template-columns` | auto 1fr                                              |
| `--tile-mini-grid-template-rows`    | 1fr                                                   |
| `--tile-header-min-height`          | `--list-item-header-min-height`                       |
| `--tile-mini-header-min-height`     | 2.25rem                                               |
| `--tile-grid-areas`                 | 'icon-loader' 'content' 'custom-content'              |
| `--tile-grid-template-columns`      | 1fr                                                   |
| `--tile-grid-template-rows`         | auto 1fr auto                                         |
| `--tile-border-width`               | `--list-item-border-width`                            |
| `--tile-border-style`               | `--list-item-border-style`                            |
| `--tile-border-radius`              | `--list-item-inner-border-radius`                     |
| `--tile-border-radius-inner`        | `--tile-border-radius`                                |
| `--tile-icon-padding`               | `--space-0`                                           |
| `--tile-mini-icon-padding`          | `--tile-icon-padding`                                 |
| `--tile-icon-size`                  | `--icon-size-l`                                       |
| `--tile-loader-padding`             | `--space-0500` `--space-0` `--space-0250` `--space-0` |
| `--tile-mini-loader-padding`        | `--space-0` `--space-0750` `--space-0` `--space-0`    |
| `--tile-header-padding`             | `--space-0`                                           |
| `--tile-padding`                    | `--space-1000`                                        |
| `--tile-text-primary-font-size`     | `--list-text-primary-font-size`                       |
| `--tile-text-primary-line-height`   | `--list-text-primary-line-height`                     |
| `--tile-text-primary-font-weight`   | `--list-text-primary-font-weight`                     |
| `--tile-text-primary-padding`       | `--space-0`                                           |
| `--tile-text-primary-margin`        | `--space-1500` `--space-0` `--space-0` `--space-0`    |
| `--tile-text-secondary-font-size`   | `--list-text-secondary-font-size`                     |
| `--tile-text-secondary-line-height` | `--list-text-secondary-line-height`                   |
| `--tile-text-secondary-font-weight` | `--list-text-secondary-font-weight`                   |
| `--tile-text-secondary-padding`     | `--space-0`                                           |
| `--tile-text-secondary-margin`      | `--space-1250` `--space-0` `--space-0` `--space-0`    |

## Color

| Variable name                       | Default value                        |
|-------------------------------------|--------------------------------------|
| `--color-tile-border`               | `--color-list-item-border`           |
| `--color-tile-background`           | `--color-list-item-background`       |
| `--color-tile-background-hover`     | `--color-list-item-background-hover` |
| `--color-tile-icon`                 | `--color-list-icon`                  |
| `--color-tile-icon-hover`           | `--color-list-icon-hover`            |
| `--color-tile-text-primary`         | `--color-list-text-primary`          |
| `--color-tile-text-secondary`       | `--color-list-text-secondary`        |
| `--color-tile-text-primary-hover`   | `--color-list-text-primary-hover`    |
| `--color-tile-text-secondary-hover` | `--color-list-text-secondary-hover`  |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                       | Contrast mode value     |
|-------------------------------------|-------------------------|
| `--color-tile-text-secondary-hover` | `--contrast-background` |
