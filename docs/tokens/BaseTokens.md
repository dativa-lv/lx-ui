# Base tokens

[← Back to Design Tokens](../DesignTokens.md)

## Layout tokens

### Icon size tokens

| Variable name    | Default value |
|------------------|---------------|
| `--icon-size-xs` | 1rem          |
| `--icon-size-s`  | 1.25rem       |
| `--icon-size-m`  | 1.5rem        |
| `--icon-size-l`  | 2rem          |

### Border width tokens

| Variable name      | Default value |
|--------------------|---------------|
| `--border-width-0` | 0px           |
| `--border-width-1` | 1px           |
| `--border-width-2` | 2px           |
| `--border-width-3` | 3px           |
| `--border-width-4` | 4px           |

### Border radius tokens

| Variable name          | Default value |
|------------------------|---------------|
| `--border-radius-0`    | 0             |
| `--border-radius-0125` | 0.125rem      |
| `--border-radius-0250` | 0.25rem       |
| `--border-radius-0500` | 0.5rem        |
| `--border-radius-0750` | 0.75rem       |
| `--border-radius-1000` | 1rem          |
| `--border-radius-1500` | 1.5rem        |
| `--border-radius-2000` | 2rem          |
| `--border-radius-full` | 100vh         |

### Spacing tokens

| Variable name  | Default value |
|----------------|---------------|
| `--space-0`    | 0rem          |
| `--space-0125` | 0.125rem      |
| `--space-0250` | 0.25rem       |
| `--space-0375` | 0.375rem      |
| `--space-0500` | 0.5rem        |
| `--space-0750` | 0.75rem       |
| `--space-0875` | 0.875rem      |
| `--space-1000` | 1rem          |
| `--space-1250` | 1.25rem       |
| `--space-1500` | 1.5rem        |
| `--space-2000` | 2rem          |
| `--space-2500` | 2.5rem        |
| `--space-3000` | 3rem          |
| `--space-4000` | 4rem          |
| `--space-5000` | 5rem          |

## Color tokens

### Background colors

| Variable name        | Light mode | Dark mode |
|----------------------|------------|-----------|
| `--color-background` | #eee       | #18181a   |
| `--color-region`     | #fff       | #27282d   |
| `--color-region-2`   | #eee       | #151516   |
| `--color-chrome`     | #e0e0e0    | #35373c   |
| `--color-highlight`  | #e3ebe1    | #124c58   |

### Data colors

| Variable name                    | Light mode           | Dark mode            |
|----------------------------------|----------------------|----------------------|
| `--color-label`                  | #6c6c6c              | #979797              |
| `--color-data`                   | `--color-foreground` | `--color-foreground` |
| `--color-interactive-background` | `--color-brand`      | `--color-brand`      |

### Semantic colors

| Variable name        | Light mode       | Dark mode        |
|----------------------|------------------|------------------|
| `--color-good`       | `--color-green`  | `--color-green`  |
| `--color-success`    | `--color-green`  | `--color-green`  |
| `--color-bad`        | `--color-red`    | `--color-red`    |
| `--color-new`        | `--color-blue`   | `--color-blue`   |
| `--color-draft`      | `--color-blue`   | `--color-blue`   |
| `--color-edited`     | `--color-orange` | `--color-orange` |
| `--color-ongoing`    | `--color-orange` | `--color-orange` |
| `--color-incomplete` | `--color-blue`   | `--color-blue`   |
| `--color-waiting`    | `--color-grey`   | `--color-grey`   |
| `--color-disabled`   | #888           | #888           |
| `--color-inactive`   | `--color-grey`   | `--color-grey`   |
| `--color-finished`   | `--color-green`  | `--color-green`  |
| `--color-signed`     | `--color-purple` | `--color-purple` |
| `--color-deleted`    | `--color-grey`   | `--color-grey`   |
| `--color-error`      | `--color-red`    | `--color-red`    |
| `--color-neutral`    | `--color-grey`   | `--color-grey`   |

### Other colors

Each base color has a `-subtle` variant, meant for the backgrounds of statuses, notifications, info boxes and similar components.

| Variable name           | Light mode | Dark mode |
|-------------------------|------------|-----------|
| `--color-red`           | #cb0f19    | #ff603a   |
| `--color-red-subtle`    | #fcf0f1    | #32060a   |
| `--color-orange`        | #c04e00    | #ffab00   |
| `--color-orange-subtle` | #fcf7e6    | #302512   |
| `--color-yellow`        | #f1c21b    | #e1c21b   |
| `--color-yellow-subtle` | #fcf7e6    | #2e2516   |
| `--color-green`         | #198038    | #3da958   |
| `--color-green-subtle`  | #f0fff4    | #112217   |
| `--color-teal`          | #036e81    | #00b8d9   |
| `--color-teal-subtle`   | #f0fcff    | #092b2f   |
| `--color-blue`          | #0062eb    | #4c9aff   |
| `--color-blue-subtle`   | #f0f5fc    | #0d233e   |
| `--color-purple`        | #6554c0    | #9d92d6   |
| `--color-purple-subtle` | #f2f0ff    | #160f3c   |
| `--color-grey`          | #6c6c6c    | #979797   |
| `--color-grey-subtle`   | #f7f7f7    | #0d0d0d   |
