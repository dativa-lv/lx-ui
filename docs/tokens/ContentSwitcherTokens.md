# LxContentSwitcher

[← Back to Design Tokens](../DesignTokens.md)

## Layout

| Variable name                                     | Default value                                                                                     |
|---------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `--content-switcher-container-border-width`       | `--border-width-1`                                                                                |
| `--content-switcher-container-border`             | var(--content-switcher-container-border-width) solid var(--color-data)                            |
| `--content-switcher-container-border-disabled`    | var(--content-switcher-container-border-width) solid var(--color-disabled-foreground)             |
| `--content-switcher-container-border-radius`      | `--border-radius-0250`                                                                            |
| `--content-switcher-container-padding`            | 0                                                                                                 |
| `--content-switcher-item-border-width`            | `--border-width-1`                                                                                |
| `--content-switcher-item-border`                  | var(--content-switcher-item-border-width) solid transparent                                       |
| `--content-switcher-item-border-disabled`         | var(--content-switcher-item-border-width) solid transparent                                       |
| `--content-switcher-inner-border-radius`          | `--border-radius-0`                                                                               |
| `--content-switcher-outer-border-radius`          | `--border-radius-0125`                                                                            |
| `--content-switcher-item-height`                  | 2.5rem                                                                                            |
| `--content-switcher-item-min-width`               | 3rem                                                                                              |
| `--content-switcher-item-padding`                 | 0 1rem                                                                                            |
| `--content-switcher-item-gap`                     | 0                                                                                                 |
| `--content-switcher-border-selected`              | var(--content-switcher-item-border-width) solid var(--color-content-switcher-background-selected) |
| `--content-switcher-inner-border-radius-selected` | `--content-switcher-inner-border-radius`                                                          |
| `--content-switcher-outer-border-radius-selected` | `--content-switcher-outer-border-radius`                                                          |
| `--content-switcher-divider-border`               | var(--border-width-1) solid var(--color-chrome)                                                   |
| `--content-switcher-divider-height`               | 1rem                                                                                              |
| `--content-switcher-content-gap`                  | 0.5rem                                                                                            |
| `--content-switcher-alignment`                    | start                                                                                             |
| `--content-switcher-text-font-size`               | `--font-size`                                                                                     |
| `--content-switcher-text-font-weight`             | `--font-weight`                                                                                   |
| `--content-switcher-text-line-height`             | 1.2em                                                                                             |
| `--content-switcher-icon-size`                    | `--icon-size-s`                                                                                   |

## Color

| Variable name                                    | Default value                     |
|--------------------------------------------------|-----------------------------------|
| `--color-content-switcher-container-background`  | transparent                       |
| `--color-content-switcher-item-background`       | transparent                       |
| `--color-content-switcher-item-background-hover` | `--color-region-hover-background` |
| `--color-content-switcher-background-selected`   | `--color-data`                    |
| `--color-content-switcher-icon`                  | `--color-data`                    |
| `--color-content-switcher-icon-hover`            | `--color-region-hover-foreground` |
| `--color-content-switcher-icon-selected`         | `--color-background`              |
| `--color-content-switcher-text`                  | `--color-data`                    |
| `--color-content-switcher-text-hover`            | `--color-region-hover-foreground` |
| `--color-content-switcher-text-selected`         | `--color-background`              |
