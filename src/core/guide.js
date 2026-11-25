/**
 * Domain model for guides and steps.
 * Pure functions only — no chrome.* APIs — so this module can be
 * reused by the recorder, the editor and exporters, and unit-tested
 * in plain Node.
 */

/**
 * @typedef {Object} Step
 * @property {string} id
 * @property {number} index        1-based order inside the guide
 * @property {string} title        Human-readable action ("Click “Save”")
 * @property {string} [description]
 * @property {string} [screenshotId]  Reference to a stored screenshot
 * @property {string} [url]        Page where the action happened
 * @property {number} createdAt
 */

/**
 * @typedef {Object} Guide
 * @property {string} id
 * @property {string} title
 * @property {Step[]} steps
 * @property {number} createdAt
 * @property {number} updatedAt
 */

const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/** @returns {Guide} */
export function createGuide({ title = 'Untitled guide' } = {}) {
  const now = Date.now();
  return { id: uid(), title, steps: [], createdAt: now, updatedAt: now };
}

/** @returns {Guide} new guide object with the step appended */
export function addStep(guide, { title, description, screenshotId, url }) {
  const step = {
    id: uid(),
    index: guide.steps.length + 1,
    title,
    description,
    screenshotId,
    url,
    createdAt: Date.now(),
  };
  return { ...guide, steps: [...guide.steps, step], updatedAt: step.createdAt };
}

export function countSteps(guides) {
  return guides.reduce((sum, g) => sum + (g.steps?.length || 0), 0);
}
