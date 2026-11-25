import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatStepTitle } from '../../src/core/step-label.js';

test('formats Russian and English step labels', () => {
  assert.equal(formatStepTitle({ role: 'button', label: 'Сохранить' }, 'ru'), 'Нажмите «Сохранить»');
  assert.equal(formatStepTitle({ role: 'link', label: 'Pricing' }, 'en-US'), 'Open link «Pricing»');
});

test('uses generic labels when there is no safe element label', () => {
  assert.equal(formatStepTitle({ role: 'password', label: '' }, 'ru'), 'Нажмите на поле пароля');
  assert.equal(formatStepTitle({ role: 'button', label: '' }, 'en'), 'Click');
});
