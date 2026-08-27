# LxInfoBox

[← Back to Design Tokens](../DesignTokens.md)

## Layout

| Variable name                           | Default value                                             |
|-----------------------------------------|-----------------------------------------------------------|
| `--info-box-grid-areas`                 | 'icon content button'                                     |
| `--info-box-grid-template-columns`      | auto 1fr auto                                             |
| `--info-box-grid-template-rows`         | 1fr                                                       |
| `--info-box-padding`                    | `--space-0500`                                            |
| `--info-box-border-width`               | `--border-width-2`                                        |
| `--info-box-border-radius`              | `--border-radius-0`                                       |
| `--info-box-icon-size`                  | `--icon-size-m`                                           |
| `--info-box-gap`                        | `--space-0500`                                            |
| `--info-box-row-gap`                    | `--space-0250`                                            |
| `--info-box-content-padding`            | `--space-0125` `--space-0` `--space-0` `--space-0`        |
| `--info-box-text-primary-font-weight`   | `--font-weight-bold`                                      |
| `--info-box-text-primary-line-height`   | 1.25                                                      |
| `--info-box-text-secondary-font-size`   | `--font-size-small`                                       |
| `--info-box-text-secondary-line-height` | 1.1em                                                     |
| `--info-box-outline-offset`             | `--space-0`                                               |
| `--info-box-button-height`              | `--button-ghost-icon-only-height`                         |
| `--info-box-button-width`               | `--button-ghost-icon-only-width`                          |
| `--info-box-button-border`              | `--button-ghost-border`                                   |
| `--info-box-button-border-radius`       | `--border-radius-0`                                       |
| `--info-box-button-outline-offset`      | `--button-ghost-outline-offset`                           |
| `--info-box-button-icon-size`           | `--button-ghost-icon-size`                                |

## Color

| Variable name                                 | Default value                              |
|-----------------------------------------------|--------------------------------------------|
| `--color-info-box-background`                 | `--color-region`                           |
| `--color-info-box-border`                     | `--color-chrome`                           |
| `--color-info-box-text-primary`               | `--color-data`                             |
| `--color-info-box-text-secondary`             | `--color-data`                             |
| `--color-info-box-icon`                       | `--color-data`                             |
| `--color-info-box-border-hover`               | `--color-interactive-hover-background`     |
| `--color-info-box-button-border-focus`        | `--color-button-ghost-border-focus`        |
| `--color-info-box-button-border-hover`        | `--color-button-ghost-border-hover`        |
| `--color-info-box-button-border-active`       | `--color-button-ghost-border-active`       |
| `--color-info-box-button-border-disabled`     | `--color-button-ghost-border-disabled`     |
| `--color-info-box-button-background`          | `--color-button-ghost-background`          |
| `--color-info-box-button-background-focus`    | `--color-button-ghost-background-focus`    |
| `--color-info-box-button-background-hover`    | `--color-button-ghost-background-hover`    |
| `--color-info-box-button-background-active`   | `--color-button-ghost-background-active`   |
| `--color-info-box-button-background-disabled` | `--color-button-ghost-background-disabled` |
| `--color-info-box-button-icon`                | `--color-data`                             |
| `--color-info-box-button-icon-focus`          | `--color-data`                             |
| `--color-info-box-button-icon-hover`          | `--color-button-ghost-icon-hover`          |
| `--color-info-box-button-icon-active`         | `--color-button-ghost-icon-active`         |
| `--color-info-box-button-icon-disabled`       | `--color-button-ghost-icon-disabled`       |

<br/>
Customized values per `variant`:
<br/>
<br/>

| Variant     | `--color-info-box-border`                 | `--color-info-box-background`             | `--color-info-box-icon`                   |
|-------------|-------------------------------------------|-------------------------------------------|-------------------------------------------|
| `warning`   | `--color-notification-warning-foreground` | `--color-notification-warning-background` | `--color-notification-warning-foreground` |
| `error`     | `--color-notification-error-foreground`   | `--color-notification-error-background`   | `--color-notification-error-foreground`   |
| `success`   | `--color-notification-success-foreground` | `--color-notification-success-background` | `--color-notification-success-foreground` |
