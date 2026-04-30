# Buttons

[← Back to Design Tokens](../DesignTokens.md)

## Layout

| Variable name                                      | Default value                                                              |
|----------------------------------------------------|----------------------------------------------------------------------------|
| `--button-cursor`                                  | pointer                                                                    |
| `--button-badge-padding`                           | var(--space-0) var(--space-0250)                                           |
| `--button-icon-justify`                            | center                                                                     |
| `--button-loader-margin`                           | `--space-0`                                                                |
| `--button-set-gap`                                 | `--space-0500`                                                             |
| `--button-dropdown-align`                          | center                                                                     |
| `--button-dropdown-border`                         | var(--border-width-2) solid var(--color-button-dropdown-background)        |
| `--button-dropdown-border-radius`                  | `--border-radius-default`                                                  |
| `--button-dropdown-font-size`                      | inherit                                                                    |
| `--button-dropdown-font-weight`                    | `--font-weight-interactive`                                                |
| `--button-dropdown-gap`                            | `--space-0750`                                                             |
| `--button-dropdown-grid-areas`                     | 'content icon'                                                             |
| `--button-dropdown-grid-template-columns`          | 1fr auto                                                                   |
| `--button-dropdown-grid-template-rows`             | 1fr                                                                        |
| `--button-dropdown-height`                         | `--row-size-dynamic`                                                       |
| `--button-dropdown-icon-size`                      | `--icon-size-m`                                                            |
| `--button-dropdown-margin`                         | `--space-0`                                                                |
| `--button-dropdown-min-width`                      | `--row-size`                                                               |
| `--button-dropdown-outline-offset`                 | -2px                                                                       |
| `--button-dropdown-padding`                        | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-dropdown-set-gap`                        | `--space-0125`                                                             |
| `--button-dropdown-text-align`                     | left                                                                       |
| `--button-dropdown-text-decoration`                | none                                                                       |
| `--button-dropdown-width`                          | 100%                                                                       |
| `--button-toolbar-group-gap`                       | `--space-0`                                                                |
| `--button-toolbar-gap`                             | `--space-0`                                                                |
| `--button-toolbar-primary-align`                   | center                                                                     |
| `--button-toolbar-primary-border`                  | var(--border-width-2) solid var(--color-button-toolbar-primary-background) |
| `--button-toolbar-primary-border-radius`           | `--border-radius-default`                                                  |
| `--button-toolbar-primary-font-size`               | inherit                                                                    |
| `--button-toolbar-primary-font-weight`             | `--font-weight-interactive`                                                |
| `--button-toolbar-primary-gap`                     | `--space-0750`                                                             |
| `--button-toolbar-primary-grid-areas`              | 'content icon'                                                             |
| `--button-toolbar-primary-grid-template-columns`   | minmax(max-content, 1fr) auto                                              |
| `--button-toolbar-primary-grid-template-rows`      | 1fr                                                                        |
| `--button-toolbar-primary-height`                  | `--row-size`                                                               |
| `--button-toolbar-primary-icon-size`               | `--icon-size-m`                                                            |
| `--button-toolbar-primary-margin`                  | `--space-0`                                                                |
| `--button-toolbar-primary-min-width`               | `--row-size`                                                               |
| `--button-toolbar-primary-outline-offset`          | 0                                                                          |
| `--button-toolbar-primary-padding`                 | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-toolbar-primary-text-align`              | left                                                                       |
| `--button-toolbar-primary-text-decoration`         | none                                                                       |
| `--button-toolbar-primary-width`                   | 100%                                                                       |
| `--button-toolbar-secondary-align`                 | center                                                                     |
| `--button-toolbar-secondary-border`                | var(--border-width-2) solid var(--color-interactive-secondary-background)  |
| `--button-toolbar-secondary-border-radius`         | `--border-radius-default`                                                  |
| `--button-toolbar-secondary-font-size`             | inherit                                                                    |
| `--button-toolbar-secondary-font-weight`           | `--font-weight-interactive`                                                |
| `--button-toolbar-secondary-gap`                   | `--space-0750`                                                             |
| `--button-toolbar-secondary-grid-areas`            | 'content icon'                                                             |
| `--button-toolbar-secondary-grid-template-columns` | minmax(max-content, 1fr) auto                                              |
| `--button-toolbar-secondary-grid-template-rows`    | 1fr                                                                        |
| `--button-toolbar-secondary-height`                | `--row-size`                                                               |
| `--button-toolbar-secondary-icon-size`             | `--icon-size-m`                                                            |
| `--button-toolbar-secondary-margin`                | `--space-0`                                                                |
| `--button-toolbar-secondary-min-width`             | `--row-size`                                                               |
| `--button-toolbar-secondary-outline-offset`        | 0                                                                          |
| `--button-toolbar-secondary-padding`               | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-toolbar-secondary-text-align`            | left                                                                       |
| `--button-toolbar-secondary-text-decoration`       | none                                                                       |
| `--button-toolbar-secondary-width`                 | auto                                                                       |
| `--button-toolbar-tertiary-align`                  | center                                                                     |
| `--button-toolbar-tertiary-border`                 | var(--border-width-2) solid var(--color-interactive-background)            |
| `--button-toolbar-tertiary-border-radius`          | `--border-radius-default`                                                  |
| `--button-toolbar-tertiary-font-size`              | inherit                                                                    |
| `--button-toolbar-tertiary-font-weight`            | `--font-weight-interactive`                                                |
| `--button-toolbar-tertiary-gap`                    | `--space-0750`                                                             |
| `--button-toolbar-tertiary-grid-areas`             | 'content icon'                                                             |
| `--button-toolbar-tertiary-grid-template-columns`  | 1fr auto                                                                   |
| `--button-toolbar-tertiary-grid-template-rows`     | 1fr                                                                        |
| `--button-toolbar-tertiary-height`                 | `--row-size`                                                               |
| `--button-toolbar-tertiary-icon-size`              | `--icon-size-m`                                                            |
| `--button-toolbar-tertiary-margin`                 | `--space-0`                                                                |
| `--button-toolbar-tertiary-min-width`              | `--row-size`                                                               |
| `--button-toolbar-tertiary-outline-offset`         | 0                                                                          |
| `--button-toolbar-tertiary-padding`                | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-toolbar-tertiary-text-align`             | left                                                                       |
| `--button-toolbar-tertiary-text-decoration`        | none                                                                       |
| `--button-toolbar-tertiary-width`                  | auto                                                                       |
| `--button-toolbar-ghost-align`                     | center                                                                     |
| `--button-toolbar-ghost-border`                    | var(--border-width-2) solid transparent                                    |
| `--button-toolbar-ghost-border-radius`             | `--border-radius-default`                                                  |
| `--button-toolbar-ghost-font-size`                 | inherit                                                                    |
| `--button-toolbar-ghost-font-weight`               | `--font-weight-interactive`                                                |
| `--button-toolbar-ghost-gap`                       | `--space-0750`                                                             |
| `--button-toolbar-ghost-grid-areas`                | 'content icon'                                                             |
| `--button-toolbar-ghost-grid-template-columns`     | 1fr auto                                                                   |
| `--button-toolbar-ghost-grid-template-rows`        | 1fr                                                                        |
| `--button-toolbar-ghost-height`                    | `--row-size`                                                               |
| `--button-toolbar-ghost-icon-size`                 | `--icon-size-m`                                                            |
| `--button-toolbar-ghost-margin`                    | `--space-0`                                                                |
| `--button-toolbar-ghost-min-width`                 | `--row-size`                                                               |
| `--button-toolbar-ghost-outline-offset`            | -2px                                                                       |
| `--button-toolbar-ghost-padding`                   | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-toolbar-ghost-text-align`                | left                                                                       |
| `--button-toolbar-ghost-text-decoration`           | none                                                                       |
| `--button-toolbar-ghost-width`                     | auto                                                                       |
| `--button-toolbar-selection-align`                 | center                                                                     |
| `--button-toolbar-selection-border`                | var(--border-width-2) solid transparent                                    |
| `--button-toolbar-selection-border-radius`         | `--border-radius-default`                                                  |
| `--button-toolbar-selection-font-size`             | inherit                                                                    |
| `--button-toolbar-selection-font-weight`           | `--font-weight-interactive`                                                |
| `--button-toolbar-selection-gap`                   | `--space-0750`                                                             |
| `--button-toolbar-selection-grid-areas`            | 'content icon'                                                             |
| `--button-toolbar-selection-grid-template-columns` | minmax(max-content, 1fr) auto                                              |
| `--button-toolbar-selection-grid-template-rows`    | 1fr                                                                        |
| `--button-toolbar-selection-height`                | `--row-size`                                                               |
| `--button-toolbar-selection-icon-size`             | `--icon-size-m`                                                            |
| `--button-toolbar-selection-margin`                | `--space-0`                                                                |
| `--button-toolbar-selection-min-width`             | `--row-size`                                                               |
| `--button-toolbar-selection-outline-offset`        | -2px                                                                       |
| `--button-toolbar-selection-padding`               | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-toolbar-selection-text-align`            | left                                                                       |
| `--button-toolbar-selection-text-decoration`       | none                                                                       |
| `--button-toolbar-selection-width`                 | auto                                                                       |
| `--button-toolbar-selection-icon-only-height`      | `--button-toolbar-selection-height`                                        |
| `--button-toolbar-selection-icon-only-min-width`   | `--button-toolbar-selection-min-width`                                     |
| `--button-toolbar-selection-icon-only-padding`     | `--space-0`                                                                |
| `--button-toolbar-selection-icon-only-width`       | auto                                                                       |
| `--button-toolbar-primary-icon-only-height`        | `--button-toolbar-primary-height`                                          |
| `--button-toolbar-primary-icon-only-min-width`     | `--button-toolbar-primary-min-width`                                       |
| `--button-toolbar-primary-icon-only-padding`       | `--space-0`                                                                |
| `--button-toolbar-primary-icon-only-width`         | auto                                                                       |
| `--button-toolbar-secondary-icon-only-height`      | `--button-toolbar-secondary-height`                                        |
| `--button-toolbar-secondary-icon-only-min-width`   | `--button-toolbar-secondary-min-width`                                     |
| `--button-toolbar-secondary-icon-only-padding`     | `--space-0`                                                                |
| `--button-toolbar-secondary-icon-only-width`       | auto                                                                       |
| `--button-toolbar-tertiary-icon-only-height`       | `--button-toolbar-tertiary-height`                                         |
| `--button-toolbar-tertiary-icon-only-min-width`    | `--button-toolbar-tertiary-min-width`                                      |
| `--button-toolbar-tertiary-icon-only-padding`      | `--space-0`                                                                |
| `--button-toolbar-tertiary-icon-only-width`        | auto                                                                       |
| `--button-toolbar-ghost-icon-only-height`          | `--button-toolbar-ghost-height`                                            |
| `--button-toolbar-ghost-icon-only-min-width`       | `--button-toolbar-ghost-min-width`                                         |
| `--button-toolbar-ghost-icon-only-padding`         | `--space-0`                                                                |
| `--button-toolbar-ghost-icon-only-width`           | auto                                                                       |
| `--button-nav-align`                               | center                                                                     |
| `--button-nav-border`                              | var(--border-width-2) solid transparent                                    |
| `--button-nav-border-radius`                       | `--border-radius-0`                                                        |
| `--button-nav-font-size`                           | inherit                                                                    |
| `--button-nav-font-weight`                         | `--font-weight-interactive`                                                |
| `--button-nav-gap`                                 | `--space-0750`                                                             |
| `--button-nav-grid-areas`                          | 'icon content'                                                             |
| `--button-nav-grid-template-columns`               | auto 1fr                                                                   |
| `--button-nav-grid-template-rows`                  | 1fr                                                                        |
| `--button-nav-height`                              | `--row-size`                                                               |
| `--button-nav-icon-size`                           | `--icon-size-m`                                                            |
| `--button-nav-margin`                              | `--space-0`                                                                |
| `--button-nav-min-width`                           | `--row-size`                                                               |
| `--button-nav-outline-offset`                      | -2px                                                                       |
| `--button-nav-padding`                             | var(--space-0) calc(var(--space-0750) - var(--border-width-2))             |
| `--button-nav-text-align`                          | left                                                                       |
| `--button-nav-text-decoration`                     | none                                                                       |
| `--button-nav-width`                               | 100%                                                                       |
| `--button-nav-public-align`                        | center                                                                     |
| `--button-nav-public-border`                       | `--border-width-0`                                                         |
| `--button-nav-public-border-radius`                | `--border-radius-0`                                                        |
| `--button-nav-public-font-size`                    | inherit                                                                    |
| `--button-nav-public-font-weight`                  | `--font-weight-interactive`                                                |
| `--button-nav-public-gap`                          | `--space-0750`                                                             |
| `--button-nav-public-grid-areas`                   | 'content'                                                                  |
| `--button-nav-public-grid-template-columns`        | 1fr                                                                        |
| `--button-nav-public-grid-template-rows`           | 1fr                                                                        |
| `--button-nav-public-height`                       | calc(var(--row-size) - 1.35px)                                             |
| `--button-nav-public-icon-size`                    | `--icon-size-m`                                                            |
| `--button-nav-public-margin`                       | `--space-0`                                                                |
| `--button-nav-public-min-width`                    | `--row-size`                                                               |
| `--button-nav-public-outline-offset`               | -2px                                                                       |
| `--button-nav-public-padding`                      | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-nav-public-text-align`                   | center                                                                     |
| `--button-nav-public-text-decoration`              | none                                                                       |
| `--button-nav-public-width`                        | auto                                                                       |
| `--button-modal-primary-align`                     | center                                                                     |
| `--button-modal-primary-border`                    | var(--border-width-2) solid var(--color-button-dropdown-background)        |
| `--button-modal-primary-border-radius`             | `--border-radius-0`                                                        |
| `--button-modal-primary-font-size`                 | inherit                                                                    |
| `--button-modal-primary-font-weight`               | `--font-weight-interactive`                                                |
| `--button-modal-primary-height`                    | auto                                                                       |
| `--button-modal-primary-margin`                    | `--space-0`                                                                |
| `--button-modal-primary-min-width`                 | `--row-size`                                                               |
| `--button-modal-primary-outline-offset`            | 0                                                                          |
| `--button-modal-primary-padding`                   | var(--space-1000)  calc(var(--space-1000) - var(--border-width-2))         |
| `--button-modal-primary-text-align`                | left                                                                       |
| `--button-modal-primary-text-decoration`           | none                                                                       |
| `--button-modal-primary-width`                     | auto                                                                       |
| `--button-modal-secondary-align`                   | center                                                                     |
| `--button-modal-secondary-border`                  | var(--border-width-2) solid var(--color-button-dropdown-background)        |
| `--button-modal-secondary-border-radius`           | `--border-radius-0`                                                        |
| `--button-modal-secondary-font-size`               | inherit                                                                    |
| `--button-modal-secondary-font-weight`             | `--font-weight-interactive`                                                |
| `--button-modal-secondary-height`                  | auto                                                                       |
| `--button-modal-secondary-margin`                  | `--space-0`                                                                |
| `--button-modal-secondary-min-width`               | `--row-size`                                                               |
| `--button-modal-secondary-outline-offset`          | 0                                                                          |
| `--button-modal-secondary-padding`                 | var(--space-1000)  calc(var(--space-1000) - var(--border-width-2))         |
| `--button-modal-secondary-text-align`              | left                                                                       |
| `--button-modal-secondary-text-decoration`         | none                                                                       |
| `--button-modal-secondary-width`                   | 100%                                                                       |
| `--button-modal-set-flex-direction`                | row-reverse                                                                |
| `--button-modal-set-gap`                           | `--space-0`                                                                |
| `--button-modal-set-justify`                       | stretch                                                                    |
| `--button-modal-set-margin`                        | `--space-0`                                                                |
| `--button-modal-set-padding`                       | `--space-0`                                                                |
| `--button-primary-align`                           | center                                                                     |
| `--button-primary-badge-inset`                     | -0.625rem -0.625rem auto auto                                              |
| `--button-primary-empty-badge-inset`               | calc(var(--space-0500) * -1) calc(var(--space-0500) * -1) auto auto        |
| `--button-primary-border`                          | var(--border-width-2) solid var(--color-interactive-background)            |
| `--button-primary-border-radius`                   | `--border-radius-default`                                                  |
| `--button-primary-font-size`                       | inherit                                                                    |
| `--button-primary-font-weight`                     | `--font-weight-interactive`                                                |
| `--button-primary-gap`                             | `--space-0750`                                                             |
| `--button-primary-grid-areas`                      | 'content icon'                                                             |
| `--button-primary-grid-template-columns`           | 1fr auto                                                                   |
| `--button-primary-grid-template-rows`              | 1fr                                                                        |
| `--button-primary-height`                          | `--row-size`                                                               |
| `--button-primary-icon-size`                       | `--icon-size-m`                                                            |
| `--button-primary-margin`                          | `--space-0`                                                                |
| `--button-primary-min-width`                       | `--row-size`                                                               |
| `--button-primary-outline-offset`                  | 0                                                                          |
| `--button-primary-padding`                         | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-primary-text-align`                      | left                                                                       |
| `--button-primary-text-decoration`                 | none                                                                       |
| `--button-primary-width`                           | auto                                                                       |
| `--button-primary-icon-only-height`                | `--button-primary-height`                                                  |
| `--button-primary-icon-only-min-width`             | `--button-primary-min-width`                                               |
| `--button-primary-icon-only-padding`               | `--space-0`                                                                |
| `--button-primary-icon-only-width`                 | auto                                                                       |
| `--button-secondary-align`                         | center                                                                     |
| `--button-secondary-badge-inset`                   | -0.625rem -0.625rem auto auto                                              |
| `--button-secondary-empty-badge-inset`             | calc(var(--space-0500) * -1) calc(var(--space-0500) * -1) auto auto        |
| `--button-secondary-border`                        | var(--border-width-2) solid var(--color-interactive-secondary-background)  |
| `--button-secondary-border-radius`                 | `--border-radius-default`                                                  |
| `--button-secondary-font-size`                     | inherit                                                                    |
| `--button-secondary-font-weight`                   | `--font-weight-interactive`                                                |
| `--button-secondary-gap`                           | `--space-0750`                                                             |
| `--button-secondary-grid-areas`                    | 'content icon'                                                             |
| `--button-secondary-grid-template-columns`         | 1fr auto                                                                   |
| `--button-secondary-grid-template-rows`            | 1fr                                                                        |
| `--button-secondary-height`                        | `--row-size`                                                               |
| `--button-secondary-icon-size`                     | `--icon-size-m`                                                            |
| `--button-secondary-margin`                        | `--space-0`                                                                |
| `--button-secondary-min-width`                     | `--row-size`                                                               |
| `--button-secondary-outline-offset`                | 0                                                                          |
| `--button-secondary-padding`                       | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-secondary-text-align`                    | left                                                                       |
| `--button-secondary-text-decoration`               | none                                                                       |
| `--button-secondary-width`                         | auto                                                                       |
| `--button-secondary-icon-only-height`              | `--button-secondary-height`                                                |
| `--button-secondary-icon-only-min-width`           | `--button-secondary-min-width`                                             |
| `--button-secondary-icon-only-padding`             | `--space-0`                                                                |
| `--button-secondary-icon-only-width`               | auto                                                                       |
| `--button-tertiary-align`                          | center                                                                     |
| `--button-tertiary-badge-inset`                    | -0.625rem -0.625rem auto auto                                              |
| `--button-tertiary-empty-badge-inset`              | calc(var(--space-0500) * -1) calc(var(--space-0500) * -1) auto auto        |
| `--button-tertiary-border`                         | var(--border-width-2) solid var(--color-interactive-background)            |
| `--button-tertiary-border-radius`                  | `--border-radius-default`                                                  |
| `--button-tertiary-font-size`                      | inherit                                                                    |
| `--button-tertiary-font-weight`                    | `--font-weight-interactive`                                                |
| `--button-tertiary-gap`                            | `--space-0750`                                                             |
| `--button-tertiary-grid-areas`                     | 'content icon'                                                             |
| `--button-tertiary-grid-template-columns`          | 1fr auto                                                                   |
| `--button-tertiary-grid-template-rows`             | 1fr                                                                        |
| `--button-tertiary-height`                         | `--row-size`                                                               |
| `--button-tertiary-icon-size`                      | `--icon-size-m`                                                            |
| `--button-tertiary-margin`                         | `--space-0`                                                                |
| `--button-tertiary-min-width`                      | `--row-size`                                                               |
| `--button-tertiary-outline-offset`                 | 0                                                                          |
| `--button-tertiary-padding`                        | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-tertiary-text-align`                     | left                                                                       |
| `--button-tertiary-text-decoration`                | none                                                                       |
| `--button-tertiary-width`                          | auto                                                                       |
| `--button-tertiary-icon-only-height`               | `--button-tertiary-height`                                                 |
| `--button-tertiary-icon-only-min-width`            | `--button-tertiary-min-width`                                              |
| `--button-tertiary-icon-only-padding`              | `--space-0`                                                                |
| `--button-tertiary-icon-only-width`                | auto                                                                       |
| `--button-ghost-align`                             | center                                                                     |
| `--button-ghost-badge-inset`                       | calc(var(--space-0125) * -1) calc(var(--space-0125) * -1) auto auto        |
| `--button-ghost-empty-badge-inset`                 | calc(var(--space-0125) * -1) calc(var(--space-0125) * -1) auto auto        |
| `--button-ghost-border`                            | var(--border-width-2) solid transparent                                    |
| `--button-ghost-border-radius`                     | `--border-radius-default`                                                  |
| `--button-ghost-font-size`                         | inherit                                                                    |
| `--button-ghost-font-weight`                       | `--font-weight-interactive`                                                |
| `--button-ghost-gap`                               | `--space-0750`                                                             |
| `--button-ghost-grid-areas`                        | 'content icon'                                                             |
| `--button-ghost-grid-template-columns`             | 1fr auto                                                                   |
| `--button-ghost-grid-template-rows`                | 1fr                                                                        |
| `--button-ghost-height`                            | `--row-size`                                                               |
| `--button-ghost-icon-size`                         | `--icon-size-m`                                                            |
| `--button-ghost-margin`                            | `--space-0`                                                                |
| `--button-ghost-min-width`                         | `--row-size`                                                               |
| `--button-ghost-outline-offset`                    | -2px                                                                       |
| `--button-ghost-padding`                           | var(--space-0) calc(var(--space-1000) - var(--border-width-2))             |
| `--button-ghost-text-align`                        | left                                                                       |
| `--button-ghost-text-decoration`                   | none                                                                       |
| `--button-ghost-width`                             | auto                                                                       |
| `--button-ghost-icon-only-height`                  | `--button-ghost-height`                                                    |
| `--button-ghost-icon-only-min-width`               | `--button-ghost-min-width`                                                 |
| `--button-ghost-icon-only-padding`                 | `--space-0`                                                                |
| `--button-ghost-icon-only-width`                   | auto                                                                       |

