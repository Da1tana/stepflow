/**
 * StepFlow service worker — the extension's single coordinator.
 * MV3 service workers are short-lived: persist all state via storage.
 * Register event listeners synchronously at top level.
 */
import { createLogger } from '../shared/js/logger.js';
import { createRouter } from '../shared/js/messaging.js';
import { initStorage } from '../shared/js/storage.js';
import { appHandlers } from './handlers/app.js';
import { recordingHandlers } from './handlers/recording.js';

const log = createLogger('sw');
const router = createRouter({ ...appHandlers, ...recordingHandlers }, log);

chrome.runtime.onMessage.addListener(router);

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await initStorage();
  log.info(`Installed (${reason}), v${chrome.runtime.getManifest().version}`);
});
