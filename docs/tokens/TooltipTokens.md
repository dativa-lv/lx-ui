# LxTooltip

[← Back to Design Tokens](../DesignTokens.md)

> **Note:** `LxTooltip` and [LxInfoWrapper](./InfoWrapperTokens.md) share the same panel markup
> (`.lx-info-wrapper` / `.lx-info-wrapper-panel`) and live in the same style file -
> `lx-info-wrappers.css`. The `--tooltip-*` tokens below apply to the tooltip variant
> (`lx-tooltip-kind`) only.

## Layout

| Variable name               | Default value                 |
| --------------------------- | ----------------------------- |
| `--tooltip-padding`         | `--space-0250` `--space-0500` |
| `--tooltip-border-width`    | `--border-width-0`            |
| `--tooltip-border-style`    | solid                         |
| `--tooltip-border-radius`   | `--border-radius-0`           |
| `--tooltip-shadow`          | none                          |
| `--tooltip-max-width`       | `--aside-size`                |
| `--tooltip-min-width`       | 2.5rem                        |
| `--tooltip-text-font-size`  | `--font-size-label`           |

## Color

| Variable name                    | Default value |
| -------------------------------- | ------------- |
| `--color-tooltip-background`     | #333          |
| `--color-tooltip-border`         | transparent   |
| `--color-tooltip-text-primary`   | #fff          |
| `--color-tooltip-text-secondary` | #cccccc       |

<br/>
Customized values for dark mode:
<br />
<br />

| Variable name                | Dark mode value |
| ---------------------------- | --------------- |
| `--color-tooltip-background` | #000            |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                    | Contrast mode value      |
| -------------------------------- | ------------------------ |
| `--color-tooltip-background`     | `--contrast-interactive` |
| `--color-tooltip-text-primary`   | `--contrast-background`  |
| `--color-tooltip-text-secondary` | `--contrast-background`  |
