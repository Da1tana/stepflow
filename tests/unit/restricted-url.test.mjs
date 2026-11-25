import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isRestrictedUrl } from '../../src/core/restricted-url.js';

test('blocks browser-internal, store, local and PDF pages', () => {
  for (const url of ['chrome://settings', 'chrome-extension://abc/page.html', 'edge://settings', 'about:blank', 'devtools://devtools', 'file:///tmp/a.html', 'https://example.com/manual.pdf', 'https://chromewebstore.google.com/detail/x']) {
    assert.equal(isRestrictedUrl(url), true, url);
  }
});

test('allows ordinary HTTP and HTTPS pages', () => {
  assert.equal(isRestrictedUrl('https://example.com/workflow'), false);
  assert.equal(isRestrictedUrl('http://localhost:3000/'), false);
});

test('treats malformed and non-web URLs as restricted', () => {
  assert.equal(isRestrictedUrl('not a URL'), true);
  assert.equal(isRestrictedUrl('ftp://example.com/file'), true);
});
