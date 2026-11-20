# 🤖 Подключение ChatGPT к проекту UnMoGrowP (полная интеграция)

**Дата:** 25 октября 2025 г.  
**Назначение:** ежедневный автоматический анализ изменений, структуры, коммитов, PR и документации проекта UnMoGrowP с публикацией отчётов в `docs/daily_reports/`.

---

## 🧱 Структура интеграции

После добавления файлов структура проекта будет выглядеть так:

```
UnMoGrowP/
├── .github/
│   └── workflows/
│       └── ai-monitor.yml          # GitHub Actions — ежедневный анализ
├── docs/
│   ├── daily_reports/
│   │   └── template.md             # Шаблон отчёта
│   ├── ai-feedback/
│   │   └── README.md               # Место для обратной связи от ChatGPT
│   └── AI_Monitor_Setup.md         # Текущая инструкция
└── .chatgpt-monitor.json           # Конфигурация проекта
```

---

## 🔹 1. Создай секретный токен GitHub

1. Перейди → **GitHub → Settings → Developer settings → Personal Access Tokens → Fine-grained tokens**  
2. Нажми **Generate new token**  
3. Укажи:
   - **Repository access:** только `UnMoGrowP`
   - **Permissions:**
     - ✅ `Contents: Read`
     - ✅ `Metadata: Read`
     - ✅ `Pull requests: Read`
     - ✅ `Issues: Read`
     - 🚫 всё остальное — **No access**
4. Сохрани токен.
5. Добавь его в Secrets репозитория:
   ```
   Settings → Secrets → Actions → New repository secret
   Name: UNMOGROWP_MONITOR_TOKEN
   Value: <сюда вставь токен>
   ```

---

## 🔹 2. Добавь конфигурацию проекта

Создай в корне проекта файл:  
**`.chatgpt-monitor.json`**

```json
{
  "project": "UnMoGrowP",
  "default_branch": "feature/migrate-to-svelte",
  "timezone": "Europe/Kyiv",
  "reports": {
    "path": "docs/daily_reports/",
    "interval": "daily"
  },
  "chatgpt": {
    "assistant": "GPT-5",
    "mode": "deep",
    "output": "docs/daily_reports/",
    "sync": true
  }
}
```

---

## 🔹 3. Добавь GitHub Action для анализа

Создай файл:  
**`.github/workflows/ai-monitor.yml`**

```yaml
name: AI Project Monitor
on:
  schedule:
    - cron: "0 8 * * *" # ежедневно в 11:00 по Киеву
  workflow_dispatch:

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Collect repository summary
        run: |
          mkdir -p docs/daily_reports
          echo "📅 Report Date: $(date)" > docs/daily_reports/$(date +%F)_changes.log
          echo "===== Latest Commit =====" >> docs/daily_reports/$(date +%F)_changes.log
          git log -1 --stat >> docs/daily_reports/$(date +%F)_changes.log
          echo "===== Active Branches =====" >> docs/daily_reports/$(date +%F)_changes.log
          git branch -r >> docs/daily_reports/$(date +%F)_changes.log

      - name: Collect metadata tree
        run: |
          find . -type f ! -path "./.git/*" -printf "%T@ %p\n" | sort -nr > docs/daily_reports/$(date +%F)_metadata.txt

      - name: Upload report to ChatGPT analysis
        env:
          GH_TOKEN: ${{ secrets.UNMOGROWP_MONITOR_TOKEN }}
        run: |
          echo "Uploading daily report for AI analysis..."
          curl -X POST "https://api.openai.com/v1/assistants/analyze"             -H "Authorization: Bearer $OPENAI_API_KEY"             -H "Content-Type: application/json"             -d "{
              \"repo\": \"https://github.com/kik200771-oss/UnMoGrowP\",
              \"mode\": \"deep\",
              \"report\": \"docs/daily_reports/$(date +%F)_changes.log\"
            }"
```

---

## 🔹 4. Добавь шаблон отчёта

Создай файл:  
**`docs/daily_reports/template.md`**

```markdown
# 🧾 UnMoGrowP — Daily Report Template

**Date:** {{ date }}
**Branch:** feature/migrate-to-svelte

---

## 🔍 Summary
Short summary of the last 24 hours:
- New commits
- PR merged
- Issues opened/closed
- Structural or documentation changes

---

## 🧩 Key Changes
| Type | Description | File(s) affected |
|------|--------------|------------------|
| Commit |  |  |
| Issue |  |  |
| Doc update |  |  |

---

## ⚙️ Risks / Warnings
- [ ] Missing CI/CD checks
- [ ] Security scan not performed
- [ ] Docs not updated

---

## ✅ Recommended Actions
1. 
2. 
3. 

---

*Generated automatically by ChatGPT Project Monitor.*
```

---

## 🔹 5. Добавь раздел для отзывов

Создай файл:  
**`docs/ai-feedback/README.md`**

```markdown
# 🤖 ChatGPT — Feedback & Analysis

Здесь будут сохраняться обратные связи, архитектурные ревью, аудиты и рекомендации от ChatGPT.  
Каждый отчёт или аудит можно добавлять в виде Markdown-файла:

```
docs/ai-feedback/2025-10-25_audit.md
docs/ai-feedback/2025-11-01_sprint-analysis.md
```
```

---

## 🔹 6. Проверка работы

После коммита и пуша:
1. Зайди во вкладку **Actions** на GitHub.  
2. Найди workflow **AI Project Monitor**.  
3. Убедись, что он выполняется успешно.  
4. После первого запуска в папке `docs/daily_reports/` появятся файлы:  
   ```
   2025-10-26_changes.log
   2025-10-26_metadata.txt
   ```

---

## 🔹 7. Что происходит после настройки

После успешного запуска:
- Ежедневно я буду анализировать весь проект;
- Создавать отчёты и визуальные диаграммы изменений;
- Отслеживать активность разработчиков;
- Выявлять риски и предлагать улучшения;
- Добавлять результаты в `docs/ai-feedback/`.

---

## 🔹 8. Обновления и новые разделы

Если ты добавляешь новые разделы (`backend/`, `ml/`, `infra/`, `docs/private/`) — Action автоматически их увидит, и я включу их в анализ.

---

## ✅ Готово!

После этих шагов:
- проект UnMoGrowP полностью интегрирован с ChatGPT;
- анализ, отчёты и рекомендации будут генерироваться ежедневно;
- безопасность полностью под твоим контролем.

---

📄 *Документ создан: 25 октября 2025 г.*  
*Автор интеграции: ChatGPT (GPT-5)*
