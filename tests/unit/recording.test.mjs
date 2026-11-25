import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  appendRecordingStep, cancelRecording, createRecordingSession,
  pauseRecording, resumeRecording, stopRecording,
} from '../../src/core/recording.js';

test('creates a serializable session with only the page origin', () => {
  const session = createRecordingSession({ tabId: 7, pageUrl: 'https://example.com/private?token=abc#x', now: 10 });
  assert.equal(session.status, 'recording');
  assert.equal(session.tabId, 7);
  assert.equal(session.origin, 'https://example.com');
  assert.deepEqual(session.steps, []);
  assert.equal(session.startedAt, 10);
});

test('rejects invalid tabs and unsupported URLs', () => {
  assert.throws(() => createRecordingSession({ tabId: -1, pageUrl: 'https://example.com' }));
  assert.throws(() => createRecordingSession({ tabId: 1, pageUrl: 'chrome://settings' }));
});

test('appends safe steps immutably and drops sensitive labels', () => {
  const first = createRecordingSession({ tabId: 1, pageUrl: 'https://example.com', now: 1 });
  const second = appendRecordingStep(first, { role: 'button', label: 'Save' }, { locale: 'en', now: 2 });
  assert.equal(first.steps.length, 0);
  assert.equal(second.steps.length, 1);
  assert.equal(second.steps[0].title, 'Click «Save»');
  const third = appendRecordingStep(second, { role: 'button', label: 'user@example.com' }, { now: 3 });
  assert.equal(third.steps.length, 2);
  assert.equal(third.steps[1].title, 'Нажмите');
  assert.equal(JSON.stringify(third).includes('user@example.com'), false);
});

test('pause, resume, stop and cancel follow explicit state transitions', () => {
  const active = createRecordingSession({ tabId: 1, pageUrl: 'https://example.com', now: 1 });
  const paused = pauseRecording(active, 'navigation', 2);
  assert.equal(paused.status, 'paused');
  assert.equal(resumeRecording(paused, 3).status, 'recording');
  assert.equal(stopRecording(paused, 4).status, 'stopped');
  assert.equal(stopRecording(active, 4).status, 'stopped');
  assert.equal(cancelRecording(), null);
  assert.equal(appendRecordingStep(paused, { role: 'button', label: 'Save' }), paused);
});
