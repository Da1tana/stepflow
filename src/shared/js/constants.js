/**
 * Shared constants used by every extension context
 * (service worker, popup, side panel and content scripts).
 * Keep this file dependency-free.
 */
export const APP = Object.freeze({
  NAME: 'StepFlow',
  LOG_PREFIX: '[StepFlow]',
});

export const MSG = Object.freeze({
  APP_PING: 'app/ping',
  APP_GET_STATE: 'app/get-state',
  RECORDING_START: 'recording/start',
  RECORDING_STEP_CAPTURED: 'recording/step-captured',
  RECORDING_STOP: 'recording/stop',
  RECORDING_CANCEL: 'recording/cancel',
});

export const STORAGE_KEYS = Object.freeze({
  SCHEMA_VERSION: 'sf.schemaVersion',
  SETTINGS: 'sf.settings',
  GUIDES: 'sf.guides',
  RECORDING_DRAFT: 'sf.recordingDraft',
});

export const SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS = Object.freeze({
  autoScreenshot: true,
  highlightClicks: true,
});
