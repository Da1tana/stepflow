/**
 * Localisation helpers built on chrome.i18n (_locales/*).
 * Markup uses data attributes, so pages contain no hard-coded copy:
 *   <span data-i18n="key"></span>
 *   <button data-i18n-title="key" data-i18n-aria-label="key"></button>
 */

export function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

export function applyI18n(root = document) {
  document.documentElement.lang = chrome.i18n.getUILanguage().split('-')[0];

  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
  root.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  });
}
