import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addStep, countSteps, createGuide } from '../../src/core/guide.js';

test('createGuide returns an empty guide', () => {
  const guide = createGuide({ title: 'Demo' });
  assert.equal(guide.title, 'Demo');
  assert.deepEqual(guide.steps, []);
  assert.ok(guide.id);
});

test('addStep appends immutably with 1-based index', () => {
  const g0 = createGuide();
  const g1 = addStep(g0, { title: 'Click "Save"' });
  const g2 = addStep(g1, { title: 'Open menu' });
  assert.equal(g0.steps.length, 0);
  assert.deepEqual(
    g2.steps.map((s) => s.index),
    [1, 2],
  );
});

test('countSteps sums across guides', () => {
  const a = addStep(createGuide(), { title: 'x' });
  const b = addStep(addStep(createGuide(), { title: 'y' }), { title: 'z' });
  assert.equal(countSteps([a, b]), 3);
  assert.equal(countSteps([]), 0);
});
