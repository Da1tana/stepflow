import { APP } from './constants.js';

/**
 * Tiny scoped logger. Use instead of bare console.* so that
 * every log line is attributable to a context (e.g. "sw", "popup").
 */
export function createLogger(scope) {
  const prefix = `${APP.LOG_PREFIX}[${scope}]`;
  return {
    info: (...args) => console.info(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
  };
}
