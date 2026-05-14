# LxToolbar

[← Back to Design Tokens](../DesignTokens.md)

> **Note:** Some LxToolbar tokens use [button](./ButtonTokens.md) tokens as default values. Changes should be made with caution to avoid unintended effects.

## Layout

| Variable name                                      | Default value                                |
|----------------------------------------------------|----------------------------------------------|
| `--toolbar-button-group-gap`                       | `--space-0`                                  |
| `--toolbar-button-gap`                             | `--space-0`                                  |
| `--toolbar-button-primary-border`                  | `--button-primary-border`                    |
| `--toolbar-button-primary-border-radius`           | `--button-primary-border-radius`             |
| `--toolbar-button-primary-text-font-size`          | `--button-primary-text-font-size`            |
| `--toolbar-button-primary-text-font-weight`        | `--button-primary-text-font-weight`          |
| `--toolbar-button-primary-text-alignment`          | `--button-primary-text-alignment`            |
| `--toolbar-button-primary-text-decoration`         | `--button-primary-text-decoration`           |
| `--toolbar-button-primary-gap`                     | `--button-primary-gap`                       |
| `--toolbar-button-primary-grid-areas`              | 'content icon'                               |
| `--toolbar-button-primary-grid-template-columns`   | minmax(max-content, 1fr) auto                |
| `--toolbar-button-primary-grid-template-rows`      | `--button-primary-grid-template-rows`        |
| `--toolbar-button-primary-height`                  | `--button-primary-height`                    |
| `--toolbar-button-primary-icon-size`               | `--button-primary-icon-size`                 |
| `--toolbar-button-primary-min-width`               | `--button-primary-min-width`                 |
| `--toolbar-button-primary-outline-offset`          | `--button-primary-outline-offset`            |
| `--toolbar-button-primary-padding`                 | `--button-primary-padding`                   |
| `--toolbar-button-primary-width`                   | `--button-primary-width`                     |
| `--toolbar-button-primary-icon-only-height`        | `--button-primary-icon-only-height`          |
| `--toolbar-button-primary-icon-only-min-width`     | `--button-primary-icon-only-min-width`       |
| `--toolbar-button-primary-icon-only-padding`       | `--button-primary-icon-only-padding`         |
| `--toolbar-button-primary-icon-only-width`         | `--button-primary-icon-only-min-width`       |
| `--toolbar-button-secondary-border`                | `--button-secondary-border`                  |
| `--toolbar-button-secondary-border-radius`         | `--button-secondary-border-radius`           |
| `--toolbar-button-secondary-text-font-size`        | `--button-secondary-text-font-size`          |
| `--toolbar-button-secondary-text-font-weight`      | `--button-secondary-text-font-weight`        |
| `--toolbar-button-secondary-text-alignment`        | `--button-secondary-text-alignment`          |
| `--toolbar-button-secondary-text-decoration`       | `--button-secondary-text-decoration`         |
| `--toolbar-button-secondary-gap`                   | `--button-secondary-gap`                     |
| `--toolbar-button-secondary-grid-areas`            | 'content icon'                               |
| `--toolbar-button-secondary-grid-template-columns` | minmax(max-content, 1fr) auto                |
| `--toolbar-button-secondary-grid-template-rows`    | `--button-secondary-grid-template-rows`      |
| `--toolbar-button-secondary-height`                | `--button-secondary-height`                  |
| `--toolbar-button-secondary-icon-size`             | `--button-secondary-icon-size`               |
| `--toolbar-button-secondary-min-width`             | `--button-secondary-min-width`               |
| `--toolbar-button-secondary-outline-offset`        | `--button-secondary-outline-offset`          |
| `--toolbar-button-secondary-padding`               | `--button-secondary-padding`                 |
| `--toolbar-button-secondary-width`                 | `--button-secondary-width`                   |
| `--toolbar-button-secondary-icon-only-height`      | `--button-secondary-icon-only-height`        |
| `--toolbar-button-secondary-icon-only-min-width`   | `--button-secondary-icon-only-min-width`     |
| `--toolbar-button-secondary-icon-only-padding`     | `--button-secondary-icon-only-padding`       |
| `--toolbar-button-secondary-icon-only-width`       | `--button-secondary-icon-only-min-width`     |
| `--toolbar-button-tertiary-border`                 | `--button-tertiary-border`                   |
| `--toolbar-button-tertiary-border-radius`          | `--button-tertiary-border-radius`            |
| `--toolbar-button-tertiary-text-font-size`         | `--button-tertiary-text-font-size`           |
| `--toolbar-button-tertiary-text-font-weight`       | `--button-tertiary-text-font-weight`         |
| `--toolbar-button-tertiary-text-alignment`         | `--button-tertiary-text-alignment`           |
| `--toolbar-button-tertiary-text-decoration`        | `--button-tertiary-text-decoration`          |
| `--toolbar-button-tertiary-gap`                    | `--button-tertiary-gap`                      |
| `--toolbar-button-tertiary-grid-areas`             | 'content icon'                               |
| `--toolbar-button-tertiary-grid-template-columns`  | minmax(max-content, 1fr) auto                |
| `--toolbar-button-tertiary-grid-template-rows`     | `--button-tertiary-grid-template-rows`       |
| `--toolbar-button-tertiary-height`                 | `--button-tertiary-height`                   |
| `--toolbar-button-tertiary-icon-size`              | `--button-tertiary-icon-size`                |
| `--toolbar-button-tertiary-min-width`              | `--button-tertiary-min-width`                |
| `--toolbar-button-tertiary-outline-offset`         | `--button-tertiary-outline-offset`           |
| `--toolbar-button-tertiary-padding`                | `--button-tertiary-padding`                  |
| `--toolbar-button-tertiary-width`                  | `--button-tertiary-width`                    |
| `--toolbar-button-tertiary-icon-only-height`       | `--button-tertiary-icon-only-height`         |
| `--toolbar-button-tertiary-icon-only-min-width`    | `--button-tertiary-icon-only-min-width`      |
| `--toolbar-button-tertiary-icon-only-padding`      | `--button-tertiary-icon-only-padding`        |
| `--toolbar-button-tertiary-icon-only-width`        | `--button-tertiary-icon-only-min-width`      |
| `--toolbar-button-ghost-border`                    | `--button-ghost-border`                      |
| `--toolbar-button-ghost-border-radius`             | `--button-ghost-border-radius`               |
| `--toolbar-button-ghost-text-font-size`            | `--button-ghost-text-font-size`              |
| `--toolbar-button-ghost-text-font-weight`          | `--button-ghost-text-font-weight`            |
| `--toolbar-button-ghost-text-alignment`            | `--button-ghost-text-alignment`              |
| `--toolbar-button-ghost-text-decoration`           | `--button-ghost-text-decoration`             |
| `--toolbar-button-ghost-gap`                       | `--button-ghost-gap`                         |
| `--toolbar-button-ghost-grid-areas`                | 'content icon'                               |
| `--toolbar-button-ghost-grid-template-columns`     | minmax(max-content, 1fr) auto                |
| `--toolbar-button-ghost-grid-template-rows`        | `--button-ghost-grid-template-rows`          |
| `--toolbar-button-ghost-height`                    | `--button-ghost-height`                      |
| `--toolbar-button-ghost-icon-size`                 | `--button-ghost-icon-size`                   |
| `--toolbar-button-ghost-min-width`                 | `--button-ghost-min-width`                   |
| `--toolbar-button-ghost-outline-offset`            | `--button-ghost-outline-offset`              |
| `--toolbar-button-ghost-padding`                   | `--button-ghost-padding`                     |
| `--toolbar-button-ghost-width`                     | `--button-ghost-width`                       |
| `--toolbar-button-ghost-icon-only-height`          | `--button-ghost-icon-only-height`            |
| `--toolbar-button-ghost-icon-only-min-width`       | `--button-ghost-icon-only-min-width`         |
| `--toolbar-button-ghost-icon-only-padding`         | `--button-ghost-icon-only-padding`           |
| `--toolbar-button-ghost-icon-only-width`           | `--button-ghost-icon-only-min-width`         |
| `--toolbar-selection-button-border`                | var(--button-border-width) solid transparent |
| `--toolbar-selection-button-border-radius`         | `--button-border-radius`                     |
| `--toolbar-selection-button-text-font-size`        | `--button-text-font-size`                    |
| `--toolbar-selection-button-text-font-weight`      | `--button-text-font-weight`                  |
| `--toolbar-selection-button-text-alignment`        | `--button-text-alignment`                    |
| `--toolbar-selection-button-text-decoration`       | `--button-text-decoration`                   |
| `--toolbar-selection-button-gap`                   | `--button-gap`                               |
| `--toolbar-selection-button-grid-areas`            | 'content icon'                               |
| `--toolbar-selection-button-grid-template-columns` | minmax(max-content, 1fr) auto                |
| `--toolbar-selection-button-grid-template-rows`    | `--button-grid-template-rows`                |
| `--toolbar-selection-button-height`                | `--button-height`                            |
| `--toolbar-selection-button-icon-size`             | `--button-icon-size`                         |
| `--toolbar-selection-button-min-width`             | `--button-min-width`                         |
| `--toolbar-selection-button-outline-offset`        | -2px                                         |
| `--toolbar-selection-button-padding`               | `--button-padding`                           |
| `--toolbar-selection-button-width`                 | `--button-width`                             |
| `--toolbar-selection-button-icon-only-height`      | `--button-icon-only-height`                  |
| `--toolbar-selection-button-icon-only-min-width`   | `--button-icon-only-width`                   |
| `--toolbar-selection-button-icon-only-padding`     | `--button-icon-only-padding`                 |
| `--toolbar-selection-button-icon-only-width`       | `--button-icon-only-width`                   |

