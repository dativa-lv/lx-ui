# LxToggle

[← Back to Design Tokens](../DesignTokens.md)

### Layout

| Variable name                    | Default value                                                     |
| -------------------------------- | ----------------------------------------------------------------- |
| `--toggle-border-width-m`        | `--border-width-1`                                                |
| `--toggle-border-width-s`        | `--border-width-1`                                                |
| `--toggle-border-m`              | var(--toggle-border-width-m) solid var(--color-toggle-border-off) |
| `--toggle-border-s`              | var(--toggle-border-width-s) solid var(--color-toggle-border-off) |
| `--toggle-width-m`               | 3rem                                                              |
| `--toggle-height-m`              | 1.5rem                                                            |
| `--toggle-width-s`               | 2rem                                                              |
| `--toggle-height-s`              | 1rem                                                              |
| `--toggle-checkmark-size`        | 1.5rem                                                            |
| `--toggle-thumb-width-off-m`     | 1rem                                                              |
| `--toggle-thumb-height-off-m`    | 1rem                                                              |
| `--toggle-thumb-width-off-s`     | 0.625rem                                                          |
| `--toggle-thumb-height-off-s`    | 0.625rem                                                          |
| `--toggle-thumb-width-on-m`      | 1rem                                                              |
| `--toggle-thumb-height-on-m`     | 1rem                                                              |
| `--toggle-thumb-width-on-s`      | 0.625rem                                                          |
| `--toggle-thumb-height-on-s`     | 0.625rem                                                          |
| `--toggle-thumb-border-radius-m` | `--border-radius-full`                                            |
| `--toggle-thumb-border-radius-s` | `--border-radius-full`                                            |
| `--toggle-border-radius-m`       | `--border-radius-0750`                                            |
| `--toggle-border-radius-s`       | `--border-radius-0750`                                            |
| `--toggle-padding-right-m`       | 0.1875rem                                                         |
| `--toggle-padding-left-m`        | 0.1875rem                                                         |
| `--toggle-padding-right-s`       | 0.1875rem                                                         |
| `--toggle-padding-left-s`        | 0.1875rem                                                         |
| `--toggle-text-font-weight`      | `--font-weight`                                                   |
| `--toggle-text-font-size`        | `--small-font-size`                                               |
| `--toggle-text-line-height`      | 1.5                                                               |
| `--toggle-gap`                   | `--space-0500`                                                    |

### Color

| Variable name                         | Default value                          |
| ------------------------------------- | -------------------------------------- |
| `--color-toggle-background-off`       | `--color-region`                       |
| `--color-toggle-background-on`        | `--color-interactive-background`       |
| `--color-toggle-background-hover-off` | `--color-region`                       |
| `--color-toggle-background-hover-on`  | `--color-interactive-hover-background` |
| `--color-toggle-thumb-off`            | `--color-data`                         |
| `--color-toggle-thumb-on`             | `--color-region`                       |
| `--color-toggle-thumb-hover-off`      | `--color-interactive-hover-background` |
| `--color-toggle-thumb-hover-on`       | `--color-region`                       |
| `--color-toggle-checkmark`            | `--color-region`                       |
| `--color-toggle-checkmark-hover`      | `--color-region`                       |
| `--color-toggle-border-off`           | `--color-data`                         |
| `--color-toggle-border-on`            | transparent                            |
| `--color-toggle-border-hover-off`     | `--color-interactive-hover-background` |
| `--color-toggle-border-hover-on`      | transparent                            |
| `--color-toggle-text`                 | `--color-data`                         |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                   | Contrast mode value                   |
|---------------------------------|---------------------------------------|
| `--color-toggle-background-on`  | `--contrast-foreground`               |
| `--color-toggle-background-off` | `--contrast-background`               |
| `--color-toggle-border-off`     | `--contrast-foreground`               |