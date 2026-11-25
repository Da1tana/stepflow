(() => {
  if (window.__stepflowRecorderInstalled) return;
  window.__stepflowRecorderInstalled = true;

  const SELECTOR = [
    'button', 'a[href]', '[role="button"]', '[role="link"]',
    '[role="tab"]', '[role="menuitem"]',
    'input[type="checkbox"]', 'input[type="radio"]',
    'input[type="button"]', 'input[type="submit"]',
    'input[type="text"]', 'input[type="email"]', 'input[type="password"]',
    'textarea', 'select',
  ].join(',');

  function describe(element) {
    if (!(element instanceof Element)) return null;
    const target = element.closest(SELECTOR);
    if (!target) return null;

    const tag = target.tagName.toLowerCase();
    const type = (target.getAttribute('type') || '').toLowerCase();
    const ariaRole = (target.getAttribute('role') || '').toLowerCase();
    let role = '';

    if (tag === 'a' || ariaRole === 'link') role = 'link';
    else if (ariaRole === 'tab') role = 'tab';
    else if (ariaRole === 'menuitem') role = 'menuitem';
    else if (type === 'checkbox') role = 'checkbox';
    else if (type === 'radio') role = 'radio';
    else if (tag === 'select') role = 'select';
    else if (tag === 'textarea' || ['text', 'email'].includes(type)) role = 'textbox';
    else if (type === 'password') role = 'password';
    else if (tag === 'button' || ['button', 'submit'].includes(type) || ariaRole === 'button') role = 'button';
    else return null;

    // Never read value, innerText, textContent, HTML, form data, or selectors.
    // Only explicit accessible metadata is considered; the worker sanitizes it again.
    const label = ['textbox', 'password', 'select', 'checkbox', 'radio'].includes(role)
      ? ''
      : (target.getAttribute('aria-label') || target.getAttribute('title') || '');

    return { role, label };
  }

  document.addEventListener('click', (event) => {
    if (!event.isTrusted) return;
    const descriptor = describe(event.target);
    if (!descriptor) return;

    chrome.runtime.sendMessage({
      type: 'recording/step-captured',
      payload: { descriptor },
    }).catch(() => {});
  }, true);
})();
