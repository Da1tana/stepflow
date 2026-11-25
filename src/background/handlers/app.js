import { MSG } from '../../shared/js/constants.js';
import { getGuides, getSettings } from '../../shared/js/storage.js';
import { countSteps } from '../../core/guide.js';

/** General application-level message handlers. */
export const appHandlers = {
  [MSG.APP_PING]: () => ({ pong: true, at: Date.now() }),

  [MSG.APP_GET_STATE]: async () => {
    const [guides, settings] = await Promise.all([getGuides(), getSettings()]);
    return {
      version: chrome.runtime.getManifest().version,
      recording: false, // will be backed by the recorder module
      guidesCount: guides.length,
      stepsCount: countSteps(guides),
      settings,
    };
  },
};
