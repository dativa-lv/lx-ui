# Accessibility

Many applications share the same LX/UI components. A keyboard fix in one component can make a difference across all of them. We’re committed to building components that meet the applicable requirements of the [Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA](https://www.w3.org/TR/WCAG22/).

## Component design

We use the [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) when designing interactive components. Its patterns guide keyboard interaction, focus management, and how components communicate their roles and states to assistive technologies.

When building custom components or providing custom templates through slots, reuse the existing [LX/UI design tokens](./docs/DesignTokens.md) for layout and color. For example, use the component’s text and background color tokens in a custom template so it follows the user’s theme.

Most planned accessibility settings will rely on these tokens and their proper use. Reusing them helps custom components and templates adapt as new settings become available.

## Accessibility settings

The accessibility menu in `LxShell` lets users adjust how the application looks and behaves. Some settings, including theme and animations, follow the preferences reported by the browser until the user chooses an override. Users can change individual settings or reset them all to their defaults.

- **Theme** - follow the system preference automatically, or choose the light, high-contrast, or dark theme. The high-contrast theme targets the [WCAG 2.2 Level AAA criterion for text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html), with a contrast ratio of at least 7:1.
- **Transparency** - reduce or turn off transparency so content behind windows and panels is less distracting.
- **Animations** - turn off motion effects during interactions such as opening a window or switching between menu items. This helps applications meet the [Level AAA criterion for animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).
- **Device fonts** - use the device’s default fonts in place of the application’s fonts. This can help users who have set a specialized typeface, such as [OpenDyslexic](https://opendyslexic.org/), as their system font.
- **Touch controls** - enlarge interactive elements such as buttons and menu items to make them easier to tap.

## Testing

We regularly test how we use LX/UI components in the [demo portal](https://lx-ui.dev/). This helps us find and fix accessibility issues at the component level.

Always verify accessibility in the finished application. How you configure a component, customize its slots, or combine it with other components can introduce barriers that don’t appear in the demo portal and can't be testet on our end. Test complete workflows and your app as a whole.

## Report an accessibility issue

If you encounter an accessibility barrier in LX/UI, please [open an issue](https://github.com/dativa-lv/lx-ui/issues/new). Tell us what you were trying to do, what happened, and which component was involved.

If you know the LX/UI version, include it. Details about your browser, assistive technology, or accessibility settings can also help us reproduce - and fix - the issue.