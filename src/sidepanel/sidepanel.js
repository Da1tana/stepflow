import { MSG, STORAGE_KEYS } from '../shared/js/constants.js';
import { applyI18n, t } from '../shared/js/i18n.js';
import { createLogger } from '../shared/js/logger.js';
import { getGuides, getRecordingDraft, getSettings, onStorageChange, updateSettings } from '../shared/js/storage.js';
import { sendMessage } from '../shared/js/messaging.js';

const log = createLogger('sidepanel');

const els = {
  tabs: document.querySelectorAll('.sf-tab'),
  views: document.querySelectorAll('.view'),
  guideList: document.getElementById('guide-list'),
  emptyState: document.getElementById('empty-state'),
  settingsForm: document.getElementById('settings-form'),
  version: document.getElementById('version'),
  recordingCard: document.getElementById('recording-card'),
  recordingStatus: document.getElementById('recording-status'),
  recordingCount: document.getElementById('recording-count'),
  recordingSteps: document.getElementById('recording-steps'),
  stopRecording: document.getElementById('stop-recording'),
  cancelRecording: document.getElementById('cancel-recording'),
  recordingError: document.getElementById('recording-error'),
};

/* ---------- Navigation ---------- */
function showView(name) {
  els.tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.view === name)));
  els.views.forEach((view) => (view.hidden = view.dataset.view !== name));
}

let currentGuides = [];
let currentDraft = null;

/* ---------- Guides ---------- */
function renderGuides(guides) {
  currentGuides = guides;
  const hasGuides = guides.length > 0;
  els.emptyState.hidden = hasGuides || Boolean(currentDraft);
  els.guideList.hidden = !hasGuides;
  els.guideList.replaceChildren(
    ...guides.map((guide) => {
      const li = document.createElement('li');
      li.className = 'sf-card guide-item';
      const title = document.createElement('span');
      title.textContent = guide.title;
      const meta = document.createElement('span');
      meta.className = 'sf-subtle';
      meta.textContent = `${guide.steps.length} ${t('statSteps').toLowerCase()}`;
      li.append(title, meta);
      return li;
    }),
  );
}

/* ---------- Recording ---------- */
function renderRecording(draft) {
  currentDraft = draft;
  const active = Boolean(draft && ['recording', 'paused'].includes(draft.status));
  els.recordingCard.hidden = !active;
  els.emptyState.hidden = currentGuides.length > 0 || active;
  if (!active) return;

  const paused = draft.status === 'paused';
  els.recordingStatus.textContent = chrome.i18n.getMessage(paused ? 'recordingPaused' : 'recordingActive');
  els.recordingCount.textContent = String(draft.steps.length);
  els.recordingSteps.replaceChildren(...draft.steps.map((step) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'recording-steps__number';
    number.textContent = String(step.index);
    const title = document.createElement('span');
    title.textContent = step.title;
    item.append(number, title);
    return item;
  }));
  els.stopRecording.disabled = draft.steps.length === 0;
  els.recordingError.hidden = true;
}

async function finishRecording() {
  els.stopRecording.disabled = true;
  els.recordingError.hidden = true;
  try {
    await sendMessage(MSG.RECORDING_STOP);
    renderGuides(await getGuides());
    renderRecording(null);
  } catch (err) {
    els.recordingError.textContent = err.message;
    els.recordingError.hidden = false;
    els.stopRecording.disabled = false;
  }
}

async function cancelRecording() {
  els.cancelRecording.disabled = true;
  els.recordingError.hidden = true;
  try {
    await sendMessage(MSG.RECORDING_CANCEL);
    renderRecording(null);
  } catch (err) {
    els.recordingError.textContent = err.message;
    els.recordingError.hidden = false;
    els.cancelRecording.disabled = false;
  }
}

/* ---------- Settings ---------- */
async function renderSettings() {
  const settings = await getSettings();
  for (const input of els.settingsForm.elements) {
    if (input.name in settings) input.checked = Boolean(settings[input.name]);
  }
}

async function onSettingChange(event) {
  const { name, checked } = event.target;
  try {
    await updateSettings({ [name]: checked });
  } catch (err) {
    log.error('Failed to save setting', err);
  }
}

/* ---------- Init ---------- */
async function init() {
  applyI18n();
  els.version.textContent = `v${chrome.runtime.getManifest().version}`;

  els.tabs.forEach((tab) => tab.addEventListener('click', () => showView(tab.dataset.view)));
  els.settingsForm.addEventListener('change', onSettingChange);

  onStorageChange([STORAGE_KEYS.GUIDES], async () => renderGuides(await getGuides()));
  onStorageChange([STORAGE_KEYS.RECORDING_DRAFT], async () => renderRecording(await getRecordingDraft()));
  els.stopRecording.addEventListener('click', finishRecording);
  els.cancelRecording.addEventListener('click', cancelRecording);
  onStorageChange([STORAGE_KEYS.SETTINGS], renderSettings);

  renderGuides(await getGuides());
  renderRecording(await getRecordingDraft());
  await renderSettings();
}

init().catch((err) => log.error('Init failed', err));
