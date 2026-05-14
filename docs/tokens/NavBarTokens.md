# LxNavBar

[← Back to Design Tokens](../DesignTokens.md)

## Layout

| Variable name                             | Default value                                                  |
|-------------------------------------------|----------------------------------------------------------------|
| `--nav-item-align`                        | center                                                         |
| `--nav-item-border`                       | var(--border-width-2) solid transparent                        |
| `--nav-item-border-radius`                | `--border-radius-0`                                            |
| `--nav-item-text-font-size`               | inherit                                                        |
| `--nav-item-text-font-weight`             | `--font-weight-interactive`                                    |
| `--nav-item-text-align`                   | left                                                           |
| `--nav-item-text-decoration`              | none                                                           |
| `--nav-item-gap`                          | `--space-0750`                                                 |
| `--nav-item-grid-areas`                   | 'icon content'                                                 |
| `--nav-item-grid-template-columns`        | auto 1fr                                                       |
| `--nav-item-grid-template-rows`           | 1fr                                                            |
| `--nav-item-height`                       | `--row-size`                                                   |
| `--nav-item-icon-size`                    | `--icon-size-m`                                                |
| `--nav-item-min-width`                    | `--row-size`                                                   |
| `--nav-item-outline-offset`               | -2px                                                           |
| `--nav-item-padding`                      | var(--space-0) calc(var(--space-0750) - var(--border-width-2)) |
| `--nav-item-width`                        | 100%                                                           |
| `--nav-public-item-align`                 | center                                                         |
| `--nav-public-item-border`                | `--border-width-0`                                             |
| `--nav-public-item-border-radius`         | `--border-radius-0`                                            |
| `--nav-public-item-text-font-size`        | inherit                                                        |
| `--nav-public-item-text-font-weight`      | `--font-weight-interactive`                                    |
| `--nav-public-item-text-align`            | center                                                         |
| `--nav-public-item-text-decoration`       | none                                                           |
| `--nav-public-item-gap`                   | `--space-0750`                                                 |
| `--nav-public-item-grid-areas`            | 'content'                                                      |
| `--nav-public-item-grid-template-columns` | 1fr                                                            |
| `--nav-public-item-grid-template-rows`    | 1fr                                                            |
| `--nav-public-item-height`                | calc(var(--row-size) - 1.35px)                                 |
| `--nav-public-item-icon-size`             | `--icon-size-m`                                                |
| `--nav-public-item-min-width`             | `--row-size`                                                   |
| `--nav-public-item-outline-offset`        | -2px                                                           |
| `--nav-public-item-padding`               | var(--space-0) calc(var(--space-1000) - var(--border-width-2)) |
| `--nav-public-item-width`                 | auto                                                           |

## Color

| Variable name                              | Default value                          |
|--------------------------------------------|----------------------------------------|
| `--color-nav-item-text`                    | #111                                   |
| `--color-nav-item-background`              | transparent                            |
| `--color-nav-item-text-hover`              | `--color-interactive-hover-foreground` |
| `--color-nav-item-border-hover`            | transparent                            |
| `--color-nav-item-background-hover`        | `--color-interactive-hover-background` |
| `--color-nav-item-icon`                    | #111                                   |
| `--color-nav-item-icon-hover`              | `--color-interactive-hover-foreground` |
| `--color-nav-item-icon-selected`           | #111                                   |
| `--color-nav-item-text-selected`           | #111                                   |
| `--color-nav-item-background-selected`     | #e0e0e0                                |
| `--color-nav-item-border-selected`         | transparent                            |
| `--color-nav-item-border-left-selected`    | `--color-brand`                        |
| `--color-nav-public-item-text`             | `--color-nav-foreground`               |
| `--color-nav-public-item-background`       | transparent                            |
| `--color-nav-public-item-text-hover`       | `--color-nav-foreground`               |
| `--color-nav-public-item-background-hover` | `--color-nav-hover-background`         |
| `--color-nav-public-item-border-hover`     | transparent                            |
| `--color-nav-public-item-icon`             | `--color-nav-foreground`               |
| `--color-nav-public-item-icon-hover`       | `--color-nav-foreground`               |


<br/>
Customized values for dark mode:
<br />
<br />

| Variable name                          | Dark mode value |
|----------------------------------------|-----------------|
| `--color-nav-item-text`                | #eee            |
| `--color-nav-item-icon`                | #eee            |
| `--color-nav-item-icon-selected`       | #eee            |
| `--color-nav-item-text-selected`       | #eee            |
| `--color-nav-item-background-selected` | #35373c         |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                          | Contrast mode value     |
|----------------------------------------|-------------------------|
| `--color-nav-item-text`                | `--contrast-foreground` |
| `--color-nav-item-icon`                | `--contrast-foreground` |
| `--color-nav-item-background-selected` | `--contrast-foreground` |
| `--color-nav-public-item-text-hover`   | `--contrast-background` |
| `--color-nav-public-item-icon-hover`   | `--contrast-background` |
