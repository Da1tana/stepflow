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

  // Serialize lifecycle events so a fast "complete" cannot overtake the
  // asynchronous storage write triggered by the preceding "loading" event.
  let queue = Promise.resolve();
  const enqueue = (task, message) => {
    queue = queue.then(task).catch((error) => logger.error(message, error));
    return queue;
  };

  tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
      return enqueue(() => pauseForNavigation(tabId), 'Recording navigation pause failed');
    }
    if (changeInfo.status === 'complete') {
      return enqueue(() => resumeAfterNavigation(tabId), 'Recording navigation recovery failed');
    }
    return undefined;
  });

  tabs.onRemoved.addListener((tabId) => (
    enqueue(() => pauseForTabClose(tabId), 'Recording tab-close handling failed')
  ));
}
