import { formatStepTitle } from './step-label.js';
import { isRestrictedUrl } from './restricted-url.js';
import { safePageOrigin, sanitizeElementDescriptor } from './privacy.js';

const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** Create a serializable recording session. */
export function createRecordingSession({ tabId, pageUrl, now = Date.now() }) {
  if (!Number.isInteger(tabId) || tabId < 0) throw new TypeError('A valid tabId is required');
  if (isRestrictedUrl(pageUrl)) throw new TypeError('This page cannot be recorded');
  const origin = safePageOrigin(pageUrl);
  if (!origin) throw new TypeError('A supported http(s) page is required');
  return {
    id: uid(),
    status: 'recording',
    tabId,
    origin,
    steps: [],
    startedAt: now,
    updatedAt: now,
  };
}

/** Append a safe click descriptor. Non-recording sessions are left unchanged. */
export function appendRecordingStep(session, rawDescriptor, { locale = 'ru', now = Date.now() } = {}) {
  if (!session || session.status !== 'recording') return session;
  const descriptor = sanitizeElementDescriptor(rawDescriptor);
  if (!descriptor) return session;

  const step = {
    id: uid(),
    index: session.steps.length + 1,
    title: formatStepTitle(descriptor, locale),
    createdAt: now,
  };
  return { ...session, steps: [...session.steps, step], updatedAt: now };
}

export function pauseRecording(session, reason = 'navigation', now = Date.now()) {
  if (!session || session.status !== 'recording') return session;
  return { ...session, status: 'paused', pauseReason: reason, updatedAt: now };
}

export function resumeRecording(session, now = Date.now()) {
  if (!session || session.status !== 'paused') return session;
  return { ...session, status: 'recording', pauseReason: null, updatedAt: now };
}

export function stopRecording(session, now = Date.now()) {
  if (!session || !['recording', 'paused'].includes(session.status)) return session;
  return { ...session, status: 'stopped', updatedAt: now };
}

export function cancelRecording() {
  return null;
}
