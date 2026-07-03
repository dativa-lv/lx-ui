const OVERFLOW_DIRECTIONS = Object.freeze(['horizontal', 'vertical']);
const OVERFLOW_TOLERANCE_PX = 1; // To account for minor measurement discrepancies

/**
 * @typedef {'horizontal'|'vertical'} OverflowDirection
 */

/**
 * @typedef {Object} OverflowOptions
 * @property {OverflowDirection} [direction='horizontal'] - Axis to check.
 */

/**
 * Resolves direction. If unsupported, defaults to horizontal axis.
 *
 * @param {*} direction - Direction value to resolve.
 * @returns {OverflowDirection} Supported overflow direction.
 */
function resolveDirection(direction) {
  return OVERFLOW_DIRECTIONS.includes(direction) ? direction : 'horizontal';
}

/**
 * Finds closest parent whose content bounds are exceeded by target element.
 *
 * @param {*} target - HTMLElement or Vue component instance to check.
 * @param {OverflowOptions} [options] - Overflow check options.
 * @returns {HTMLElement|null} Closest exceeded parent element, or `null` when none is found.
 */
export function getClosestExceededParent(target, { direction = 'horizontal' } = {}) {
  const resolvedDirection = resolveDirection(direction);
  const element = target?.$el ?? target;
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const targetRect = element.getBoundingClientRect();

  let parent = element.parentElement;

  while (parent) {
    const parentRect = parent.getBoundingClientRect();
    const parentStyle = getComputedStyle(parent);
    const parentContentWidth =
      parentRect.width -
      (Number.parseFloat(parentStyle.paddingLeft) || 0) -
      (Number.parseFloat(parentStyle.paddingRight) || 0);
    const parentContentHeight =
      parentRect.height -
      (Number.parseFloat(parentStyle.paddingTop) || 0) -
      (Number.parseFloat(parentStyle.paddingBottom) || 0);

    const exceedsParentBounds =
      (resolvedDirection === 'horizontal' &&
        targetRect.width - parentContentWidth > OVERFLOW_TOLERANCE_PX) ||
      (resolvedDirection === 'vertical' &&
        targetRect.height - parentContentHeight > OVERFLOW_TOLERANCE_PX);

    if (exceedsParentBounds) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

/**
 * Checks whether target element overflows inside its own bounds.
 *
 * @param {*} target - HTMLElement or Vue component instance to check.
 * @param {OverflowOptions} [options] - Overflow check options.
 * @returns {boolean} `true` when element scrolls or has child larger than itself.
 */
export function hasInternalOverflow(target, { direction = 'horizontal' } = {}) {
  const resolvedDirection = resolveDirection(direction);
  const element = target?.$el ?? target;
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  // Detect overflow even when CSS clips content and parent boundaries are not exceeded.
  const hasScrollOverflow =
    (resolvedDirection === 'horizontal' &&
      element.scrollWidth - element.clientWidth > OVERFLOW_TOLERANCE_PX) ||
    (resolvedDirection === 'vertical' &&
      element.scrollHeight - element.clientHeight > OVERFLOW_TOLERANCE_PX);

  if (hasScrollOverflow) {
    return true;
  }

  const targetRect = element.getBoundingClientRect();

  return Array.from(element.children).some((child) => {
    if (!(child instanceof HTMLElement)) {
      return false;
    }

    const childRect = child.getBoundingClientRect();
    const childExceedsTargetBounds =
      (resolvedDirection === 'horizontal' &&
        childRect.width - targetRect.width > OVERFLOW_TOLERANCE_PX) ||
      (resolvedDirection === 'vertical' &&
        childRect.height - targetRect.height > OVERFLOW_TOLERANCE_PX);

    return childExceedsTargetBounds;
  });
}

/**
 * Checks whether target element exceeds parent's content bounds or overflows internally.
 *
 * @param {*} target - HTMLElement or Vue component instance to check.
 * @param {OverflowOptions} [options] - Overflow check options.
 * @returns {boolean} `true` when target overflows on selected axis or axes.
 */
export function hasOverflow(target, { direction = 'horizontal' } = {}) {
  const resolvedDirection = resolveDirection(direction);

  return (
    Boolean(getClosestExceededParent(target, { direction: resolvedDirection })) ||
    hasInternalOverflow(target, { direction: resolvedDirection })
  );
}
