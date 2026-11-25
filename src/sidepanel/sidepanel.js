import { STORAGE_KEYS } from '../shared/js/constants.js';
import { applyI18n, t } from '../shared/js/i18n.js';
import { createLogger } from '../shared/js/logger.js';
import { getGuides, getSettings, onStorageChange, updateSettings } from '../shared/js/storage.js';

const log = createLogger('sidepanel');

const els = {
  tabs: document.querySelectorAll('.sf-tab'),
  views: document.querySelectorAll('.view'),
  guideList: document.getElementById('guide-list'),
  emptyState: document.getElementById('empty-state'),
  settingsForm: document.getElementById('settings-form'),
  version: document.getElementById('version'),
};

/* ---------- Navigation ---------- */
function showView(name) {
  els.tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.view === name)));
  els.views.forEach((view) => (view.hidden = view.dataset.view !== name));
}

/* ---------- Guides ---------- */
function renderGuides(guides) {
  const hasGuides = guides.length > 0;
  els.emptyState.hidden = hasGuides;
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
  onStorageChange([STORAGE_KEYS.SETTINGS], renderSettings);

  renderGuides(await getGuides());
  await renderSettings();
}

init().catch((err) => log.error('Init failed', err));
