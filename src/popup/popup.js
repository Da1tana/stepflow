import { MSG } from '../shared/js/constants.js';
import { applyI18n } from '../shared/js/i18n.js';
import { createLogger } from '../shared/js/logger.js';
import { sendMessage } from '../shared/js/messaging.js';

const log = createLogger('popup');

const els = {
  openPanel: document.getElementById('open-panel'),
  guidesCount: document.getElementById('guides-count'),
  stepsCount: document.getElementById('steps-count'),
  version: document.getElementById('version'),
};

// Resolved up-front: chrome.sidePanel.open() must be called synchronously
// inside the user gesture, so no `await` may precede it in the click handler.
// The button stays disabled until the window id is known.
let windowId;
els.openPanel.disabled = true;
chrome.windows.getCurrent().then((win) => {
  windowId = win.id;
  els.openPanel.disabled = false;
});

/** Opens the side panel for the current window. */
async function openSidePanel() {
  try {
    await chrome.sidePanel.open({ windowId });
    window.close();
  } catch (err) {
    log.error('Failed to open side panel', err);
  }
}

async function renderState() {
  try {
    const state = await sendMessage(MSG.APP_GET_STATE);
    els.guidesCount.textContent = state.guidesCount;
    els.stepsCount.textContent = state.stepsCount;
    els.version.textContent = `v${state.version}`;
  } catch (err) {
    log.error('Failed to load state', err);
  }
}

applyI18n();
els.openPanel.addEventListener('click', openSidePanel);
renderState();
