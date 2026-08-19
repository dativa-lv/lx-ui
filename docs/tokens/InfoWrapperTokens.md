# LxInfoWrapper

[← Back to Design Tokens](../DesignTokens.md)

> **Note:** `LxInfoWrapper` and [LxTooltip](./TooltipTokens.md) share the same panel markup
> (`.lx-info-wrapper` / `.lx-info-wrapper-panel`) and live in the same style file -
> `lx-info-wrappers.css`. The `--info-wrapper-*` tokens below apply to the rich panel
> (`lx-rich-kind`); the tooltip variant (`lx-tooltip-kind`) is tokenized separately.

## Layout

| Variable name                               | Default value       |
| ------------------------------------------- | ------------------- |
| `--info-wrapper-padding`                    | `--space-0500`      |
| `--info-wrapper-gap`                        | `--space-0500`      |
| `--info-wrapper-row-gap`                    | `--space-0`         |
| `--info-wrapper-border-width`               | `--border-width-0`  |
| `--info-wrapper-border-style`               | solid               |
| `--info-wrapper-border-radius`              | `--border-radius-0` |
| `--info-wrapper-shadow`                     | none                |
| `--info-wrapper-max-width`                  | `--aside-size`      |
| `--info-wrapper-min-width`                  | 2.5rem              |
| `--info-wrapper-text-primary-font-size`     | inherit             |
| `--info-wrapper-text-primary-font-weight`   | `--data-weight`     |
| `--info-wrapper-text-secondary-font-size`   | `--label-font-size` |
| `--info-wrapper-text-secondary-font-weight` | inherit             |

> **Note:** `--info-wrapper-gap` spaces the root elements of the `panel` slot, so it only has an
> effect when that slot supplies more than one of them. For the gap between a panel row's label and
> its content, use `--info-wrapper-row-gap` instead.

## Color

| Variable name                                   | Default value                        |
|-------------------------------------------------|--------------------------------------|
| `--color-info-wrapper-background`               | `--color-tooltip-background`         |
| `--color-info-wrapper-border`                   | transparent                          |
| `--color-info-wrapper-content-background-hover` | `--color-data-grid-background-hover` |
| `--color-info-wrapper-text-primary`             | `--color-tooltip-text-primary`       |
| `--color-info-wrapper-text-secondary`           | `--color-tooltip-text-secondary`     |

## Bottom sheet

At viewport widths below 500px, the panel is replaced by a bottom sheet — a full-width surface with a drag handle,
a close button and its own scroll shadows. Those surrounding parts — the handle, the close button and the
shadows — are **not** exclusive to `LxInfoWrapper`: `LxDropDownMenu` and the date pickers render the same
markup. That is why the sheet has its own `--sheet-*` namespace, with defaults pointing back at the
`--info-wrapper-*` values where the two should match.

### Layout

| Variable name                           | Default value                                               |
| --------------------------------------- | ----------------------------------------------------------- |
| `--sheet-border-radius`                 | `--info-wrapper-border-radius`                              |
| `--sheet-padding`                       | `--space-0500` `--space-1000` `--space-1000` `--space-1000` |
| `--sheet-header-padding`                | `--space-0`                                                 |
| `--sheet-header-border-width`           | `--border-width-1`                                          |
| `--sheet-handle-icon-size`              | `--icon-size-l`                                             |
| `--sheet-button-height`                 | `--button-ghost-icon-only-height`                           |
| `--sheet-button-width`                  | `--button-ghost-icon-only-width`                            |
| `--sheet-button-min-width`              | `--space-3000`                                              |
| `--sheet-button-border`                 | `--button-ghost-border`                                     |
| `--sheet-button-border-radius`          | `--button-ghost-border-radius`                              |
| `--sheet-button-outline-offset`         | `--button-ghost-outline-offset`                             |
| `--sheet-button-icon-size`              | `--button-ghost-icon-size`                                  |

### Color

| Variable name                              | Default value                              |
| ------------------------------------------ | ------------------------------------------ |
| `--color-sheet-background`                 | `--color-info-wrapper-background`          |
| `--color-sheet-scroll-shadow`              | `--color-tooltip-background`               |
| `--color-sheet-header-background`          | `--color-tooltip-background`               |
| `--color-sheet-header-border`              | `--color-chrome`                           |
| `--color-sheet-handle-icon`                | `--color-label`                            |
| `--color-sheet-button-icon`                | `--color-nav-foreground`                   |
| `--color-sheet-button-icon-focus`          | `--color-sheet-button-icon`                |
| `--color-sheet-button-icon-hover`          | `--color-sheet-button-icon`                |
| `--color-sheet-button-icon-active`         | `--color-button-ghost-icon-active`         |
| `--color-sheet-button-background`          | `--color-button-ghost-background`          |
| `--color-sheet-button-background-focus`    | `--color-button-ghost-background-focus`    |
| `--color-sheet-button-background-hover`    | `--color-button-ghost-background-hover`    |
| `--color-sheet-button-background-active`   | `--color-button-ghost-background-active`   |
| `--color-sheet-button-border-focus`        | `--color-button-ghost-border-focus`        |
| `--color-sheet-button-border-hover`        | `--color-button-ghost-border-hover`        |
| `--color-sheet-button-border-active`       | `--color-button-ghost-border-active`       |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name               | Contrast mode value     |
| --------------------------- | ----------------------- |
| `--color-sheet-handle-icon` | `--contrast-background` |
| `--color-sheet-button-icon` | `--contrast-background` |

<br/>
Customized values for no-transparency mode:
<br />
<br />

| Variable name                  | No-transparency mode value |
| ------------------------------ | -------------------------- |
| `--sheet-header-border-width`  | `--border-width-2`         |
