export const SHADOW_FADE_DISTANCE = 100;

/**
 * Opacity of a scroll shadow: fades in over `fadeDistance` px of content scrolled past the edge.
 *
 * @param {number} distance - How far content has scrolled past the edge, in px.
 * @param {number} [fadeDistance=SHADOW_FADE_DISTANCE] - Distance at which the shadow is fully visible.
 * @returns {number} Opacity between 0 and 1.
 */
export function shadowOpacity(distance, fadeDistance = SHADOW_FADE_DISTANCE) {
  return Math.min(1, Math.max(0, distance / fadeDistance));
}

/**
 * Resolved CSS `top` of a sticky element, i.e. where it sticks.
 *
 * @param {HTMLElement} el - Sticky element.
 * @returns {number} Sticky top offset in px, 0 when not set.
 */
export function getStickyTopOffset(el) {
  return Number.parseFloat(getComputedStyle(el).top) || 0;
}
