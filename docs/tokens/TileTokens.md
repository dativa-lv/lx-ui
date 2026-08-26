# LxTile

[← Back to Design Tokens](../DesignTokens.md)

> **Note:** Most LxTile tokens use [LxList](./ListTokens.md) tokens as default values. Changes should be made with caution to avoid unintended effects.

## Layout

| Variable name                           | Default value                                         |
|-----------------------------------------|-------------------------------------------------------|
| `--nav-tile-width`                      | 20rem                                                 |
| `--nav-tile-min-height`                 | 12rem                                                 |
| `--nav-tile-mini-min-height`            | 3rem                                                  |
| `--nav-tile-mini-grid-areas`            | 'icon-loader content'                                 |
| `--nav-tile-mini-grid-template-columns` | auto 1fr                                              |
| `--nav-tile-mini-grid-template-rows`    | 1fr                                                   |
| `--nav-tile-header-min-height`          | `--list-item-header-min-height`                       |
| `--nav-tile-mini-header-min-height`     | 2.25rem                                               |
| `--nav-tile-grid-areas`                 | 'icon-loader' 'content' 'custom-content'              |
| `--nav-tile-grid-template-columns`      | 1fr                                                   |
| `--nav-tile-grid-template-rows`         | auto 1fr auto                                         |
| `--nav-tile-border-width`               | `--list-item-border-width`                            |
| `--nav-tile-border-style`               | `--list-item-border-style`                            |
| `--nav-tile-border-radius`              | `--list-item-inner-border-radius`                     |
| `--nav-tile-border-radius-inner`        | `--nav-tile-border-radius`                            |
| `--nav-tile-icon-padding`               | `--space-0`                                           |
| `--nav-tile-mini-icon-padding`          | `--nav-tile-icon-padding`                             |
| `--nav-tile-icon-size`                  | `--icon-size-l`                                       |
| `--nav-tile-loader-padding`             | `--space-0500` `--space-0` `--space-0250` `--space-0` |
| `--nav-tile-mini-loader-padding`        | `--space-0` `--space-0750` `--space-0` `--space-0`    |
| `--nav-tile-header-padding`             | `--space-0`                                           |
| `--nav-tile-padding`                    | `--space-1000`                                        |
| `--nav-tile-text-primary-font-size`     | `--list-text-primary-font-size`                       |
| `--nav-tile-text-primary-line-height`   | `--list-text-primary-line-height`                     |
| `--nav-tile-text-primary-font-weight`   | `--list-text-primary-font-weight`                     |
| `--nav-tile-text-primary-padding`       | `--space-0`                                           |
| `--nav-tile-text-primary-margin`        | `--space-1500` `--space-0` `--space-0` `--space-0`    |
| `--nav-tile-text-secondary-font-size`   | `--list-text-secondary-font-size`                     |
| `--nav-tile-text-secondary-line-height` | `--list-text-secondary-line-height`                   |
| `--nav-tile-text-secondary-font-weight` | `--list-text-secondary-font-weight`                   |
| `--nav-tile-text-secondary-padding`     | `--space-0`                                           |
| `--nav-tile-text-secondary-margin`      | `--space-1250` `--space-0` `--space-0` `--space-0`    |

## Color

| Variable name                           | Default value                        |
|-----------------------------------------|--------------------------------------|
| `--color-nav-tile-border`               | `--color-list-item-border`           |
| `--color-nav-tile-background`           | `--color-list-item-background`       |
| `--color-nav-tile-background-hover`     | `--color-list-item-background-hover` |
| `--color-nav-tile-icon`                 | `--color-list-icon`                  |
| `--color-nav-tile-icon-hover`           | `--color-list-icon-hover`            |
| `--color-nav-tile-text-primary`         | `--color-list-text-primary`          |
| `--color-nav-tile-text-secondary`       | `--color-list-text-secondary`        |
| `--color-nav-tile-text-primary-hover`   | `--color-list-text-primary-hover`    |
| `--color-nav-tile-text-secondary-hover` | `--color-list-text-secondary-hover`  |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                           | Contrast mode value     |
|-----------------------------------------|-------------------------|
| `--color-nav-tile-text-secondary-hover` | `--contrast-background` |
