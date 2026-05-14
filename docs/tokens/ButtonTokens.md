# LxButton

[← Back to Design Tokens](../DesignTokens.md)

## Layout

### Base button tokens

> **Note:** In the table below are tokens that most button tokens reference by default, allowing for easier system-wide customization.

| Variable name                    | Default value                                                       |
|----------------------------------|---------------------------------------------------------------------|
| `--button-cursor`                | pointer                                                             |
| `--button-loader-margin`         | `--space-0`                                                         |
| `--button-set-gap`               | `--space-0500`                                                      |
| `--button-badge-inset`           | -0.625rem -0.625rem auto auto                                       |
| `--button-badge-empty-inset`     | calc(var(--space-0500) * -1) calc(var(--space-0500) * -1) auto auto |
| `--button-border-width`          | `--border-width-2`                                                  |
| `--button-border-radius`         | `--border-radius-default`                                           |
| `--button-text-font-size`        | inherit                                                             |
| `--button-text-font-weight`      | `--font-weight-interactive`                                         |
| `--button-text-alignment`        | left                                                                |
| `--button-text-decoration`       | none                                                                |
| `--button-gap`                   | `--space-0750`                                                      |
| `--button-grid-areas`            | 'content icon'                                                      |
| `--button-grid-template-columns` | 1fr auto                                                            |
| `--button-grid-template-rows`    | 1fr                                                                 |
| `--button-height`                | `--row-size`                                                        |
| `--button-icon-size`             | `--icon-size-m`                                                     |
| `--button-min-width`             | `--row-size`                                                        |
| `--button-outline-offset`        | 0                                                                   |
| `--button-padding`               | var(--space-0) calc(var(--space-1000) - var(--button-border-width)) |
| `--button-width`                 | auto                                                                |
| `--button-icon-only-height`      | `--button-height`                                                   |
| `--button-icon-only-min-width`   | `--button-min-width`                                                |
| `--button-icon-only-padding`     | `--space-0`                                                         |
| `--button-icon-only-width`       | auto                                                                |

### LxButton tokens

