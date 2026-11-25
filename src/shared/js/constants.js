/**
 * Shared constants used by every extension context
 * (service worker, popup, side panel and — later — content scripts).
 * Keep this file dependency-free.
 */

export const APP = Object.freeze({
  NAME: 'StepFlow',
  LOG_PREFIX: '[StepFlow]',
});

/**
 * Message types for chrome.runtime messaging.
 * Naming: "<domain>/<action>". Add new domains here instead of
 * using string literals across the codebase.
 */
export const MSG = Object.freeze({
  APP_PING: 'app/ping',
  APP_GET_STATE: 'app/get-state',
  // Reserved for upcoming features:
  // RECORDING_START: 'recording/start',
  // RECORDING_STOP: 'recording/stop',
  // STEP_CAPTURED: 'recording/step-captured',
});

/** chrome.storage.local keys. Versioned to allow future migrations. */
export const STORAGE_KEYS = Object.freeze({
  SCHEMA_VERSION: 'sf.schemaVersion',
  SETTINGS: 'sf.settings',
  GUIDES: 'sf.guides',
});

export const SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS = Object.freeze({
  autoScreenshot: true,
  highlightClicks: true,
});
