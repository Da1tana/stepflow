/**
 * Typed request/response messaging on top of chrome.runtime.
 *
 * Every response has the shape { ok: true, data } | { ok: false, error }.
 * The service worker registers handlers via createRouter(); UI contexts
 * call sendMessage(). New features add handlers — nothing else changes.
 */

/**
 * Send a message to the extension (service worker).
 * @param {string} type  One of MSG.*
 * @param {unknown} [payload]
 * @returns {Promise<unknown>} resolved `data`, rejects on handler error
 */
export async function sendMessage(type, payload) {
  const response = await chrome.runtime.sendMessage({ type, payload });
  if (!response) throw new Error(`No handler responded to "${type}"`);
  if (!response.ok) throw new Error(response.error || `Message "${type}" failed`);
  return response.data;
}

/**
 * Build an onMessage listener from a map of handlers.
 * Handlers may be sync or async and receive (payload, sender).
 * @param {Record<string, (payload: any, sender: chrome.runtime.MessageSender) => any>} handlers
 * @param {{ error: Function }} [logger]
 */
export function createRouter(handlers, logger = console) {
  return (message, sender, sendResponse) => {
    const handler = message && handlers[message.type];
    if (!handler) return false; // not ours — let other listeners respond

    Promise.resolve()
      .then(() => handler(message.payload, sender))
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => {
        logger.error(`Handler "${message.type}" failed:`, err);
        sendResponse({ ok: false, error: String(err?.message || err) });
      });

    return true; // keep the channel open for the async response
  };
}
