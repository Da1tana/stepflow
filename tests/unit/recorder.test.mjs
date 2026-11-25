import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const recorderSource = readFileSync(
  new URL('../../src/content/recorder.js', import.meta.url),
  'utf8',
);

function createRecorderHarness() {
  const listeners = new Map();
  const messages = [];
  class FakeElement {
    constructor(tagName, attributes = {}) {
      this.tagName = tagName;
      this.attributes = attributes;
    }

    closest() { return this; }

    getAttribute(name) {
      if (name === 'value') throw new Error('Recorder must never read a form value attribute');
      return this.attributes[name] ?? null;
    }

    get value() { throw new Error('Recorder must never read input.value'); }
    get innerText() { throw new Error('Recorder must never read innerText'); }
    get textContent() { throw new Error('Recorder must never read textContent'); }
    get innerHTML() { throw new Error('Recorder must never read innerHTML'); }
    get outerHTML() { throw new Error('Recorder must never read outerHTML'); }
  }

  const context = {
    window: {},
    document: {
      addEventListener(type, listener, capture) {
        assert.equal(type, 'click');
        assert.equal(capture, true);
        listeners.set(type, listener);
      },
    },
    Element: FakeElement,
    chrome: {
      runtime: {
        sendMessage(message) {
          messages.push(message);
          return Promise.resolve();
        },
      },
    },
  };

  runInNewContext(recorderSource, context);
  return {
    click: (event) => listeners.get('click')(event),
    createElement: (tag, attrs) => new FakeElement(tag, attrs),
    messages,
  };
}

test('recorder ignores untrusted clicks and captures only explicit button metadata', () => {
  const app = createRecorderHarness();
  const button = app.createElement('BUTTON', { 'aria-label': 'Save changes' });

  app.click({ isTrusted: false, target: button });
  assert.equal(app.messages.length, 0, 'script-generated clicks are ignored');

  app.click({ isTrusted: true, target: button });
  assert.deepEqual(JSON.parse(JSON.stringify(app.messages)), [{
    type: 'recording/step-captured',
    payload: { descriptor: { role: 'button', label: 'Save changes' } },
  }]);
});

test('recorder never reads or sends password, text, email or textarea values', () => {
  const app = createRecorderHarness();
  const fields = [
    ['INPUT', { type: 'password' }, 'password'],
    ['INPUT', { type: 'text' }, 'textbox'],
    ['INPUT', { type: 'email' }, 'textbox'],
    ['TEXTAREA', {}, 'textbox'],
  ];

  for (const [tag, attrs, role] of fields) {
    app.click({ isTrusted: true, target: app.createElement(tag, attrs) });
  }

  assert.deepEqual(JSON.parse(JSON.stringify(app.messages.map((message) => message.payload.descriptor))), [
    { role: 'password', label: '' },
    { role: 'textbox', label: '' },
    { role: 'textbox', label: '' },
    { role: 'textbox', label: '' },
  ]);
  assert.equal(JSON.stringify(app.messages).includes('private'), false);
});

test('recorder ignores unsupported elements and does not use visible page text', () => {
  const app = createRecorderHarness();
  app.click({ isTrusted: true, target: app.createElement('DIV', { title: 'Not interactive' }) });
  assert.equal(app.messages.length, 0);
});
