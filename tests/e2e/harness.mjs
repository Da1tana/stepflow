/**
 * Launches a clean Chromium with the unpacked extension loaded.
 * Shared by the e2e tests and `npm run chromium`.
 *
 * Uses Playwright's bundled Chromium by default (install once with
 * `npx playwright install chromium`). It is a separate browser with its
 * own throw-away profile, so corporate Chrome policies do not apply.
 *
 * Env:
 *   CHROMIUM_PATH  use another Chromium / Chrome for Testing binary
 *   HEADED=1       show the browser window while tests run
 *   EXTENSION_DIR  load another build, e.g. dist/stepflow
 */
import { chromium } from 'playwright';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const EXTENSION_PATH = process.env.EXTENSION_DIR ? resolve(process.env.EXTENSION_DIR) : REPO_ROOT;

/**
 * @param {{ headless?: boolean, userDataDir?: string, locale?: string }} [options]
 */
export async function launchWithExtension({ headless = !process.env.HEADED, userDataDir = '', locale = 'en-US' } = {}) {
  const context = await chromium.launchPersistentContext(userDataDir, {
    // Extensions need the full browser; "--headless=new" keeps it windowless.
    headless: false,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    locale,
    viewport: null,
    args: [
      ...(headless ? ['--headless=new'] : []),
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      `--lang=${locale}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  let [serviceWorker] = context.serviceWorkers();
  serviceWorker ??= await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(serviceWorker.url()).host;

  /** Opens an extension page (e.g. "src/popup/popup.html") in a tab and collects its errors. */
  async function openPage(path, viewport = { width: 380, height: 640 }) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    await page.setViewportSize(viewport);
    await page.goto(`chrome-extension://${extensionId}/${path}`);
    await page.waitForLoadState('load');
    return { page, errors };
  }

  async function openActionPopup() {
    if (typeof chrome === 'undefined') throw new Error('This helper must run in the test process');
    const popupPromise = context.waitForEvent('page', { timeout: 5_000 });
    await serviceWorker.evaluate(async () => {
      if (typeof chrome.action.openPopup !== 'function') {
        throw new Error('chrome.action.openPopup is unavailable in this Chromium build');
      }
      await chrome.action.openPopup();
    });
    const page = await popupPromise;
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    await page.waitForLoadState('domcontentloaded');
    return { page, errors };
  }

  async function stopServiceWorker() {
    const browser = context.browser();
    if (!browser) throw new Error('Persistent Chromium browser is unavailable');
    const cdp = await browser.newBrowserCDPSession();
    try {
      const { targetInfos } = await cdp.send('Target.getTargets');
      const target = targetInfos.find((item) => (
        item.type === 'service_worker'
        && item.url.startsWith(`chrome-extension://${extensionId}/`)
      ));
      if (!target) throw new Error('StepFlow service worker target was not found');
      const { success } = await cdp.send('Target.closeTarget', { targetId: target.targetId });
      if (!success) throw new Error('Chromium did not close the StepFlow service worker target');

      // Confirm termination at the protocol level before the test wakes the worker again.
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const { targetInfos: currentTargets } = await cdp.send('Target.getTargets');
        if (!currentTargets.some((item) => item.targetId === target.targetId)) {
          return target.targetId;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error('StepFlow service worker target remained active after Target.closeTarget');
    } finally {
      await cdp.detach();
    }
  }

  return { context, serviceWorker, extensionId, openPage, openActionPopup, stopServiceWorker };
}
