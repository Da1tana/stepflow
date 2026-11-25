/**
 * End-to-end smoke tests: load the real unpacked extension into a clean
 * Chromium and drive the popup and side panel.
 *   npm run test:e2e            (headless)
 *   HEADED=1 npm run test:e2e   (watch it run)
 * Screenshots of every screen are written to test-results/.
 */
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { after, before, describe, test } from 'node:test';
import { REPO_ROOT, launchWithExtension } from './harness.mjs';

const SHOTS = `${REPO_ROOT}/test-results`;
mkdirSync(SHOTS, { recursive: true });

/** Fails if a page shows a raw i18n key instead of translated text. */
async function assertTranslated(page) {
  const untranslated = await page.$$eval('[data-i18n]', (els) => els.filter((el) => el.textContent === el.dataset.i18n || !el.textContent.trim()).map((el) => el.dataset.i18n));
  assert.deepEqual(untranslated, [], 'every [data-i18n] element has translated text');
}

for (const locale of ['en-US', 'ru-RU']) {
  describe(`StepFlow extension (${locale})`, () => {
    /** @type {Awaited<ReturnType<typeof launchWithExtension>>} */
    let app;

    before(async () => {
      app = await launchWithExtension({ locale });
    });
    after(async () => {
      await app?.context.close();
    });

    test('service worker starts and initialises storage', async () => {
      const manifest = await app.serviceWorker.evaluate(() => chrome.runtime.getManifest());
      assert.equal(manifest.manifest_version, 3);
      // onInstalled is async — give it a moment.
      await new Promise((r) => setTimeout(r, 300));
      const stored = await app.serviceWorker.evaluate(() => chrome.storage.local.get('sf.schemaVersion'));
      assert.equal(stored['sf.schemaVersion'], 1);
    });

    test('popup renders state from the service worker', async () => {
      const { page, errors } = await app.openPage('src/popup/popup.html', { width: 340, height: 320 });
      await page.waitForFunction(() => document.getElementById('version').textContent !== '');
      assert.equal(await page.textContent('#guides-count'), '0');
      assert.equal(await page.textContent('#steps-count'), '0');
      assert.match(await page.textContent('#version'), /^v\d+\.\d+\.\d+$/);
      assert.ok(await page.isEnabled('#start-recording'), 'recording can be started from the popup');
      await assertTranslated(page);
      await page.screenshot({ path: `${SHOTS}/popup-${locale}.png` });
      assert.deepEqual(errors, []);
      await page.close();
    });

    test('popup button opens the side panel', async () => {
      const { page, errors } = await app.openPage('src/popup/popup.html', { width: 340, height: 320 });
      await page.waitForFunction(() => !document.getElementById('open-panel').disabled);
      const closed = page.waitForEvent('close', { timeout: 5_000 });
      await page.click('#open-panel');
      // popup.js calls window.close() only after chrome.sidePanel.open() resolved.
      await closed;
      assert.deepEqual(errors, []);
    });

    test('side panel shows empty state, tabs and persists settings', async () => {
      const { page, errors } = await app.openPage('src/sidepanel/sidepanel.html');
      assert.ok(await page.isVisible('#empty-state'));
      assert.ok(await page.isHidden('#guide-list'));
      await assertTranslated(page);
      await page.screenshot({ path: `${SHOTS}/sidepanel-${locale}.png`, fullPage: true });

      await page.click('.sf-tab[data-view="settings"]');
      assert.ok(await page.isVisible('#view-settings'));
      assert.ok(await page.isHidden('#view-guides'));
      assert.ok(await page.isChecked('input[name="highlightClicks"]'), 'default is on');

      await page.click('input[name="highlightClicks"]');
      await page.waitForTimeout(200);
      const { 'sf.settings': settings } = await app.serviceWorker.evaluate(() => chrome.storage.local.get('sf.settings'));
      assert.equal(settings.highlightClicks, false);

      await page.reload();
      await page.click('.sf-tab[data-view="settings"]');
      assert.equal(await page.isChecked('input[name="highlightClicks"]'), false, 'setting survives reload');
      await page.screenshot({ path: `${SHOTS}/sidepanel-settings-${locale}.png` });
      assert.deepEqual(errors, []);
      await page.close();
    });


    test('service worker sanitizes untrusted recording descriptors before persistence', async () => {
      const { page, errors } = await app.openPage('src/popup/popup.html', { width: 340, height: 320 });
      const tabId = await app.serviceWorker.evaluate(async () => {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        return tab.id;
      });
      await app.serviceWorker.evaluate(async (id) => {
        await chrome.storage.local.set({
          'sf.recordingDraft': {
            id: 'privacy-boundary-test',
            tabId: id,
            status: 'recording',
            origin: 'chrome-extension://test',
            startedAt: Date.now(),
            updatedAt: Date.now(),
            steps: [],
          },
        });
      }, tabId);

      const response = await page.evaluate(async () => chrome.runtime.sendMessage({
        type: 'recording/step-captured',
        payload: { descriptor: { role: 'password', label: 'private-password-canary-123' } },
      }));
      assert.equal(response.accepted, true);

      const { 'sf.recordingDraft': draft } = await app.serviceWorker.evaluate(() =>
        chrome.storage.local.get('sf.recordingDraft'),
      );
      assert.equal(draft.steps.length, 1);
      assert.match(draft.steps[0].title, /password field|поле пароля/i,
        'password role produces only a generic step title');
      assert.ok(!JSON.stringify(draft).includes('private-password-canary-123'));
      assert.deepEqual(errors, []);
      await app.serviceWorker.evaluate(() => chrome.storage.local.remove('sf.recordingDraft'));
      await page.close();
    });

    test('side panel shows recording steps and can save or discard a draft', async () => {
      const { page, errors } = await app.openPage('src/sidepanel/sidepanel.html');
      const draft = {
        id: 'recording-test',
        status: 'recording',
        tabId: 1,
        origin: 'https://example.com',
        startedAt: Date.now(),
        updatedAt: Date.now(),
        steps: [
          { id: 'step-a', index: 1, title: 'Нажмите', createdAt: Date.now() },
          { id: 'step-b', index: 2, title: 'Нажмите «Сохранить»', createdAt: Date.now() },
        ],
      };
      await app.serviceWorker.evaluate((value) => chrome.storage.local.set({ 'sf.recordingDraft': value }), draft);
      await page.waitForSelector('#recording-card:not([hidden])');
      assert.equal(await page.locator('#recording-steps li').count(), 2);
      assert.equal(await page.locator('#recording-steps').textContent(), '1Нажмите2Нажмите «Сохранить»');
      await page.click('#stop-recording');
      await page.waitForFunction(() => document.getElementById('recording-card').hidden);
      const saved = await app.serviceWorker.evaluate(() => chrome.storage.local.get(['sf.guides', 'sf.recordingDraft']));
      assert.equal(saved['sf.guides'].length, 1);
      assert.equal(saved['sf.guides'][0].steps.length, 2);
      assert.equal(saved['sf.recordingDraft'] ?? null, null);

      const secondDraft = { ...draft, id: 'recording-cancel-test', steps: [{ id: 'step-c', index: 1, title: 'Нажмите', createdAt: Date.now() }] };
      await app.serviceWorker.evaluate((value) => chrome.storage.local.set({ 'sf.recordingDraft': value }), secondDraft);
      await page.waitForSelector('#recording-card:not([hidden])');
      await page.click('#cancel-recording');
      await page.waitForFunction(() => document.getElementById('recording-card').hidden);
      const afterCancel = await app.serviceWorker.evaluate(() => chrome.storage.local.get(['sf.guides', 'sf.recordingDraft']));
      assert.equal(afterCancel['sf.guides'].length, 1, 'cancel does not create a guide');
      assert.equal(afterCancel['sf.recordingDraft'] ?? null, null);
      assert.deepEqual(errors, []);
      await page.close();
    });

    test('guides from storage appear live in the side panel and popup', async () => {
      const { page, errors } = await app.openPage('src/sidepanel/sidepanel.html');
      await app.serviceWorker.evaluate(() =>
        chrome.storage.local.set({
          'sf.guides': [
            { id: 'a', title: 'Create an invoice', steps: [{ id: '1' }, { id: '2' }, { id: '3' }], createdAt: 0, updatedAt: 0 },
            { id: 'b', title: '<img src=x onerror=alert(1)>', steps: [{ id: '4' }], createdAt: 0, updatedAt: 0 },
          ],
        }),
      );
      await page.waitForSelector('#guide-list:not([hidden]) li');
      assert.equal(await page.locator('#guide-list li').count(), 2);
      assert.ok(await page.isHidden('#empty-state'));
      assert.equal(await page.locator('#guide-list img').count(), 0, 'titles are rendered as text, not HTML');

      const popup = await app.openPage('src/popup/popup.html', { width: 340, height: 320 });
      await popup.page.waitForFunction(() => document.getElementById('guides-count').textContent === '2');
      assert.equal(await popup.page.textContent('#steps-count'), '4');

      await app.serviceWorker.evaluate(() => chrome.storage.local.remove('sf.guides'));
      await page.waitForSelector('#empty-state:not([hidden])');
      assert.deepEqual([...errors, ...popup.errors], []);
    });

    test('service worker answers messages', async () => {
      const { page } = await app.openPage('src/popup/popup.html');
      const pong = await page.evaluate(() => chrome.runtime.sendMessage({ type: 'app/ping' }));
      assert.equal(pong.ok, true);
      await page.close();
    });
  });
}
