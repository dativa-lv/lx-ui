# Displayers

[← Back to Design Tokens](../DesignTokens.md)

LxMap and LxFileViewer are considered complex displayers - they have separate tokens, but appear visually similar to [complex inputs](./InputTokens.md) (LxMarkdownTextArea, LxQrScanner, LxDrawPad, LxCamera) by default. Both complex displayers and complex inputs use an [embedded toolbar](./ToolbarTokens.md).

## Layout

| Variable name                                  | Default value       |
|------------------------------------------------|---------------------|
| `--displayer-complex-row-gap`                  | `--space-0`         |
| `--displayer-complex-border-radius`            | `--border-radius-0` |
| `--displayer-complex-border-width`             | `--border-width-0`  |
| `--displayer-complex-border-style`             | solid               |
| `--displayer-complex-content-border-radius`    | `--border-radius-0` |
| `--displayer-complex-content-border-width`     | `--border-width-0`  |
| `--displayer-complex-content-border-style`     | solid               |

## Color

| Variable name                                    | Default value              |
|--------------------------------------------------|----------------------------|
| `--color-displayer-complex-background`           | `--color-input-background` |
| `--color-displayer-complex-content-background`   | transparent                |
| `--color-displayer-complex-border`               | `--color-input-border`     |
| `--color-displayer-complex-content-border`       | transparent                |