| Variable name                              | Default value                                                                            |
|--------------------------------------------|------------------------------------------------------------------------------------------|
| `--button-primary-badge-inset`             | `--button-badge-inset`                                                                   |
| `--button-primary-badge-empty-inset`       | `--button-badge-empty-inset`                                                             |
| `--button-primary-border-width`            | `--button-border-width`                                                                  |
| `--button-primary-border`                  | var(--button-primary-border-width) solid var(--color-interactive-background)             |
| `--button-primary-border-radius`           | `--button-border-radius`                                                                 |
| `--button-primary-text-font-size`          | `--button-text-font-size`                                                                |
| `--button-primary-text-font-weight`        | `--button-text-font-weight`                                                              |
| `--button-primary-text-alignment`          | `--button-text-alignment`                                                                |
| `--button-primary-text-decoration`         | `--button-text-decoration`                                                               |
| `--button-primary-gap`                     | `--button-gap`                                                                           |
| `--button-primary-grid-areas`              | `--button-grid-areas`                                                                    |
| `--button-primary-grid-template-columns`   | `--button-grid-template-columns`                                                         |
| `--button-primary-grid-template-rows`      | `--button-grid-template-rows`                                                            |
| `--button-primary-height`                  | `--button-height`                                                                        |
| `--button-primary-icon-size`               | `--button-icon-size`                                                                     |
| `--button-primary-min-width`               | `--button-min-width`                                                                     |
| `--button-primary-outline-offset`          | `--button-outline-offset`                                                                |
| `--button-primary-padding`                 | `--button-padding`                                                                       |
| `--button-primary-width`                   | `--button-width`                                                                         |
| `--button-primary-icon-only-height`        | `--button-icon-only-height`                                                              |
| `--button-primary-icon-only-min-width`     | `--button-icon-only-min-width`                                                           |
| `--button-primary-icon-only-padding`       | `--button-icon-only-padding`                                                             |
| `--button-primary-icon-only-width`         | `--button-icon-only-width`                                                               |
| `--button-secondary-badge-inset`           | `--button-badge-inset`                                                                   |
| `--button-secondary-badge-empty-inset`     | `--button-badge-empty-inset`                                                             |
| `--button-secondary-border-width`          | `--button-border-width`                                                                  |
| `--button-secondary-border`                | var(--button-secondary-border-width) solid var(--color-interactive-secondary-background) |
| `--button-secondary-border-radius`         | `--button-border-radius`                                                                 |
| `--button-secondary-text-font-size`        | `--button-text-font-size`                                                                |
| `--button-secondary-text-font-weight`      | `--button-text-font-weight`                                                              |
| `--button-secondary-text-alignment`        | `--button-text-alignment`                                                                |
| `--button-secondary-text-decoration`       | `--button-text-decoration`                                                               |
| `--button-secondary-gap`                   | `--button-gap`                                                                           |
| `--button-secondary-grid-areas`            | `--button-grid-areas`                                                                    |
| `--button-secondary-grid-template-columns` | `--button-grid-template-columns`                                                         |
| `--button-secondary-grid-template-rows`    | `--button-grid-template-rows`                                                            |
| `--button-secondary-height`                | `--button-height`                                                                        |
| `--button-secondary-icon-size`             | `--button-icon-size`                                                                     |
| `--button-secondary-min-width`             | `--button-min-width`                                                                     |
| `--button-secondary-outline-offset`        | `--button-outline-offset`                                                                |
| `--button-secondary-padding`               | `--button-padding`                                                                       |
| `--button-secondary-width`                 | `--button-width`                                                                         |
| `--button-secondary-icon-only-height`      | `--button-icon-only-height`                                                              |
| `--button-secondary-icon-only-min-width`   | `--button-icon-only-min-width`                                                           |
| `--button-secondary-icon-only-padding`     | `--button-icon-only-padding`                                                             |
| `--button-secondary-icon-only-width`       | `--button-icon-only-width`                                                               |
| `--button-tertiary-badge-inset`            | `--button-badge-inset`                                                                   |
| `--button-tertiary-badge-empty-inset`      | `--button-badge-empty-inset`                                                             |
| `--button-tertiary-border-width`           | `--button-border-width`                                                                  |
| `--button-tertiary-border`                 | var(--button-tertiary-border-width) solid var(--color-interactive-background)            |
| `--button-tertiary-border-radius`          | `--button-border-radius`                                                                 |
| `--button-tertiary-text-font-size`         | `--button-text-font-size`                                                                |
| `--button-tertiary-text-font-weight`       | `--button-text-font-weight`                                                              |
| `--button-tertiary-text-alignment`         | `--button-text-alignment`                                                                |
| `--button-tertiary-text-decoration`        | `--button-text-decoration`                                                               |
| `--button-tertiary-gap`                    | `--button-gap`                                                                           |
| `--button-tertiary-grid-areas`             | `--button-grid-areas`                                                                    |
| `--button-tertiary-grid-template-columns`  | `--button-grid-template-columns`                                                         |
| `--button-tertiary-grid-template-rows`     | `--button-grid-template-rows`                                                            |
| `--button-tertiary-height`                 | `--button-height`                                                                        |
| `--button-tertiary-icon-size`              | `--button-icon-size`                                                                     |
| `--button-tertiary-min-width`              | `--button-min-width`                                                                     |
| `--button-tertiary-outline-offset`         | -2px                                                                                     |
| `--button-tertiary-padding`                | `--button-padding`                                                                       |
| `--button-tertiary-width`                  | `--button-width`                                                                         |
| `--button-tertiary-icon-only-height`       | `--button-icon-only-height`                                                              |
| `--button-tertiary-icon-only-min-width`    | `--button-icon-only-min-width`                                                           |
| `--button-tertiary-icon-only-padding`      | `--button-icon-only-padding`                                                             |
| `--button-tertiary-icon-only-width`        | `--button-icon-only-width`                                                               |
| `--button-ghost-badge-inset`               | calc(var(--space-0125) * -1) calc(var(--space-0125) * -1) auto auto                      |
| `--button-ghost-badge-empty-inset`         | calc(var(--space-0125) * -1) calc(var(--space-0125) * -1) auto auto                      |
| `--button-ghost-border-width`              | `--button-border-width`                                                                  |
| `--button-ghost-border`                    | var(--button-ghost-border-width) solid transparent                                       |
| `--button-ghost-border-radius`             | `--button-border-radius`                                                                 |
| `--button-ghost-text-font-size`            | `--button-text-font-size`                                                                |
| `--button-ghost-text-font-weight`          | `--button-text-font-weight`                                                              |
| `--button-ghost-text-alignment`            | `--button-text-alignment`                                                                |
| `--button-ghost-text-decoration`           | `--button-text-decoration`                                                               |
| `--button-ghost-gap`                       | `--button-gap`                                                                           |
| `--button-ghost-grid-areas`                | `--button-grid-areas`                                                                    |
| `--button-ghost-grid-template-columns`     | `--button-grid-template-columns`                                                         |
| `--button-ghost-grid-template-rows`        | `--button-grid-template-rows`                                                            |
| `--button-ghost-height`                    | `--button-height`                                                                        |
| `--button-ghost-icon-size`                 | `--button-icon-size`                                                                     |
| `--button-ghost-min-width`                 | `--button-min-width`                                                                     |
| `--button-ghost-outline-offset`            | -2px                                                                                     |
| `--button-ghost-padding`                   | `--button-padding`                                                                       |
| `--button-ghost-width`                     | `--button-width`                                                                         |
| `--button-ghost-icon-only-height`          | `--button-icon-only-height`                                                              |
| `--button-ghost-icon-only-min-width`       | `--button-icon-only-min-width`                                                           |
| `--button-ghost-icon-only-padding`         | `--button-icon-only-padding`                                                             |
| `--button-ghost-icon-only-width`           | `--button-icon-only-width`                                                               |

