import { pauseRecording, resumeRecording } from '../core/recording.js';

/**
 * Persist recording state across tab navigation and closure.
 * Only tab IDs and loading status are observed; URLs and page content are never read.
 */
export function registerRecordingLifecycle({ tabs, scripting, getDraft, setDraft, logger = console }) {
  async function pauseForNavigation(tabId) {
    const draft = await getDraft();
    if (!draft || draft.tabId !== tabId || draft.status !== 'recording') return;
    await setDraft(pauseRecording(draft, 'navigation'));
  }

  async function resumeAfterNavigation(tabId) {
    const draft = await getDraft();
    if (!draft || draft.tabId !== tabId || draft.status !== 'paused' || draft.pauseReason !== 'navigation') return;

    try {
      await scripting.executeScript({
        target: { tabId },
        files: ['src/content/recorder.js'],
      });
    } catch (error) {
      // activeTab access may have been revoked after a cross-origin navigation.
      // Keep the draft paused; the user can still save or discard captured steps.
      logger.warn('Recording remains paused after navigation', error);
      return;
    }

    const latest = await getDraft();
    if (latest?.id !== draft.id || latest.status !== 'paused' || latest.pauseReason !== 'navigation') return;
    await setDraft(resumeRecording(latest));
  }

  async function pauseForTabClose(tabId) {
    const draft = await getDraft();
    if (!draft || draft.tabId !== tabId || !['recording', 'paused'].includes(draft.status)) return;
    if (draft.status === 'recording') {
      await setDraft(pauseRecording(draft, 'tab-closed'));
      return;
    }
    await setDraft({ ...draft, pauseReason: 'tab-closed', updatedAt: Date.now() });
  }

  tabs.onUpdated.addListener((tabId, changeInfo) => {
    const task = changeInfo.status === 'loading'
      ? pauseForNavigation(tabId)
      : changeInfo.status === 'complete'
        ? resumeAfterNavigation(tabId)
        : Promise.resolve();
    return task.catch((error) => logger.error('Recording navigation lifecycle failed', error));
  });

  tabs.onRemoved.addListener((tabId) => {
    return pauseForTabClose(tabId).catch((error) => logger.error('Recording tab-close handling failed', error));
  });
}