## Color

| Variable name                                          | Default value                                          |
|--------------------------------------------------------|--------------------------------------------------------|
| `--color-button-active-mode`                           | `--color-data`                                         |
| `--color-button-active-mode-background`                | `--color-highlight`                                    |
| `--color-button-active-mode-border`                    | `--color-button-active-mode-background`                |
| `--color-button-active-mode-icon`                      | `--color-button-active-mode`                           |
| `--color-button-destructive`                           | `--color-interactive-foreground`                       |
| `--color-button-destructive-background`                | `--color-destructive`                                  |
| `--color-button-destructive-border`                    | `--color-button-destructive-background`                |
| `--color-button-destructive-icon`                      | `--color-button-destructive`                           |
| `--color-button-dropdown`                              | `--color-data`                                         |
| `--color-button-dropdown-background`                   | transparent                                            |
| `--color-button-dropdown-active`                       | `--color-interactive-active-foreground`                |
| `--color-button-dropdown-active-background`            | `--color-interactive-active-background`                |
| `--color-button-dropdown-active-border`                | `--color-button-dropdown-active-background`            |
| `--color-button-dropdown-disabled`                     | `--color-disabled-foreground`                          |
| `--color-button-dropdown-disabled-background`          | transparent                                            |
| `--color-button-dropdown-disabled-border`              | transparent                                            |
| `--color-button-dropdown-focus`                        | `--color-data`                                         |
| `--color-button-dropdown-focus-background`             | `--color-button-dropdown-background`                   |
| `--color-button-dropdown-focus-border`                 | `--color-button-dropdown-focus-background`             |
| `--color-button-dropdown-hover`                        | `--color-data`                                         |
| `--color-button-dropdown-hover-background`             | `--color-region-hover`                                 |
| `--color-button-dropdown-hover-border`                 | `--color-button-dropdown-hover-background`             |
| `--color-button-dropdown-icon`                         | `--color-button-dropdown`                              |
| `--color-button-dropdown-icon-active`                  | `--color-interactive-active-foreground`                |
| `--color-button-dropdown-icon-disabled`                | `--color-disabled-foreground`                          |
| `--color-button-dropdown-icon-focus`                   | `--color-button-dropdown-focus`                        |
| `--color-button-dropdown-icon-hover`                   | `--color-button-dropdown-hover`                        |
| `--color-button-toolbar-primary`                       | `color-interactive-foreground`                         |
| `--color-button-toolbar-primary-background`            | `color-interactive-background`                         |
| `--color-button-toolbar-primary-focus`                 | `color-button-toolbar-primary`                         |
| `--color-button-toolbar-primary-focus-background`      | `color-button-toolbar-primary-background`              |
| `--color-button-toolbar-primary-focus-border`          | `color-background`                                     |
| `--color-button-toolbar-primary-active`                | `color-interactive-active-foreground`                  |
| `--color-button-toolbar-primary-active-background`     | `color-interactive-active-background`                  |
| `--color-button-toolbar-primary-active-border`         | `color-button-toolbar-primary-focus-border`            |
| `--color-button-toolbar-primary-disabled`              | `color-disabled-foreground`                            |
| `--color-button-toolbar-primary-disabled-background`   | `color-disabled-background`                            |
| `--color-button-toolbar-primary-disabled-border`       | `color-button-toolbar-primary-disabled-background`     |
| `--color-button-toolbar-primary-hover`                 | `color-interactive-hover-foreground`                   |
| `--color-button-toolbar-primary-hover-background`      | `color-interactive-hover-background`                   |
| `--color-button-toolbar-primary-hover-border`          | `color-button-toolbar-primary-hover-background`        |
| `--color-button-toolbar-primary-icon`                  | `color-interactive-foreground`                         |
| `--color-button-toolbar-primary-icon-active`           | `color-interactive-active-foreground`                  |
| `--color-button-toolbar-primary-icon-disabled`         | `color-disabled-foreground`                            |
| `--color-button-toolbar-primary-icon-focus`            | `color-interactive-foreground`                         |
| `--color-button-toolbar-primary-icon-hover`            | `color-interactive-hover-foreground`                   |
| `--color-button-toolbar-secondary`                     | `color-interactive-secondary-foreground`               |
| `--color-button-toolbar-secondary-background`          | `color-interactive-secondary-background`               |
| `--color-button-toolbar-secondary-focus`               | `color-button-toolbar-secondary`                       |
| `--color-button-toolbar-secondary-focus-background`    | `color-button-toolbar-secondary-background`            |
| `--color-button-toolbar-secondary-focus-border`        | `color-background`                                     |
| `--color-button-toolbar-secondary-active`              | `color-interactive-active-foreground`                  |
| `--color-button-toolbar-secondary-active-background`   | `color-interactive-active-background`                  |
| `--color-button-toolbar-secondary-active-border`       | `color-button-toolbar-secondary-focus-border`          |
| `--color-button-toolbar-secondary-disabled`            | `color-disabled-foreground`                            |
| `--color-button-toolbar-secondary-disabled-background` | `color-disabled-background`                            |
| `--color-button-toolbar-secondary-disabled-border`     | `color-button-toolbar-secondary-disabled-background`   |
| `--color-button-toolbar-secondary-hover`               | `color-interactive-hover-foreground`                   |
| `--color-button-toolbar-secondary-hover-background`    | `color-interactive-hover-background`                   |
| `--color-button-toolbar-secondary-hover-border`        | `color-button-toolbar-secondary-hover-background`      |
| `--color-button-toolbar-secondary-icon`                | `color-button-toolbar-secondary`                       |
| `--color-button-toolbar-secondary-icon-active`         | `color-interactive-active-foreground`                  |
| `--color-button-toolbar-secondary-icon-disabled`       | `color-disabled-foreground`                            |
| `--color-button-toolbar-secondary-icon-focus`          | `color-interactive-secondary-foreground`               |
| `--color-button-toolbar-secondary-icon-hover`          | `color-interactive-hover-foreground`                   |
| `--color-button-toolbar-tertiary`                      | `color-interactive-background`                         |
| `--color-button-toolbar-tertiary-background`           | `transparent`                                          |
| `--color-button-toolbar-tertiary-focus`                | `color-button-toolbar-tertiary`                        |
| `--color-button-toolbar-tertiary-focus-background`     | `color-button-toolbar-tertiary-background`             |
| `--color-button-toolbar-tertiary-focus-border`         | `color-focus-background`                               |
| `--color-button-toolbar-tertiary-active`               | `color-interactive-active-foreground`                  |
| `--color-button-toolbar-tertiary-active-background`    | `color-interactive-active-background`                  |
| `--color-button-toolbar-tertiary-active-border`        | `color-button-toolbar-tertiary-active-background`      |
| `--color-button-toolbar-tertiary-disabled`             | `color-disabled-foreground`                            |
| `--color-button-toolbar-tertiary-disabled-background`  | `transparent`                                          |
| `--color-button-toolbar-tertiary-disabled-border`      | `color-button-toolbar-tertiary-disabled`               |
| `--color-button-toolbar-tertiary-hover`                | `color-interactive-hover-foreground`                   |
| `--color-button-toolbar-tertiary-hover-background`     | `color-interactive-hover-background`                   |
| `--color-button-toolbar-tertiary-hover-border`         | `color-button-toolbar-tertiary-hover-background`       |
| `--color-button-toolbar-tertiary-icon`                 | `color-button-toolbar-tertiary`                        |
| `--color-button-toolbar-tertiary-icon-active`          | `color-interactive-active-foreground`                  |
| `--color-button-toolbar-tertiary-icon-disabled`        | `color-disabled-foreground`                            |
| `--color-button-toolbar-tertiary-icon-focus`           | `color-interactive-background`                         |
| `--color-button-toolbar-tertiary-icon-hover`           | `color-interactive-hover-foreground`                   |
| `--color-button-toolbar-ghost`                         | `color-data`                                           |
| `--color-button-toolbar-ghost-background`              | `transparent`                                          |
| `--color-button-toolbar-ghost-focus`                   | `color-button-toolbar-ghost`                           |
| `--color-button-toolbar-ghost-focus-background`        | `color-button-toolbar-ghost-background`                |
| `--color-button-toolbar-ghost-focus-border`            | `transparent`                                          |
| `--color-button-toolbar-ghost-active`                  | `color-interactive-active-foreground`                  |
| `--color-button-toolbar-ghost-active-background`       | `color-interactive-active-background`                  |
| `--color-button-toolbar-ghost-active-border`           | `color-button-toolbar-ghost-active-background`         |
| `--color-button-toolbar-ghost-disabled`                | `color-disabled-foreground`                            |
| `--color-button-toolbar-ghost-disabled-background`     | `transparent`                                          |
| `--color-button-toolbar-ghost-disabled-border`         | `color-button-toolbar-ghost-disabled-background`       |
| `--color-button-toolbar-ghost-hover`                   | `color-interactive-hover-foreground`                   |
| `--color-button-toolbar-ghost-hover-background`        | `color-interactive-hover-background`                   |
| `--color-button-toolbar-ghost-hover-border`            | `color-button-toolbar-ghost-hover-background`          |
| `--color-button-toolbar-ghost-icon`                    | `color-interactive-background`                         |
| `--color-button-toolbar-ghost-icon-active`             | `color-interactive-active-foreground`                  |
| `--color-button-toolbar-ghost-icon-disabled`           | `color-disabled-foreground`                            |
| `--color-button-toolbar-ghost-icon-focus`              | `color-interactive-background`                         |
| `--color-button-toolbar-ghost-icon-hover`              | `color-interactive-hover-foreground`                   |
| `--color-button-toolbar-selection`                     | `--color-interactive-foreground`                       |
| `--color-button-toolbar-selection-background`          | transparent                                            |
| `--color-button-toolbar-selection-focus`               | `--color-button-toolbar-selection`                     |
| `--color-button-toolbar-selection-focus-background`    | `--color-button-toolbar-selection-background`          |
| `--color-button-toolbar-selection-focus-border`        | `--color-button-toolbar-selection-focus-background`    |
| `--color-button-toolbar-selection-active`              | `--color-interactive-active-foreground`                |
| `--color-button-toolbar-selection-active-background`   | `--color-interactive-active-background`                |
| `--color-button-toolbar-selection-active-border`       | `--color-button-toolbar-selection-active-background`   |
| `--color-button-toolbar-selection-disabled`            | `--color-disabled-foreground`                          |
| `--color-button-toolbar-selection-disabled-background` | `--color-disabled-background`                          |
| `--color-button-toolbar-selection-disabled-border`     | `--color-button-toolbar-selection-disabled-background` |
| `--color-button-toolbar-selection-hover`               | `--color-interactive-hover-foreground`                 |
| `--color-button-toolbar-selection-hover-background`    | `--color-interactive-hover-background`                 |
| `--color-button-toolbar-selection-hover-border`        | `--color-button-toolbar-selection-hover-background`    |
| `--color-button-toolbar-selection-icon`                | `--color-interactive-foreground`                       |
| `--color-button-toolbar-selection-icon-active`         | `--color-interactive-active-foreground`                |
| `--color-button-toolbar-selection-icon-disabled`       | `--color-disabled-foreground`                          |
| `--color-button-toolbar-selection-icon-focus`          | `--color-interactive-foreground`                       |
| `--color-button-toolbar-selection-icon-hover`          | `--color-interactive-hover-foreground`                 |
| `--color-button-nav`                                   | #111                                                 |
| `--color-button-nav-background`                        | transparent                                            |
| `--color-button-nav-hover`                             | `--color-interactive-hover-foreground`                 |
| `--color-button-nav-hover-border`                      | transparent                                            |
| `--color-button-nav-hover-background`                  | `--color-interactive-hover-background`                 |
| `--color-button-nav-icon`                              | `--color-button-nav`                                   |
| `--color-button-nav-icon-hover`                        | `--color-interactive-hover-foreground`                 |
| `--color-button-nav-icon-selected`                     | `--color-button-nav-selected`                          |
| `--color-button-nav-selected`                          | #111                                                 |
| `--color-button-nav-selected-background`               | #e0e0e0                                              |
| `--color-button-nav-selected-border`                   | transparent                                            |
| `--color-button-nav-selected-left-border`              | `--color-brand`                                        |
| `--color-button-nav-public`                            | `--color-nav-foreground`                               |
| `--color-button-nav-public-background`                 | transparent                                            |
| `--color-button-nav-public-hover`                      | `--color-nav-foreground`                               |
| `--color-button-nav-public-hover-background`           | `--color-nav-hover-background`                         |
| `--color-button-nav-public-hover-border`               | transparent                                            |
| `--color-button-nav-public-icon`                       | `--color-button-nav-public`                            |
| `--color-button-nav-public-icon-hover`                 | `--color-button-nav-public-hover`                      |
| `--color-button-modal-primary`                         | `--color-interactive-foreground`                       |
| `--color-button-modal-primary-background`              | `--color-interactive-background`                       |
| `--color-button-modal-primary-focus`                   | `--color-button-primary`                               |
| `--color-button-modal-primary-focus-background`        | `--color-button-primary-background`                    |
| `--color-button-modal-primary-focus-border`            | `--color-background`                                   |
| `--color-button-modal-primary-active`                  | `--color-interactive-active-foreground`                |
| `--color-button-modal-primary-active-background`       | `--color-interactive-active-background`                |
| `--color-button-modal-primary-active-border`           | `--color-button-primary-focus-border`                  |
| `--color-button-modal-primary-disabled`                | `--color-disabled-foreground`                          |
| `--color-button-modal-primary-disabled-background`     | `--color-disabled-background`                          |
| `--color-button-modal-primary-disabled-border`         | `--color-button-primary-disabled-background`           |
| `--color-button-modal-primary-hover`                   | `--color-interactive-hover-foreground`                 |
| `--color-button-modal-primary-hover-background`        | `--color-interactive-hover-background`                 |
| `--color-button-modal-primary-hover-border`            | `--color-button-primary-hover-background`              |
| `--color-button-modal-secondary`                       | `--color-interactive-secondary-foreground`             |
| `--color-button-modal-secondary-background`            | `--color-interactive-secondary-background`             |
| `--color-button-modal-secondary-focus`                 | `--color-button-secondary`                             |
| `--color-button-modal-secondary-focus-background`      | `--color-button-secondary-background`                  |
| `--color-button-modal-secondary-focus-border`          | `--color-background`                                   |
| `--color-button-modal-secondary-active`                | `--color-interactive-active-foreground`                |
| `--color-button-modal-secondary-active-background`     | `--color-interactive-active-background`                |
| `--color-button-modal-secondary-active-border`         | `--color-button-secondary-focus-border`                |
| `--color-button-modal-secondary-disabled`              | `--color-disabled-foreground`                          |
| `--color-button-modal-secondary-disabled-background`   | `--color-disabled-background`                          |
| `--color-button-modal-secondary-disabled-border`       | `--color-button-secondary-disabled-background`         |
| `--color-button-modal-secondary-hover`                 | `--color-interactive-hover-foreground`                 |
| `--color-button-modal-secondary-hover-background`      | `--color-interactive-hover-background`                 |
| `--color-button-modal-secondary-hover-border`          | `--color-button-secondary-hover-background`            |
| `--color-button-modal-set-background`                  | transparent                                            |
| `--color-button-primary`                               | `--color-interactive-foreground`                       |
| `--color-button-primary-background`                    | `--color-interactive-background`                       |
| `--color-button-primary-focus`                         | `--color-button-primary`                               |
| `--color-button-primary-focus-background`              | `--color-button-primary-background`                    |
| `--color-button-primary-focus-border`                  | `--color-background`                                   |
| `--color-button-primary-active`                        | `--color-interactive-active-foreground`                |
| `--color-button-primary-active-background`             | `--color-interactive-active-background`                |
| `--color-button-primary-active-border`                 | `--color-button-primary-focus-border`                  |
| `--color-button-primary-disabled`                      | `--color-disabled-foreground`                          |
| `--color-button-primary-disabled-background`           | `--color-disabled-background`                          |
| `--color-button-primary-disabled-border`               | `--color-button-primary-disabled-background`           |
| `--color-button-primary-hover`                         | `--color-interactive-hover-foreground`                 |
| `--color-button-primary-hover-background`              | `--color-interactive-hover-background`                 |
| `--color-button-primary-hover-border`                  | `--color-button-primary-hover-background`              |
| `--color-button-primary-icon`                          | `--color-interactive-foreground`                       |
| `--color-button-primary-icon-active`                   | `--color-interactive-active-foreground`                |
| `--color-button-primary-icon-disabled`                 | `--color-disabled-foreground`                          |
| `--color-button-primary-icon-focus`                    | `--color-interactive-foreground`                       |
| `--color-button-primary-icon-hover`                    | `--color-interactive-hover-foreground`                 |
| `--color-button-secondary`                             | `--color-interactive-secondary-foreground`             |
| `--color-button-secondary-background`                  | `--color-interactive-secondary-background`             |
| `--color-button-secondary-focus`                       | `--color-button-secondary`                             |
| `--color-button-secondary-focus-background`            | `--color-button-secondary-background`                  |
| `--color-button-secondary-focus-border`                | `--color-background`                                   |
| `--color-button-secondary-active`                      | `--color-interactive-active-foreground`                |
| `--color-button-secondary-active-background`           | `--color-interactive-active-background`                |
| `--color-button-secondary-active-border`               | `--color-button-secondary-focus-border`                |
| `--color-button-secondary-disabled`                    | `--color-disabled-foreground`                          |
| `--color-button-secondary-disabled-background`         | `--color-disabled-background`                          |
| `--color-button-secondary-disabled-border`             | `--color-button-secondary-disabled-background`         |
| `--color-button-secondary-hover`                       | `--color-interactive-hover-foreground`                 |
| `--color-button-secondary-hover-background`            | `--color-interactive-hover-background`                 |
| `--color-button-secondary-hover-border`                | `--color-button-secondary-hover-background`            |
| `--color-button-secondary-icon`                        | `--color-button-secondary`                             |
| `--color-button-secondary-icon-active`                 | `--color-interactive-active-foreground`                |
| `--color-button-secondary-icon-disabled`               | `--color-disabled-foreground`                          |
| `--color-button-secondary-icon-focus`                  | `--color-interactive-secondary-foreground`             |
| `--color-button-secondary-icon-hover`                  | `--color-interactive-hover-foreground`                 |
| `--color-button-tertiary`                              | `--color-interactive-background`                       |
| `--color-button-tertiary-background`                   | transparent                                            |
| `--color-button-tertiary-focus`                        | `--color-button-tertiary`                              |
| `--color-button-tertiary-focus-background`             | `--color-button-tertiary-background`                   |
| `--color-button-tertiary-focus-border`                 | `--color-focus-background`                             |
| `--color-button-tertiary-active`                       | `--color-interactive-active-foreground`                |
| `--color-button-tertiary-active-background`            | `--color-interactive-active-background`                |
| `--color-button-tertiary-active-border`                | `--color-button-tertiary-active-background`            |
| `--color-button-tertiary-disabled`                     | `--color-disabled-foreground`                          |
| `--color-button-tertiary-disabled-background`          | transparent                                            |
| `--color-button-tertiary-disabled-border`              | `--color-button-tertiary-disabled`                     |
| `--color-button-tertiary-hover`                        | `--color-interactive-hover-foreground`                 |
| `--color-button-tertiary-hover-background`             | `--color-interactive-hover-background`                 |
| `--color-button-tertiary-hover-border`                 | `--color-button-tertiary-hover-background`             |
| `--color-button-tertiary-icon`                         | `--color-button-tertiary`                              |
| `--color-button-tertiary-icon-active`                  | `--color-interactive-active-foreground`                |
| `--color-button-tertiary-icon-disabled`                | `--color-disabled-foreground`                          |
| `--color-button-tertiary-icon-focus`                   | `--color-interactive-background`                       |
| `--color-button-tertiary-icon-hover`                   | `--color-interactive-hover-foreground`                 |
| `--color-button-ghost`                                 | `--color-interactive-background`                       |
| `--color-button-ghost-background`                      | transparent                                            |
| `--color-button-ghost-focus`                           | `--color-button-ghost`                                 |
| `--color-button-ghost-focus-background`                | `--color-button-ghost-background`                      |
| `--color-button-ghost-focus-border`                    | transparent                                            |
| `--color-button-ghost-active`                          | `--color-interactive-active-foreground`                |
| `--color-button-ghost-active-background`               | `--color-interactive-active-background`                |
| `--color-button-ghost-active-border`                   | `--color-button-ghost-active-background`               |
| `--color-button-ghost-disabled`                        | `--color-disabled-foreground`                          |
| `--color-button-ghost-disabled-background`             | transparent                                            |
| `--color-button-ghost-disabled-border`                 | `--color-button-ghost-disabled-background`             |
| `--color-button-ghost-hover`                           | `--color-interactive-hover-foreground`                 |
| `--color-button-ghost-hover-background`                | `--color-interactive-hover-background`                 |
| `--color-button-ghost-hover-border`                    | `--color-button-ghost-hover-background`                |
| `--color-button-ghost-icon`                            | `--color-interactive-background`                       |
| `--color-button-ghost-icon-active`                     | `--color-interactive-active-foreground`                |
| `--color-button-ghost-icon-disabled`                   | `--color-disabled-foreground`                          |
| `--color-button-ghost-icon-focus`                      | `--color-interactive-background`                       |
| `--color-button-ghost-icon-hover`                      | `--color-interactive-hover-foreground`                 |

<br/>
Customized values for dark mode:
<br />
<br />

| Variable name                            | Dark mode value |
|------------------------------------------|-----------------|
| `--color-button-nav`                     | #eee          |
| `--color-button-nav-selected`            | #eee          |
| `--color-button-nav-selected-background` | #35373c       |

<br/>
Customized values for contrast mode:
<br />
<br />

| Variable name                            | Contrast mode value      |
|------------------------------------------|--------------------------|
| `--color-button-active-mode-background`  | `--contrast-background`  |
| `--color-button-dropdown`                | `--contrast-interactive` |
| `--color-button-dropdown-background`     | `--contrast-background`  |
| `--color-button-dropdown-focus`          | `--contrast-background`  |
| `--color-button-dropdown-hover`          | `--contrast-background`  |
| `--color-button-nav`                     | `--contrast-foreground`  |
| `--color-button-nav-icon`                | `--color-button-nav`     |
| `--color-button-nav-selected`            | `--contrast-background`  |
| `--color-button-nav-selected-background` | `--contrast-foreground`  |
| `--color-button-nav-public-hover`        | `--contrast-background`  |
| `--color-button-nav-public-icon-hover`   | `--contrast-background`  |
