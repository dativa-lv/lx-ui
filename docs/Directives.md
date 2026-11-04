# Directives Guide

LX/UI custom Vue directives — behaviour that does not warrant wrapping an element in a component.

They are registered globally by [`createLx`](./CreateLx.md) and are also exported for local
registration.

## `v-tooltip`

Shows a tooltip when the pointer hovers the element. It does not wrap the trigger, so it can be
added to an existing element without changing its HTML structure.

It is the single source of the tooltip markup and behaviour:
[`LxTooltip`](./tokens/TooltipTokens.md) is a thin wrapper that applies `v-tooltip` to its trigger, and `LxButton`'s `title` prop renders
through it too.

### Usage

`createLx` registers it globally, so no import is needed:

```html
<button v-tooltip="'Saglabāt izmaiņas'">Saglabāt</button>

<!-- Object form, to switch the tooltip off without unbinding the directive -->
<button v-tooltip="{ value: 'Saglabāt izmaiņas', disabled: isEditing }">Saglabāt</button>
```

Without the plugin, import and register it locally:

```js
import { vTooltip } from '@dativa-lv/lx-ui';
```

In `<script setup>` the import alone makes `v-tooltip` available in the template. The same export
lets you register it under a different name if something else in the app already claims
`v-tooltip`:

```js
app.directive('lxTooltip', vTooltip);
```

### Value

| Form                              | Behaviour                                           |
| --------------------------------- | --------------------------------------------------- |
| `String` / `Number`               | Tooltip text.                                       |
| `{ value, disabled, onToggle }`   | Object form – see the options below.                |
| `null`, `''`, whitespace, omitted | Inert — nothing is registered and nothing is shown. |

| Option     | Type                      | Behaviour                              |
| ---------- | ------------------------- | -------------------------------------- |
| `value`    | `String` / `Number`       | Tooltip text.                          |
| `disabled` | `Boolean`                 | `true` makes the tooltip inert.        |
| `onToggle` | `(open: boolean) => void` | Called when the panel opens or closes. |

Changing the value while the tooltip is visible swaps the text in place and re-clamps the panel.
Clearing it closes the tooltip immediately.

### Behaviour

| Aspect        | Value                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Opens after   | 300 ms of pointer dwell; every pointer move restarts the countdown                             |
| Position      | Fixed, 18 px below where the pointer was when it opened; clamped to the viewport               |
| Closes on     | Pointer moving more than 20 px; pointer entering the panel; leaving the trigger (after 100 ms) |
| Also closes   | Scroll; resize; tab hide; context menu; `Escape`; trigger blur                                 |
| Touch devices | Suppressed entirely (`(hover: none)`)                                                          |
| Keyboard      | No focus trigger                                                                               |
| Concurrency   | One panel node is shared by every trigger, so only one tooltip is ever visible                 |

The clamp keeps 4 px of clearance from the layout viewport edges (`VIEWPORT_MARGIN`). The panel is
measured at the viewport origin first, so a pointer near the right edge does not squeeze it, and it
does not follow the pointer once open.

`Escape` dismisses the tooltip (WCAG 1.4.13 — hover content must be dismissible without moving the
pointer), and leaving the browser window (`relatedTarget === null`) closes it.

### Requirements and limitations

- The panel is appended to the shell's `#poppers` container, falling back to the nearest
  `.lx-layout` ancestor and then to `document.body`. In the last case it gets an inline `z-index`,
  because the layered rules are scoped to `.lx .lx-layout .popper`.
- Never set both `v-tooltip` and a `title` attribute on the same element — the browser would draw
  its own tooltip on top. The directive logs a warning in dev environments when it finds both.
- A `title` on an _ancestor_ is fine: inputs put their value on the wrapper that also holds their
  buttons, so the directive gives the trigger an empty `title` — per the HTML spec that means "no
  advisory information" and stops the browser inheriting the ancestor's. The guard is set once when
  the trigger registers, not on hover, and is dropped again when the value goes inert or the
  element unmounts. A real `title` on the trigger is never overwritten.
- Elements nested inside an `LxTooltip` trigger are skipped, so the component's tooltip wins and
  the two never fire together. The same goes for an `LxInfoWrapper` trigger that has a panel to
  show on hover — otherwise the tooltip would land on top of the open panel.
- A descendant that carries its own non-empty `title` owns the hover: the directive stands down
  and lets the browser draw that tooltip, mirroring how a nested trigger wins over an outer one.
  So inner content can use either `v-tooltip` or a plain `title`, and only one tooltip appears.
  The guard the directive writes is an empty `title`, which never counts as ownership.
- Elements with a real `disabled` attribute are supported, but through a document-level pointer hit
  test, since browsers do not dispatch mouse events to disabled controls. That listener is installed
  only while at least one disabled trigger is registered, and it cancels a pending open as well as a
  visible tooltip once the pointer moves off.
- `closeTooltip()` dismisses the visible tooltip, e.g. before opening a modal. Pass a trigger
  element to close it only when that trigger owns it. `openTooltip(el)` opens a trigger's tooltip
  without a hover, just below the element:

  ```js
  import { openTooltip, closeTooltip } from '@dativa-lv/lx-ui';
  ```

### Testing hook

Active triggers carry the tooltip text in a `data-lx-tooltip` attribute. It is the hit-test
selector, and doubles as a stable hook for tests and QA automation:

```js
wrapper.get('.lx-button[data-lx-tooltip="Notīrīt"]');
```

### Styling

The panel is styled by the [`--tooltip-*` design tokens](./tokens/TooltipTokens.md) in `lx-info-wrappers.css`.

Every trigger shares one panel node, appended to `#poppers` (see the fallbacks above):

```html
<div class="popper higher-z-index" style="position: fixed; left: …; top: …">
  <div class="lx-info-wrapper lx-tooltip-kind">
    <div
      id="lx-tooltip-panel"
      class="lx-info-wrapper-panel"
      role="tooltip"
      aria-hidden="…"
      style="--info-popper-spacer-size: 13px"
    >
      <div class="lx-info-wrapper-panel-area">
        <p class="lx-tooltip-text">Tooltip text</p>
      </div>
    </div>
  </div>
</div>
```

## Adding a directive

Put it in `src/directives/<name>.js`, export it as `vName` so `<script setup>` resolves
`v-name` from the import, give it a `getSSRProps` no-op if it touches the DOM, re-export it from
`src/directives/index.js`, register it in `install()` in `src/lib.js`, and document it here.
