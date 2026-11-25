import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerRecordingLifecycle } from '../../src/background/recording-lifecycle.js';

function event() {
  const listeners = [];
  return {
    addListener(listener) { listeners.push(listener); },
    async emit(...args) { await Promise.all(listeners.map((listener) => listener(...args))); },
  };
}

function fixture(initialDraft) {
  const onUpdated = event();
  const onRemoved = event();
  const calls = [];
  let draft = initialDraft;
  const warnings = [];
  registerRecordingLifecycle({
    tabs: { onUpdated, onRemoved },
    scripting: {
      async executeScript(options) {
        calls.push(options);
        if (fixture.injectError) throw new Error('Cannot access contents of the page');
      },
    },
    getDraft: async () => draft,
    setDraft: async (next) => { draft = next; },
    logger: { warn: (...args) => warnings.push(args), error: assert.fail },
  });
  return { onUpdated, onRemoved, calls, warnings, getDraft: () => draft };
}

const recording = {
  id: 'session-1', tabId: 7, status: 'recording', pauseReason: null,
  steps: [{ id: 'step-1', index: 1, title: 'Click', createdAt: 1 }],
  startedAt: 1, updatedAt: 1, origin: 'https://example.com',
};

test('pauses during navigation and reinjects before resuming after successful access', async () => {
  const app = fixture({ ...recording });
  await app.onUpdated.emit(7, { status: 'loading' });
  assert.equal(app.getDraft().status, 'paused');
  assert.equal(app.getDraft().pauseReason, 'navigation');

  await app.onUpdated.emit(7, { status: 'complete' });
  assert.equal(app.calls.length, 1);
  assert.deepEqual(app.calls[0], { target: { tabId: 7 }, files: ['src/content/recorder.js'] });
  assert.equal(app.getDraft().status, 'recording');
  assert.equal(app.getDraft().pauseReason, null);
});

test('keeps recording paused when reinjection is denied after navigation', async () => {
  fixture.injectError = true;
  const app = fixture({ ...recording });
  await app.onUpdated.emit(7, { status: 'loading' });
  await app.onUpdated.emit(7, { status: 'complete' });
  assert.equal(app.getDraft().status, 'paused');
  assert.equal(app.getDraft().pauseReason, 'navigation');
  assert.equal(app.warnings.length, 1);
  fixture.injectError = false;
});

test('preserves captured steps and pauses the draft when its tab closes', async () => {
  const app = fixture({ ...recording });
  await app.onRemoved.emit(7);
  assert.equal(app.getDraft().status, 'paused');
  assert.equal(app.getDraft().pauseReason, 'tab-closed');
  assert.equal(app.getDraft().steps.length, 1);
});

test('ignores navigation and closure events for unrelated tabs', async () => {
  const app = fixture({ ...recording });
  await app.onUpdated.emit(8, { status: 'loading' });
  await app.onUpdated.emit(8, { status: 'complete' });
  await app.onRemoved.emit(8);
  assert.equal(app.getDraft().status, 'recording');
  assert.equal(app.calls.length, 0);
});
