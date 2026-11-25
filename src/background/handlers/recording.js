import { appendRecordingStep, createRecordingSession, stopRecording } from '../../core/recording.js';
import { createGuideFromRecording } from '../../core/guide.js';
import { sanitizeElementDescriptor } from '../../core/privacy.js';
import { isRestrictedUrl } from '../../core/restricted-url.js';
import { MSG } from '../../shared/js/constants.js';
import { getRecordingDraft, setRecordingDraft, saveGuideFromRecording } from '../../shared/js/storage.js';

function assertExtensionSender(sender) {
  if (sender.id !== chrome.runtime.id) throw new Error('Untrusted message sender');
}

export const recordingHandlers = {
  [MSG.RECORDING_START]: async (_payload, sender) => {
    assertExtensionSender(sender);
    if (sender.url !== chrome.runtime.getURL('src/popup/popup.html')) {
      throw new Error('Recording must be started from the StepFlow popup');
    }

    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || !Number.isInteger(tab.id) || !tab.url || isRestrictedUrl(tab.url)) {
      throw new Error('This tab cannot be recorded. Open a regular HTTP or HTTPS page.');
    }

    const existing = await getRecordingDraft();
    if (existing?.status === 'recording' || existing?.status === 'paused') {
      throw new Error('A recording is already active');
    }

    const session = createRecordingSession({
      tabId: tab.id,
      pageUrl: tab.url,
    });

    await setRecordingDraft(session);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/recorder.js'],
      });
    } catch (error) {
      await setRecordingDraft(null);
      throw new Error('Could not access this page. Reopen StepFlow on the page and try again.');
    }

    return { status: session.status, steps: session.steps.length };
  },

  [MSG.RECORDING_STOP]: async (_payload, sender) => {
    assertExtensionSender(sender);
    if (sender.url !== chrome.runtime.getURL('src/sidepanel/sidepanel.html')) {
      throw new Error('Recording can only be completed from the StepFlow side panel');
    }

    const draft = await getRecordingDraft();
    if (!draft || !['recording', 'paused'].includes(draft.status)) {
      throw new Error('There is no active recording');
    }
    if (!draft.steps?.length) {
      throw new Error('Record at least one supported click before saving');
    }

    const stopped = stopRecording(draft);
    const locale = chrome.i18n.getUILanguage();
    const date = new Intl.DateTimeFormat(locale).format(new Date(stopped.startedAt));
    const title = locale.startsWith('ru') ? `Инструкция от ${date}` : `Guide from ${date}`;
    const guide = createGuideFromRecording(stopped, { title });
    await saveGuideFromRecording(guide);
    return { guideId: guide.id, steps: guide.steps.length };
  },

  [MSG.RECORDING_CANCEL]: async (_payload, sender) => {
    assertExtensionSender(sender);
    if (sender.url !== chrome.runtime.getURL('src/sidepanel/sidepanel.html')) {
      throw new Error('Recording can only be cancelled from the StepFlow side panel');
    }
    const draft = await getRecordingDraft();
    if (!draft) return { cancelled: false };
    await setRecordingDraft(null);
    return { cancelled: true };
  },

  [MSG.RECORDING_STEP_CAPTURED]: async (payload, sender) => {
    assertExtensionSender(sender);
    if (!sender.tab || !Number.isInteger(sender.tab.id) || sender.frameId !== 0) return { accepted: false };

    const draft = await getRecordingDraft();
    if (!draft || draft.status !== 'recording' || draft.tabId !== sender.tab.id) {
      return { accepted: false };
    }

    const descriptor = sanitizeElementDescriptor(payload?.descriptor);
    if (!descriptor) return { accepted: false };

    const next = appendRecordingStep(draft, descriptor, {
      locale: chrome.i18n.getUILanguage(),
    });
    if (next === draft) return { accepted: false };
    await setRecordingDraft(next);
    return { accepted: true, steps: next.steps.length };
  },
};
