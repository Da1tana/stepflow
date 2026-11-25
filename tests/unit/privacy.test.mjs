import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safePageOrigin, sanitizeElementDescriptor } from '../../src/core/privacy.js';

test('descriptor accepts only allowlisted roles and safe labels', () => {
  assert.deepEqual(sanitizeElementDescriptor({ role: 'button', label: ' Save ' }), { role: 'button', label: 'Save' });
  assert.equal(sanitizeElementDescriptor({ role: 'img', label: 'Logo' }), null);
  assert.equal(sanitizeElementDescriptor({ role: 'button', label: 'user@example.com' }).label, '');
  assert.equal(sanitizeElementDescriptor({ role: 'button', label: 'Order 123456' }).label, '');
  assert.equal(sanitizeElementDescriptor({ role: 'button', label: 'Save '.repeat(20) }).label.length, 60);
});

test('input-like controls never retain supplied labels', () => {
  for (const role of ['textbox', 'password', 'select']) {
    assert.deepEqual(sanitizeElementDescriptor({ role, label: 'secret value' }), { role, label: '' });
  }
});

test('descriptor rejects non-objects and arrays', () => {
  assert.equal(sanitizeElementDescriptor(null), null);
  assert.equal(sanitizeElementDescriptor('button'), null);
  assert.equal(sanitizeElementDescriptor([]), null);
});

test('safePageOrigin drops path, query, fragment and credentials', () => {
  assert.equal(safePageOrigin('https://user:pass@example.com/private?id=123#secret'), 'https://example.com');
  assert.equal(safePageOrigin('chrome://settings'), '');
  assert.equal(safePageOrigin('not a url'), '');
});
