import { MSG } from '../shared/js/constants.js';
import { applyI18n } from '../shared/js/i18n.js';
import { createLogger } from '../shared/js/logger.js';
import { sendMessage } from '../shared/js/messaging.js';

const log = createLogger('popup');
const els = {
  start: document.getElementById('start-recording'),
  openPanel: document.getElementById('open-panel'),
  status: document.getElementById('status-message'),
  guidesCount: document.getElementById('guides-count'),
  stepsCount: document.getElementById('steps-count'),
  version: document.getElementById('version'),
};

let windowId;
els.start.disabled = true;
els.openPanel.disabled = true;

chrome.windows.getCurrent().then((win) => {
  windowId = win.id;
  els.start.disabled = false;
  els.openPanel.disabled = false;
}).catch((err) => log.error('Could not resolve current window', err));

async function openSidePanel() {
  try {
    await chrome.sidePanel.open({ windowId });
    window.close();
  } catch (err) {
    log.error('Failed to open side panel', err);
  }
}

async function startRecording() {
  els.start.disabled = true;
  els.status.textContent = chrome.i18n.getMessage('statusStarting');
  try {
    // Invoke Side Panel API before awaiting anything so the user gesture is preserved.
    const panelOpening = chrome.sidePanel.open({ windowId });
    await sendMessage(MSG.RECORDING_START);
    await panelOpening;
    window.close();
  } catch (err) {
    log.warn('Could not start recording', err);
    els.status.textContent = chrome.i18n.getMessage('statusStartFailed');
    els.start.disabled = false;
  }
}

async function renderState() {
  try {
    const state = await sendMessage(MSG.APP_GET_STATE);
    els.guidesCount.textContent = state.guidesCount;
    els.stepsCount.textContent = state.stepsCount;
    els.version.textContent = `v${state.version}`;
    if (state.recording) {
      els.start.disabled = true;
      els.status.textContent = chrome.i18n.getMessage('statusRecording');
    }
  } catch (err) {
    log.error('Failed to load state', err);
  }
}

applyI18n();
els.openPanel.addEventListener('click', openSidePanel);
els.start.addEventListener('click', startRecording);
renderState();
