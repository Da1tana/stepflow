const BLOCKED_PROTOCOLS = new Set([
  'chrome:', 'chrome-extension:', 'edge:', 'about:', 'devtools:', 'view-source:', 'data:', 'file:',
]);

/** Returns true for browser-internal, store, local-file and obvious PDF URLs. */
export function isRestrictedUrl(value) {
  if (typeof value !== 'string') return true;
  let url;
  try {
    url = new URL(value);
  } catch {
    return true;
  }

  if (BLOCKED_PROTOCOLS.has(url.protocol)) return true;
  if (!['http:', 'https:'].includes(url.protocol)) return true;

  const host = url.hostname.toLowerCase();
  if (host === 'chrome.google.com' && url.pathname.startsWith('/webstore')) return true;
  if (host === 'chromewebstore.google.com') return true;
  if (url.pathname.toLowerCase().endsWith('.pdf')) return true;
  return false;
}