## Color

| Variable name                                  | Default value                              |
|------------------------------------------------|--------------------------------------------|
| `--color-button-active-mode`                   | `--color-data`                             |
| `--color-button-active-mode-background`        | `--color-highlight`                        |
| `--color-button-active-mode-border`            | `--color-highlight`                        |
| `--color-button-active-mode-icon`              | `--color-button-active-mode`               |
| `--color-button-destructive`                   | `--color-interactive-foreground`           |
| `--color-button-destructive-background`        | `--color-destructive`                      |
| `--color-button-destructive-border`            | `--color-destructive`                      |
| `--color-button-destructive-icon`              | `--color-interactive-foreground`           |
| `--color-button-primary-text`                  | `--color-interactive-foreground`           |
| `--color-button-primary-background`            | `--color-interactive-background`           |
| `--color-button-primary-text-focus`            | `--color-button-primary-text`              |
| `--color-button-primary-background-focus`      | `--color-button-primary-background`        |
| `--color-button-primary-border-focus`          | `--color-background`                       |
| `--color-button-primary-text-active`           | `--color-interactive-active-foreground`    |
| `--color-button-primary-background-active`     | `--color-interactive-active-background`    |
| `--color-button-primary-border-active`         | `--color-background`                       |
| `--color-button-primary-text-disabled`         | `--color-disabled-foreground`              |
| `--color-button-primary-background-disabled`   | `--color-disabled-background`              |
| `--color-button-primary-border-disabled`       | `--color-disabled-background`              |
| `--color-button-primary-text-hover`            | `--color-interactive-hover-foreground`     |
| `--color-button-primary-background-hover`      | `--color-interactive-hover-background`     |
| `--color-button-primary-border-hover`          | `--color-interactive-hover-background`     |
| `--color-button-primary-icon`                  | `--color-interactive-foreground`           |
| `--color-button-primary-icon-active`           | `--color-interactive-active-foreground`    |
| `--color-button-primary-icon-disabled`         | `--color-disabled-foreground`              |
| `--color-button-primary-icon-focus`            | `--color-interactive-foreground`           |
| `--color-button-primary-icon-hover`            | `--color-interactive-hover-foreground`     |
| `--color-button-secondary-text`                | `--color-interactive-secondary-foreground` |
| `--color-button-secondary-background`          | `--color-interactive-secondary-background` |
| `--color-button-secondary-text-focus`          | `--color-button-secondary-text`            |
| `--color-button-secondary-background-focus`    | `--color-button-secondary-background`      |
| `--color-button-secondary-border-focus`        | `--color-background`                       |
| `--color-button-secondary-text-active`         | `--color-interactive-active-foreground`    |
| `--color-button-secondary-background-active`   | `--color-interactive-active-background`    |
| `--color-button-secondary-border-active`       | `--color-background`                       |
| `--color-button-secondary-text-disabled`       | `--color-disabled-foreground`              |
| `--color-button-secondary-background-disabled` | `--color-disabled-background`              |
| `--color-button-secondary-border-disabled`     | `--color-disabled-background`              |
| `--color-button-secondary-text-hover`          | `--color-interactive-hover-foreground`     |
| `--color-button-secondary-background-hover`    | `--color-interactive-hover-background`     |
| `--color-button-secondary-border-hover`        | `--color-interactive-hover-background`     |
| `--color-button-secondary-icon`                | `--color-interactive-secondary-foreground` |
| `--color-button-secondary-icon-active`         | `--color-interactive-active-foreground`    |
| `--color-button-secondary-icon-disabled`       | `--color-disabled-foreground`              |
| `--color-button-secondary-icon-focus`          | `--color-interactive-secondary-foreground` |
| `--color-button-secondary-icon-hover`          | `--color-interactive-hover-foreground`     |
| `--color-button-tertiary-text`                 | `--color-interactive-background`           |
| `--color-button-tertiary-background`           | transparent                                |
| `--color-button-tertiary-text-focus`           | `--color-button-tertiary-text`             |
| `--color-button-tertiary-background-focus`     | `--color-button-tertiary-background`       |
| `--color-button-tertiary-border-focus`         | `--color-focus-background`                 |
| `--color-button-tertiary-text-active`          | `--color-interactive-active-foreground`    |
| `--color-button-tertiary-background-active`    | `--color-interactive-active-background`    |
| `--color-button-tertiary-border-active`        | `--color-interactive-active-background`    |
| `--color-button-tertiary-text-disabled`        | `--color-disabled-foreground`              |
| `--color-button-tertiary-background-disabled`  | transparent                                |
| `--color-button-tertiary-border-disabled`      | `--color-disabled-foreground`              |
| `--color-button-tertiary-text-hover`           | `--color-interactive-hover-foreground`     |
| `--color-button-tertiary-background-hover`     | `--color-interactive-hover-background`     |
| `--color-button-tertiary-border-hover`         | `--color-interactive-hover-background`     |
| `--color-button-tertiary-icon`                 | `--color-interactive-background`           |
| `--color-button-tertiary-icon-active`          | `--color-interactive-active-foreground`    |
| `--color-button-tertiary-icon-disabled`        | `--color-disabled-foreground`              |
| `--color-button-tertiary-icon-focus`           | `--color-interactive-background`           |
| `--color-button-tertiary-icon-hover`           | `--color-interactive-hover-foreground`     |
| `--color-button-ghost-text`                    | `--color-interactive-background`           |
| `--color-button-ghost-background`              | transparent                                |
| `--color-button-ghost-text-focus`              | `--color-button-ghost-text`                |
| `--color-button-ghost-background-focus`        | `--color-button-ghost-background`          |
| `--color-button-ghost-border-focus`            | transparent                                |
| `--color-button-ghost-text-active`             | `--color-interactive-active-foreground`    |
| `--color-button-ghost-background-active`       | `--color-interactive-active-background`    |
| `--color-button-ghost-border-active`           | `--color-interactive-active-background`    |
| `--color-button-ghost-text-disabled`           | `--color-disabled-foreground`              |
| `--color-button-ghost-background-disabled`     | transparent                                |
| `--color-button-ghost-border-disabled`         | transparent                                |
| `--color-button-ghost-text-hover`              | `--color-interactive-hover-foreground`     |
| `--color-button-ghost-background-hover`        | `--color-interactive-hover-background`     |
| `--color-button-ghost-border-hover`            | `--color-interactive-hover-background`     |
| `--color-button-ghost-icon`                    | `--color-interactive-background`           |
| `--color-button-ghost-icon-active`             | `--color-interactive-active-foreground`    |
| `--color-button-ghost-icon-disabled`           | `--color-disabled-foreground`              |
| `--color-button-ghost-icon-focus`              | `--color-interactive-background`           |
| `--color-button-ghost-icon-hover`              | `--color-interactive-hover-foreground`     |

<br/>
Customized value for contrast mode:
<br />
<br />

| Variable name                            | Contrast mode value      |
|------------------------------------------|--------------------------|
| `--color-button-active-mode-background`  | `--contrast-background`  |
