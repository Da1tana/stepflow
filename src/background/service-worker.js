/**
 * StepFlow service worker — the extension's single coordinator.
 *
 * MV3 service workers are short-lived: never keep state in module
 * variables, persist it via shared/js/storage.js instead.
 * All event listeners must be registered synchronously at top level.
 */
import { createLogger } from '../shared/js/logger.js';
import { createRouter } from '../shared/js/messaging.js';
import { initStorage } from '../shared/js/storage.js';
import { appHandlers } from './handlers/app.js';

const log = createLogger('sw');

/**
 * Message routing table. Each feature contributes its own handler map
 * from ./handlers/<feature>.js — e.g. recordingHandlers later.
 */
const router = createRouter({ ...appHandlers }, log);

chrome.runtime.onMessage.addListener(router);

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await initStorage();
  log.info(`Installed (${reason}), v${chrome.runtime.getManifest().version}`);
});
