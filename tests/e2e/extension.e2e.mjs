/**
 * End-to-end smoke tests: load the real unpacked extension into a clean
 * Chromium and drive the popup and side panel.
 *   npm run test:e2e            (headless)
 *   HEADED=1 npm run test:e2e   (watch it run)
 * Screenshots of every screen are written to test-results/.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
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

    if (locale === 'en-US') {
      test('native action popup starts recording and real page clicks stay privacy-safe', async () => {
        const server = createServer((_request, response) => {
          response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
          response.end(`<!doctype html>
            <html><body>
              <label>Text <input id="text-field" type="text"></label>
              <label>Email <input id="email-field" type="email"></label>
              <label>Password <input id="password-field" type="password"></label>
              <label>Notes <textarea id="notes-field"></textarea></label>
              <button id="safe-action" aria-label="Save safe action">Save</button>
            </body></html>`);
        });
        await new Promise((resolve, reject) => {
          server.once('error', reject);
          server.listen(0, '127.0.0.1', resolve);
        });

        const target = await app.context.newPage();
        const address = server.address();
        const canaries = [
          'sf-text-canary-7f31',
          'sf-email-canary-9a42@example.test',
          'sf-password-canary-5c83',
          'sf-notes-canary-2d64',
        ];

        try {
          await target.goto(`http://127.0.0.1:${address.port}/fixture`);
          await target.bringToFront();
          const popup = await app.openActionPopup();
          await popup.page.waitForFunction(() => !document.getElementById('start-recording').disabled, null, { timeout: 5_000 });
          const popupClosed = popup.page.waitForEvent('close', { timeout: 5_000 });
          await popup.page.click('#start-recording');
          await popupClosed;
          assert.deepEqual(popup.errors, []);

          for (const [selector, value] of [
            ['#text-field', canaries[0]],
            ['#email-field', canaries[1]],
            ['#password-field', canaries[2]],
            ['#notes-field', canaries[3]],
          ]) {
            await target.locator(selector).fill(value);
            await target.locator(selector).click();
          }
          await target.locator('#safe-action').click();

          let draft;
          for (let attempt = 0; attempt < 50; attempt += 1) {
            draft = await app.serviceWorker.evaluate(async () => {
              const { 'sf.recordingDraft': value } = await chrome.storage.local.get('sf.recordingDraft');
              return value;
            });
            if (draft?.status === 'recording' && draft.steps.length === 5) break;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          assert.equal(draft.steps.length, 5);
          assert.ok(draft.steps.some((step) => step.title.includes('Save safe action')));
          const serialized = JSON.stringify(draft);
          for (const canary of canaries) {
            assert.equal(serialized.includes(canary), false, `stored draft must not contain ${canary}`);
          }
          const panel = await app.openPage('src/sidepanel/sidepanel.html');
          await panel.page.waitForSelector('#recording-card:not([hidden])');
          await panel.page.click('#stop-recording');
          await panel.page.waitForSelector('#recording-card[hidden]');
          const stored = await app.serviceWorker.evaluate(() =>
            chrome.storage.local.get(['sf.guides', 'sf.recordingDraft']),
          );
          assert.equal(stored['sf.guides'].length, 1);
          assert.equal(stored['sf.guides'][0].steps.length, 5);
          const saved = JSON.stringify(stored['sf.guides']);
          for (const canary of canaries) {
            assert.equal(saved.includes(canary), false, `saved guide must not contain ${canary}`);
          }
          assert.equal(stored['sf.recordingDraft'] ?? null, null);
          assert.deepEqual(popup.errors, []);
          assert.deepEqual(panel.errors, []);
          await app.serviceWorker.evaluate(() => chrome.storage.local.remove('sf.guides'));
          await panel.page.close();
        } finally {
          await target.close();
          await new Promise((resolve) => server.close(resolve));
        }
      });
    }

    if (locale === 'en-US') {
      test('same-origin navigation resumes capture and cross-origin navigation keeps it paused', async () => {
        const makeServer = (label) => createServer((_request, response) => {
          response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
          response.end(`<!doctype html><html><body>
            <button id="safe-action">${label} safe action</button>
          </body></html>`);
        });
        const sameOriginServer = makeServer('Same-origin');
        const crossOriginServer = makeServer('Cross-origin');
        const listen = (server) => new Promise((resolve, reject) => {
          server.once('error', reject);
          server.listen(0, '127.0.0.1', resolve);
        });
        await Promise.all([listen(sameOriginServer), listen(crossOriginServer)]);
        const sameOriginAddress = sameOriginServer.address();
        const crossOriginAddress = crossOriginServer.address();
        const target = await app.context.newPage();
        const monitor = await app.openPage('src/sidepanel/sidepanel.html');
        await monitor.page.evaluate(() => {
          window.__draftStates = [];
          chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes['sf.recordingDraft']) {
              window.__draftStates.push(changes['sf.recordingDraft'].newValue ?? null);
            }
          });
        });

        const readDraft = () => app.serviceWorker.evaluate(async () => {
          const { 'sf.recordingDraft': value } = await chrome.storage.local.get('sf.recordingDraft');
          return value ?? null;
        });
        const waitForDraft = async (predicate, message) => {
          for (let attempt = 0; attempt < 100; attempt += 1) {
            const value = await readDraft();
            if (predicate(value)) return value;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          assert.fail(message);
        };

        try {
          await target.goto(`http://127.0.0.1:${sameOriginAddress.port}/start`);
          await target.bringToFront();
          const popup = await app.openActionPopup();
          await popup.page.waitForFunction(() => !document.getElementById('start-recording').disabled, null, { timeout: 5_000 });
          const popupClosed = popup.page.waitForEvent('close', { timeout: 5_000 });
          await popup.page.click('#start-recording');
          await popupClosed;
          assert.deepEqual(popup.errors, []);

          const initial = await waitForDraft((value) => value?.status === 'recording', 'recording did not start');
          assert.ok(initial.steps.length === 0);

          await target.goto(`http://127.0.0.1:${sameOriginAddress.port}/same-origin`);
          await monitor.page.waitForFunction(() => window.__draftStates.some((value) => value?.status === 'paused' && value.pauseReason === 'navigation'));
          await monitor.page.waitForFunction(() => window.__draftStates.some((value) => value?.status === 'recording' && value.pauseReason === null));
          const resumed = await waitForDraft(
            (value) => value?.status === 'recording' && value.pauseReason === null,
            'same-origin navigation did not resume recording',
          );
          assert.equal(resumed.id, initial.id);
          await target.locator('#safe-action').click();
          const captured = await waitForDraft(
            (value) => value?.status === 'recording' && value.steps.length === 1,
            'recorder did not capture a click after same-origin navigation',
          );
          assert.match(captured.steps[0].title, /Same-origin safe action/);

          await target.goto(`http://127.0.0.1:${crossOriginAddress.port}/cross-origin`);
          await monitor.page.waitForFunction(() => window.__draftStates.some((value) => value?.status === 'paused' && value.pauseReason === 'navigation'));
          await new Promise((resolve) => setTimeout(resolve, 500));
          const paused = await readDraft();
          assert.equal(paused?.status, 'paused', 'cross-origin navigation must not resume without activeTab access');
          assert.equal(paused.pauseReason, 'navigation');
          assert.equal(paused.id, initial.id);
          assert.equal(paused.steps.length, 1, 'captured steps survive denied reinjection');
          assert.match(paused.steps[0].title, /Same-origin safe action/);
        } finally {
          await target.close();
          await monitor.page.close();
          await Promise.all([
            new Promise((resolve) => sameOriginServer.close(resolve)),
            new Promise((resolve) => crossOriginServer.close(resolve)),
          ]);
          await app.serviceWorker.evaluate(() => chrome.storage.local.remove('sf.recordingDraft'));
        }
      });
    }

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


    test('recording draft survives service worker termination and restart', async () => {
      const { page, errors } = await app.openPage('src/sidepanel/sidepanel.html');
      const draft = {
        id: 'worker-restart-e2e',
        tabId: 7,
        status: 'paused',
        pauseReason: 'navigation',
        origin: 'https://example.test',
        startedAt: 1,
        updatedAt: 2,
        steps: [{ id: 'persisted-step', index: 1, title: 'Click safe action', createdAt: 1 }],
      };
      await page.evaluate((value) => chrome.storage.local.set({ 'sf.recordingDraft': value }), draft);

      await app.stopServiceWorker();

      const pong = await page.evaluate(() => chrome.runtime.sendMessage({ type: 'app/ping' }));
      assert.equal(pong.ok, true, 'service worker responds after it is restarted');
      // Playwright keeps the extension Worker handle stable across suspension/restart.
      const { 'sf.recordingDraft': persisted } = await app.serviceWorker.evaluate(() =>
        chrome.storage.local.get('sf.recordingDraft'),
      );
      assert.equal(persisted.id, 'worker-restart-e2e');
      assert.equal(persisted.steps.length, 1);
      assert.equal(persisted.steps[0].id, 'persisted-step');
      assert.equal(persisted.pauseReason, 'navigation');
      assert.deepEqual(errors, []);
      await page.evaluate(() => chrome.storage.local.remove('sf.recordingDraft'));
      await page.close();
    });

    test('closing the recorded browser tab preserves its draft as paused', async () => {
      const target = await app.context.newPage();
      await target.goto('about:blank');
      await target.bringToFront();

      const tabId = await app.serviceWorker.evaluate(async () => {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        return tab.id;
      });
      await app.serviceWorker.evaluate(async (id) => {
        await chrome.storage.local.set({
          'sf.recordingDraft': {
            id: 'tab-close-e2e',
            tabId: id,
            status: 'recording',
            pauseReason: null,
            origin: 'https://example.test',
            startedAt: 1,
            updatedAt: 1,
            steps: [{ id: 'kept-step', index: 1, title: 'Click safe action', createdAt: 1 }],
          },
        });
      }, tabId);

      await target.close();
      const { page, errors } = await app.openPage('src/sidepanel/sidepanel.html');
      await page.waitForFunction(async () => {
        const { 'sf.recordingDraft': draft } = await chrome.storage.local.get('sf.recordingDraft');
        return draft?.status === 'paused' && draft.pauseReason === 'tab-closed';
      }, null, { timeout: 5_000 });

      const { 'sf.recordingDraft': draft } = await page.evaluate(() =>
        chrome.storage.local.get('sf.recordingDraft'),
      );
      assert.equal(draft.steps.length, 1);
      assert.equal(draft.steps[0].id, 'kept-step');
      assert.equal(draft.pauseReason, 'tab-closed');
      await page.evaluate(() => chrome.storage.local.remove('sf.recordingDraft'));
      assert.deepEqual(errors, []);
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
