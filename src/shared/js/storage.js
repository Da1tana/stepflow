import { DEFAULT_SETTINGS, SCHEMA_VERSION, STORAGE_KEYS } from './constants.js';

/**
 * Thin repository layer over chrome.storage.local.
 * UI and background code must go through these functions, never call
 * chrome.storage directly — this keeps a single place for migrations
 * and lets us swap the backend (e.g. IndexedDB for screenshots) later.
 */

const area = () => chrome.storage.local;

export async function getSettings() {
  const { [STORAGE_KEYS.SETTINGS]: stored } = await area().get(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(stored || {}) };
}

export async function updateSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  await area().set({ [STORAGE_KEYS.SETTINGS]: next });
  return next;
}

/** @returns {Promise<import('../../core/guide.js').Guide[]>} */
export async function getGuides() {
  const { [STORAGE_KEYS.GUIDES]: guides } = await area().get(STORAGE_KEYS.GUIDES);
  return Array.isArray(guides) ? guides : [];
}

/**
 * Initialise / migrate storage. Called once from the service worker
 * on install and update.
 */
export async function initStorage() {
  const { [STORAGE_KEYS.SCHEMA_VERSION]: version } = await area().get(STORAGE_KEYS.SCHEMA_VERSION);
  if (version === SCHEMA_VERSION) return;
  // Future migrations go here: if (version < 2) { ... }
  await area().set({ [STORAGE_KEYS.SCHEMA_VERSION]: SCHEMA_VERSION });
}

/**
 * Subscribe to changes of specific keys.
 * @param {string[]} keys
 * @param {(changes: Record<string, chrome.storage.StorageChange>) => void} callback
 * @returns {() => void} unsubscribe
 */
export function onStorageChange(keys, callback) {
  const listener = (changes, areaName) => {
    if (areaName !== 'local') return;
    const relevant = Object.fromEntries(Object.entries(changes).filter(([k]) => keys.includes(k)));
    if (Object.keys(relevant).length) callback(relevant);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
