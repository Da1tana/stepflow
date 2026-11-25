import { appendRecordingStep, createRecordingSession } from '../../core/recording.js';
import { sanitizeElementDescriptor } from '../../core/privacy.js';
import { isRestrictedUrl } from '../../core/restricted-url.js';
import { MSG } from '../../shared/js/constants.js';
import { getRecordingDraft, setRecordingDraft } from '../../shared/js/storage.js';

function assertExtensionSender(sender) {
  if (sender.id !== chrome.runtime.id) throw new Error('Untrusted message sender');
}

export const recordingHandlers = {
  [MSG.RECORDING_START]: async (_payload, sender) => {
    assertExtensionSender(sender);
    if (!sender.url?.startsWith(chrome.runtime.getURL(''))) {
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
