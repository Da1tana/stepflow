/**
 * Privacy boundary for recorder descriptors.
 * Only a tiny allowlisted descriptor is allowed to cross into the extension.
 * This is defense in depth; the content script must avoid reading sensitive
 * DOM properties in the first place.
 */
const ALLOWED_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'select',
  'textbox', 'password', 'tab', 'menuitem',
]);

const EMAIL = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i;
const FOUR_OR_MORE_DIGITS = /\d{4,}/;
const LONG_TOKEN = /\b[A-Za-z0-9_-]{24,}\b/;

/**
 * Normalize a descriptor received from an untrusted page context.
 * Never accepts values, HTML, selectors, arbitrary attributes, or URLs.
 * @param {unknown} value
 * @returns {{ role: string, label: string } | null}
 */
export function sanitizeElementDescriptor(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const role = typeof value.role === 'string' ? value.role.toLowerCase() : '';
  if (!ALLOWED_ROLES.has(role)) return null;

  // Input-like controls always receive a generic label. Never trust text
  // supplied for a textbox/password/select, even if it looks harmless.
  if (['textbox', 'password', 'select'].includes(role)) {
    return { role, label: '' };
  }

  if (typeof value.label !== 'string') return { role, label: '' };
  const label = value.label.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!label || EMAIL.test(label) || FOUR_OR_MORE_DIGITS.test(label) || LONG_TOKEN.test(label)) {
    return { role, label: '' };
  }

  return { role, label: [...label].slice(0, 60).join('') };
}

/** Keep only a web origin; path, query, fragment and credentials are discarded. */
export function safePageOrigin(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.origin;
  } catch {
    return '';
  }
}
