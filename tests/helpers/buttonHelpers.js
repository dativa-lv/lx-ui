import { expect } from 'vitest';

/**
 * Checks if a button element has the correct state attributes and classes.
 * Works with both native HTML elements and Vue Test Utils wrappers.
 * @param {HTMLElement|Object} button - The button element or wrapper to check
 * @param {string} state - The button's state to check
 */
export function checkButtonState(button, state) {
  // If it's a native HTML element, work with it directly
  // If it's a Vue Test Utils wrapper, extract the element
  const element = button.element || button;

  switch (state) {
    case 'disabled':
    case 'loading':
      expect(element.classList.contains('lx-disabled')).toBe(true);
      expect(element.getAttribute('disabled')).toBeDefined();
      expect(element.getAttribute('aria-disabled')).toBe('true');
      break;
    case 'busy':
      expect(element.classList.contains('lx-busy')).toBe(true);
      expect(element.classList.contains('lx-disabled')).toBe(true);
      expect(element.getAttribute('disabled')).toBeDefined();
      expect(element.getAttribute('aria-busy')).toBe('true');
      expect(element.getAttribute('aria-disabled')).toBe('true');
      break;
    case 'active':
      expect(element.classList.contains('lx-active')).toBe(true);
      break;
    case 'destructive':
      expect(element.classList.contains('lx-destructive')).toBe(true);
      break;
    default:
      break;
  }
}
