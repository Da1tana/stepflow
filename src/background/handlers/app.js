import { MSG } from '../../shared/js/constants.js';
import { getGuides, getRecordingDraft, getSettings } from '../../shared/js/storage.js';
import { countSteps } from '../../core/guide.js';

/** General application-level message handlers. */
export const appHandlers = {
  [MSG.APP_PING]: () => ({ pong: true, at: Date.now() }),

  [MSG.APP_GET_STATE]: async () => {
    const [guides, settings, recordingDraft] = await Promise.all([
      getGuides(),
      getSettings(),
      getRecordingDraft(),
    ]);
    return {
      version: chrome.runtime.getManifest().version,
      recording: recordingDraft?.status === 'recording',
      recordingDraft,
      guidesCount: guides.length,
      stepsCount: countSteps(guides),
      settings,
    };
  },
};
