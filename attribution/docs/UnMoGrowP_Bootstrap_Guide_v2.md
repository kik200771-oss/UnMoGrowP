# 🚀 UnMoGrowP — Bootstrap Guide v2
*Дата: 24 октября 2025 г.*

Полный инженерный каркас для проекта **UnMoGrowP**: CI/CD, безопасность, тесты, документация, OpenAPI-контракты и миграция на **Svelte 5**.  
Создан для внедрения прозрачного процесса разработки, код-ревью и стабильного деплоя.

---

## 📁 1. Структура PR-пакета
В комплект входят:

| Раздел | Назначение |
|--------|-------------|
| `.github/workflows/*` | CI/CD (lint, тесты, build, безопасность, CodeQL) |
| `.github/ISSUE_TEMPLATE/*` | Шаблоны задач и PR |
| `docs/` | Архитектура и ADR-решения |
| `openapi/` и `schemas/events/` | Контракты фронт ↔ бэк |
| `tests/unit`, `tests/e2e` | Тесты Vitest и Playwright |
| `src/lib/api`, `src/lib/stores` | Базовые заготовки для клиента и стора |
| `SECURITY.md`, `CONTRIBUTING.md` | Политики и правила |
| `.editorconfig`, `.gitignore` | Единообразие и чистота репозитория |

---

## ⚙️ 2. Основные Workflows

### CI (проверки кода)
```yaml
name: ci
on:
  pull_request:
  push:
    branches: [ feature/migrate-to-svelte ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci || npm i
      - run: npm run typecheck --if-present
      - run: npm run lint --if-present
      - run: npm test --if-present -- --run
      - run: npm run build --if-present
```

### Gitleaks — защита от утечек секретов
```yaml
name: gitleaks
on:
  pull_request:
  push:
    branches: [ feature/migrate-to-svelte ]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gitleaks/gitleaks-action@v2
```

### CodeQL — статический анализ JS / Go
```yaml
name: codeql
on:
  schedule: [{cron: '0 2 * * 1'}]
  workflow_dispatch:
jobs:
  analyze:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        language: [ 'javascript', 'go' ]
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with: { languages: ${{ matrix.language }} }
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
```

### Dependabot (авто-обновления)
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly" }
    open-pull-requests-limit: 5
```

---

## 🧱 3. Документация и ADR

```markdown
# Architecture Overview
- Frontend: Svelte 5
- Backend: Go APIs
- Contracts: OpenAPI 3.1 (HTTP) + JSON Schema (events)
```

```markdown
# ADR-0001 — Migrate Frontend to Svelte 5
Решение: внедрить runes-синтаксис `$state`, `$derived`, `$effect`; убрать смешанные компоненты Svelte 4/5.
```

---

## 🔗 4. Контракты API и события

```yaml
openapi: 3.1.0
info: { title: UnMoGrowP API, version: 0.2.0 }
paths:
  /health:
    get:
      operationId: health
      responses:
        '200': { description: OK }
  /events/ingest:
    post:
      operationId: ingestEvent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '../schemas/events/install.json'
      responses:
        '202': { description: Accepted }
```

```json
{
  "$id": "https://unmogrowp/schemas/event.install.json",
  "type": "object",
  "required": ["eventId","timestamp","deviceId","campaign"],
  "properties": {
    "eventId": {"type":"string","format":"uuid"},
    "timestamp": {"type":"string","format":"date-time"},
    "deviceId": {"type":"string"},
    "campaign": {"type":"string"},
    "source": {"type":"string","enum":["ad_network","organic","cross"]},
    "metadata": {"type":"object","additionalProperties":true}
  },
  "additionalProperties": false
}
```

---

## 🧪 5. Тестирование

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'jsdom', coverage: { reporter: ['text','lcov'] } }
});
```

```ts
// tests/unit/smoke.test.ts
import { describe, it, expect } from 'vitest';
describe('smoke', () => { it('works', () => expect(1+1).toBe(2)); });
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({ use: { baseURL: 'http://localhost:5173' } });
```

```ts
// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';
test('home opens', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/UnMoGrowP/i);
});
```

---

## 🧰 6. Исходные заготовки

```ts
// src/lib/api/client.ts
export async function api(path:string, init:RequestInit={}) {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const res = await fetch(base+path, {
    ...init, headers:{'content-type':'application/json',...(init.headers||{})}
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

```ts
// src/lib/stores/appState.ts
export function createAppState() {
  let state={ ready:false };
  function setReady(v:boolean){ state.ready=v; }
  return { state, setReady };
}
```

---

## 🔒 7. Безопасность и правила

```markdown
# Security Policy
- Сообщайте об уязвимостях через Issues (`security`) или почтой.
- Секреты не должны коммититься. Gitleaks проверяет каждое изменение.
```

```markdown
# Contributing
- Используйте шаблоны Issues/PR.
- Следуйте Conventional Commits.
- Перед пушем: `npm run typecheck && npm run lint && npm test`.
```

---

## 🪜 8. Как внедрить PR-пакет

```bash
git checkout -b chore/bootstrap-v2
git add .
git commit -m "chore: bootstrap CI/Security/Tests/OpenAPI/Schemas (v2)"
git push -u origin chore/bootstrap-v2
```

Создайте PR → `feature/migrate-to-svelte`, включите **Actions** и **Branch protection**.

---

## 🧭 9. Следующие шаги

1. Очистить репозиторий от секретов (`API_keys_console_anthropic`, `backup-claude-history.bat`).  
2. Создать Issues: *Svelte 5 migration*, *OpenAPI + Schemas*, *Testing*, *Perf optimization*.  
3. Настроить CI строгость (lint/test/build обязательны).  
4. Расширить OpenAPI/Schema, добавить версионирование `/v1`.  
5. Добавить бейджи статусов CI и покрытия в README.

---

## 📊 10. Состояние проекта

| Область | Состояние | Комментарий |
|----------|------------|-------------|
| Коммиты | ~75 | Активная разработка |
| CI/CD | ❌ Нет | Настроить по пакету |
| Issues/PR | ❌ Пусто | Ввести процесс |
| Документация | ⚠️ Частично | Добавить ADR и Architecture |
| Безопасность | ⚠️ Риски утечек | Включить Gitleaks |
| Контракты API | ❌ Нет | Добавить OpenAPI/Schema |
| Тесты | ❌ Нет | Vitest + Playwright |

---

## ✅ Резюме
Этот пакет превращает UnMoGrowP в инженерно зрелый проект — с CI/CD, безопасностью, тестами и контрактами.  
После внедрения появится прозрачный процесс разработки и единая инженерная среда.
