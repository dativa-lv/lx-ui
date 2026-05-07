# LxBadge

[← Back to Design Tokens](../DesignTokens.md)

## Layout

| Variable name                   | Default value                                 |
|---------------------------------|-----------------------------------------------|
| `--badge-border-width-s`        | `--border-width-2`                            |
| `--badge-text-line-height`      | 1                                             |
| `--badge-text-font-size`        | `--font-size`                                 |
| `--badge-text-font-weight`      | `--font-weight`                               |
| `--badge-border-s`              | var(--badge-border-width-s) solid transparent |
| `--badge-border-radius-s`       | `--border-radius-1000`                        |
| `--badge-padding-s`             | var(--space-0125) var(--space-0375)           |
| `--badge-padding-icon-only-s`   | `--space-0125`                                |
| `--badge-width-s`               | fit-content                                   |
| `--badge-height-s`              | auto                                          |
| `--badge-height-empty`          | 1rem                                          |
| `--badge-width-empty`           | 1rem                                          |
| `--badge-min-width-s`           | 1.5rem                                        |
| `--badge-min-height-s`          | 1.5rem                                        |
| `--badge-gap-s`                 | `--space-0250`                                |
| `--badge-icon-size-s`           | `--icon-size-xs`                              |
| `--badge-grid-template-columns` | auto 1fr                                      |
| `--badge-grid-areas`            | 'icon text'                                   |

## Color

| Variable name              | Default value    |
|----------------------------|------------------|
| `--color-badge-background` | `--color-region` |
| `--color-badge-text`       | `--color-data`   |
| `--color-badge-icon`       | `--color-data`   |


<br/>
Customized value for contrast mode:
<br />
<br />

| Variable name      | Contrast mode value                                          |
|--------------------|--------------------------------------------------------------|
| `--badge-border-s` | var(--badge-border-width-s) solid var(--contrast-foreground) |