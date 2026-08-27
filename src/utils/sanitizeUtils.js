import DOMPurify from 'dompurify';

// Split out of formatUtils in 2.3.0. `lx*Utils` namespaces are exported as namespace
// objects, which bundlers cannot tree-shake per member — so every consumer of any
// formatUtils function was also downloading DOMPurify. Keeping sanitisation in its own
// namespace means only code that actually sanitises pays for it.

/**
 * Sanitizes text and strips all HTML tags and attributes.
 *
 * @param {string} value - Raw text that may contain HTML.
 * @returns {string} Sanitized plain-text-safe string.
 */
export function sanitizeToPlainText(value) {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