## Color

| Variable name                                          | Default value                                  |
|--------------------------------------------------------|------------------------------------------------|
| `--color-toolbar-button-primary-text`                  | `--color-button-primary-text`                  |
| `--color-toolbar-button-primary-background`            | `--color-button-primary-background`            |
| `--color-toolbar-button-primary-text-focus`            | `--color-button-primary-text-focus`            |
| `--color-toolbar-button-primary-background-focus`      | `--color-button-primary-background-focus`      |
| `--color-toolbar-button-primary-border-focus`          | `--color-button-primary-border-focus`          |
| `--color-toolbar-button-primary-text-active`           | `--color-button-primary-text-active`           |
| `--color-toolbar-button-primary-background-active`     | `--color-button-primary-background-active`     |
| `--color-toolbar-button-primary-border-active`         | `--color-button-primary-border-active`         |
| `--color-toolbar-button-primary-text-disabled`         | `--color-button-primary-text-disabled`         |
| `--color-toolbar-button-primary-background-disabled`   | `--color-button-primary-background-disabled`   |
| `--color-toolbar-button-primary-border-disabled`       | `--color-button-primary-border-disabled`       |
| `--color-toolbar-button-primary-text-hover`            | `--color-button-primary-text-hover`            |
| `--color-toolbar-button-primary-background-hover`      | `--color-button-primary-background-hover`      |
| `--color-toolbar-button-primary-border-hover`          | `--color-button-primary-border-hover`          |
| `--color-toolbar-button-primary-icon`                  | `--color-button-primary-icon`                  |
| `--color-toolbar-button-primary-icon-active`           | `--color-button-primary-icon-active`           |
| `--color-toolbar-button-primary-icon-disabled`         | `--color-button-primary-icon-disabled`         |
| `--color-toolbar-button-primary-icon-focus`            | `--color-button-primary-icon-focus`            |
| `--color-toolbar-button-primary-icon-hover`            | `--color-button-primary-icon-hover`            |
| `--color-toolbar-button-secondary-text`                | `--color-button-secondary-text`                |
| `--color-toolbar-button-secondary-background`          | `--color-button-secondary-background`          |
| `--color-toolbar-button-secondary-text-focus`          | `--color-button-secondary-text-focus`          |
| `--color-toolbar-button-secondary-background-focus`    | `--color-button-secondary-background-focus`    |
| `--color-toolbar-button-secondary-border-focus`        | `--color-button-secondary-border-focus`        |
| `--color-toolbar-button-secondary-text-active`         | `--color-button-secondary-text-active`         |
| `--color-toolbar-button-secondary-background-active`   | `--color-button-secondary-background-active`   |
| `--color-toolbar-button-secondary-border-active`       | `--color-button-secondary-border-active`       |
| `--color-toolbar-button-secondary-text-disabled`       | `--color-button-secondary-text-disabled`       |
| `--color-toolbar-button-secondary-background-disabled` | `--color-button-secondary-background-disabled` |
| `--color-toolbar-button-secondary-border-disabled`     | `--color-button-secondary-border-disabled`     |
| `--color-toolbar-button-secondary-text-hover`          | `--color-button-secondary-text-hover`          |
| `--color-toolbar-button-secondary-background-hover`    | `--color-button-secondary-background-hover`    |
| `--color-toolbar-button-secondary-border-hover`        | `--color-button-secondary-border-hover`        |
| `--color-toolbar-button-secondary-icon`                | `--color-button-secondary-icon`                |
| `--color-toolbar-button-secondary-icon-active`         | `--color-button-secondary-icon-active`         |
| `--color-toolbar-button-secondary-icon-disabled`       | `--color-button-secondary-icon-disabled`       |
| `--color-toolbar-button-secondary-icon-focus`          | `--color-button-secondary-icon-focus`          |
| `--color-toolbar-button-secondary-icon-hover`          | `--color-button-secondary-icon-hover`          |
| `--color-toolbar-button-tertiary-text`                 | `--color-button-tertiary-text`                 |
| `--color-toolbar-button-tertiary-background`           | `--color-button-tertiary-background`           |
| `--color-toolbar-button-tertiary-text-focus`           | `--color-button-tertiary-text-focus`           |
| `--color-toolbar-button-tertiary-background-focus`     | `--color-button-tertiary-background-focus`     |
| `--color-toolbar-button-tertiary-border-focus`         | `--color-button-tertiary-border-focus`         |
| `--color-toolbar-button-tertiary-text-active`          | `--color-button-tertiary-text-active`          |
| `--color-toolbar-button-tertiary-background-active`    | `--color-button-tertiary-background-active`    |
| `--color-toolbar-button-tertiary-border-active`        | `--color-button-tertiary-border-active`        |
| `--color-toolbar-button-tertiary-text-disabled`        | `--color-button-tertiary-text-disabled`        |
| `--color-toolbar-button-tertiary-background-disabled`  | `--color-button-tertiary-background-disabled`  |
| `--color-toolbar-button-tertiary-border-disabled`      | `--color-button-tertiary-border-disabled`      |
| `--color-toolbar-button-tertiary-text-hover`           | `--color-button-tertiary-text-hover`           |
| `--color-toolbar-button-tertiary-background-hover`     | `--color-button-tertiary-background-hover`     |
| `--color-toolbar-button-tertiary-border-hover`         | `--color-button-tertiary-border-hover`         |
| `--color-toolbar-button-tertiary-icon`                 | `--color-button-tertiary-icon`                 |
| `--color-toolbar-button-tertiary-icon-active`          | `--color-button-tertiary-icon-active`          |
| `--color-toolbar-button-tertiary-icon-disabled`        | `--color-button-tertiary-icon-disabled`        |
| `--color-toolbar-button-tertiary-icon-focus`           | `--color-button-tertiary-icon-focus`           |
| `--color-toolbar-button-tertiary-icon-hover`           | `--color-button-tertiary-icon-hover`           |
| `--color-toolbar-button-ghost-text`                    | `--color-data`                                 |
| `--color-toolbar-button-ghost-background`              | `--color-button-ghost-background`              |
| `--color-toolbar-button-ghost-text-focus`              | `--color-data`                                 |
| `--color-toolbar-button-ghost-background-focus`        | `--color-button-ghost-background-focus`        |
| `--color-toolbar-button-ghost-border-focus`            | `--color-button-ghost-border-focus`            |
| `--color-toolbar-button-ghost-text-active`             | `--color-button-ghost-text-active`             |
| `--color-toolbar-button-ghost-background-active`       | `--color-button-ghost-background-active`       |
| `--color-toolbar-button-ghost-border-active`           | `--color-button-ghost-border-active`           |
| `--color-toolbar-button-ghost-text-disabled`           | `--color-button-ghost-text-disabled`           |
| `--color-toolbar-button-ghost-background-disabled`     | `--color-button-ghost-background-disabled`     |
| `--color-toolbar-button-ghost-border-disabled`         | `--color-button-ghost-border-disabled`         |
| `--color-toolbar-button-ghost-text-hover`              | `--color-button-ghost-text-hover`              |
| `--color-toolbar-button-ghost-background-hover`        | `--color-button-ghost-background-hover`        |
| `--color-toolbar-button-ghost-border-hover`            | `--color-button-ghost-border-hover`            |
| `--color-toolbar-button-ghost-icon`                    | `--color-data`                                 |
| `--color-toolbar-button-ghost-icon-active`             | `--color-button-ghost-icon-active`             |
| `--color-toolbar-button-ghost-icon-disabled`           | `--color-button-ghost-icon-disabled`           |
| `--color-toolbar-button-ghost-icon-focus`              | `--color-data`                                 |
| `--color-toolbar-button-ghost-icon-hover`              | `--color-button-ghost-icon-hover`              |
| `--color-toolbar-selection-button-text`                | `--color-interactive-foreground`               |
| `--color-toolbar-selection-button-background`          | transparent                                    |
| `--color-toolbar-selection-button-text-focus`          | `--color-interactive-foreground`               |
| `--color-toolbar-selection-button-background-focus`    | transparent                                    |
| `--color-toolbar-selection-button-border-focus`        | transparent                                    |
| `--color-toolbar-selection-button-text-active`         | `--color-interactive-active-foreground`        |
| `--color-toolbar-selection-button-background-active`   | `--color-interactive-active-background`        |
| `--color-toolbar-selection-button-border-active`       | `--color-interactive-active-background`        |
| `--color-toolbar-selection-button-text-disabled`       | `--color-disabled-foreground`                  |
| `--color-toolbar-selection-button-background-disabled` | `--color-disabled-background`                  |
| `--color-toolbar-selection-button-border-disabled`     | `--color-disabled-background`                  |
| `--color-toolbar-selection-button-text-hover`          | `--color-interactive-hover-foreground`         |
| `--color-toolbar-selection-button-background-hover`    | `--color-interactive-hover-background`         |
| `--color-toolbar-selection-button-border-hover`        | `--color-interactive-hover-background`         |
| `--color-toolbar-selection-button-icon`                | `--color-interactive-foreground`               |
| `--color-toolbar-selection-button-icon-active`         | `--color-interactive-active-foreground`        |
| `--color-toolbar-selection-button-icon-disabled`       | `--color-disabled-foreground`                  |
| `--color-toolbar-selection-button-icon-focus`          | `--color-interactive-foreground`               |
| `--color-toolbar-selection-button-icon-hover`          | `--color-interactive-hover-foreground`         |
