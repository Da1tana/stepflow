import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGuideFromRecording } from '../../src/core/guide.js';

test('converts a stopped recording to a guide without copying page data', () => {
  const session = {
    id: 'session-1',
    status: 'stopped',
    tabId: 3,
    origin: 'https://example.com',
    startedAt: 100,
    steps: [
      { id: 'step-1', index: 1, title: 'Нажмите', createdAt: 110 },
      { id: 'step-2', index: 2, title: 'Нажмите «Сохранить»', createdAt: 120 },
    ],
  };
  const guide = createGuideFromRecording(session, { title: 'Создание заявки' });
  assert.equal(guide.title, 'Создание заявки');
  assert.equal(guide.steps.length, 2);
  assert.equal(guide.steps[1].index, 2);
  assert.equal(guide.steps[1].title, 'Нажмите «Сохранить»');
  assert.equal(guide.createdAt, 100);
  assert.equal('origin' in guide, false);
  assert.equal(JSON.stringify(guide).includes('example.com'), false);
});

test('rejects active and empty recordings', () => {
  assert.throws(() => createGuideFromRecording({ status: 'recording', steps: [{ title: 'Click' }] }));
  assert.throws(() => createGuideFromRecording({ status: 'stopped', steps: [] }));
});
