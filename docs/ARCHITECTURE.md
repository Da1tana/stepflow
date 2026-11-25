# Архитектура StepFlow

## Принципы

1. **Без сборки.** Чистые ES-модули, HTML и CSS. Chrome загружает исходники напрямую. Сборщик можно добавить позже, не меняя структуру.
2. **Всё локально.** Нет сервера, сетевых запросов и платных API. Данные живут в `chrome.storage.local` (позже скриншоты — в IndexedDB).
3. **Минимум разрешений.** Каждое разрешение добавляется вместе с функцией, которой оно нужно, и проходит через белый список в `scripts/validate.mjs`.
4. **Слои не перепрыгивают друг через друга.** UI не вызывает `chrome.storage` напрямую, доменная логика не знает о `chrome.*`.

## Контексты выполнения

```
┌──────────────┐   runtime.sendMessage    ┌──────────────────────────┐
│    Popup     │ ───────────────────────▶ │  Service worker          │
│ src/popup    │ ◀─────────────────────── │  src/background          │
└──────────────┘   { ok, data | error }   │  router → handlers/*.js  │
┌──────────────┐                          │                          │
│  Side panel  │ ───────────────────────▶ │                          │
│ src/sidepanel│                          └────────────┬─────────────┘
└──────┬───────┘                                       │
       │ storage.onChanged                             │
       ▼                                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ shared/js/storage.js  →  chrome.storage.local  (sf.* keys)        │
└──────────────────────────────────────────────────────────────────┘
         (будущее) content script ── сообщения ──▶ service worker
```

| Слой | Папка | Ответственность |
|------|-------|-----------------|
| Фон | `src/background` | Единый координатор: роутинг сообщений, жизненный цикл, позже — управление записью и захват скриншотов. Состояние не хранится в переменных (MV3 SW засыпает), только в storage. |
| UI | `src/popup`, `src/sidepanel` | Отрисовка и пользовательский ввод. Читают данные через `storage.js` или сообщения. |
| Домен | `src/core` | Чистые функции и модели (`Guide`, `Step`). Тестируются в Node без браузера. |
| Общее | `src/shared/js` | `constants` (типы сообщений, ключи storage), `messaging` (запрос/ответ), `storage` (репозиторий + миграции), `i18n`, `logger`. |
| Стили | `src/shared/styles` | `tokens.css` — единственный источник цветов, типографики и отступов; `components.css` — переиспользуемые `.sf-*` компоненты. |

## Сообщения

Формат запроса: `{ type: MSG.X, payload }`. Ответ: `{ ok: true, data }` или `{ ok: false, error }`.

```js
// UI
const state = await sendMessage(MSG.APP_GET_STATE);

// background/handlers/app.js
export const appHandlers = {
  [MSG.APP_GET_STATE]: async () => ({ ... }),
};
```

## Как добавить новую функцию (пример: запись)

1. Добавить типы сообщений в `MSG` (`recording/start`, `recording/stop`, …) в `shared/js/constants.js`.
2. Создать `src/background/handlers/recording.js` с картой обработчиков и подключить её в `service-worker.js`:
   `createRouter({ ...appHandlers, ...recordingHandlers })`.
3. Доменную логику (сборка шага из события, формирование заголовка) положить в `src/core/`, покрыть тестами в `tests/`.
4. Если нужен content script — создать `src/content/` и внедрять его программно через `chrome.scripting.executeScript` только во время записи. Добавить `activeTab` и `scripting` в manifest и в белый список `validate.mjs`.
5. Тексты — в оба файла `_locales/*/messages.json`; в разметке использовать `data-i18n`.
6. UI-элементы собирать из `.sf-*` компонентов и токенов, новые компоненты — в `components.css`.

## Хранилище

- Ключи с префиксом `sf.` перечислены в `STORAGE_KEYS`.
- `sf.schemaVersion` + `initStorage()` в `storage.js` — точка для миграций при обновлении расширения.
- Скриншоты (большие бинарные данные) планируется хранить в IndexedDB, а в `Step.screenshotId` держать ссылку.

## Безопасность (MV3)

- CSP по умолчанию: нет inline-скриптов, `eval`, удалённого кода — проверяется `validate.mjs`.
- Пользовательские строки выводятся через `textContent`, не через `innerHTML`.
