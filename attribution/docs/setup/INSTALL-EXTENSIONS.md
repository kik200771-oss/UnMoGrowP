# 🔌 Установка расширений VS Code для Claude Code

## Быстрая установка (рекомендуется)

VS Code автоматически предложит установить рекомендуемые расширения при открытии проекта.

### Способ 1: Автоматически
1. Откройте проект в VS Code
2. Справа снизу появится уведомление: **"Do you want to install the recommended extensions?"**
3. Нажмите **"Install All"**

### Способ 2: Вручную через UI
1. Откройте VS Code
2. Нажмите `Ctrl+Shift+X` (Extensions)
3. В поисковой строке введите `@recommended`
4. Нажмите кнопку **"Install Workspace Recommended Extensions"** (облако со стрелкой)

### Способ 3: Через PowerShell скрипт
```powershell
# Скопируйте и выполните в PowerShell:

# Основные для разработки
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss

# TypeScript
code --install-extension pmneo.tsimporter

# Git
code --install-extension eamodio.gitlens
code --install-extension mhutchie.git-graph

# Docker & DevOps
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-kubernetes-tools.vscode-kubernetes-tools
code --install-extension redhat.vscode-yaml

# Базы данных
code --install-extension mtxr.sqltools
code --install-extension cweijan.vscode-redis-client

# Productivity
code --install-extension christian-kohler.path-intellisense
code --install-extension formulahendry.auto-rename-tag
code --install-extension usernamehw.errorlens
code --install-extension gruntfuggly.todo-tree

# API Testing
code --install-extension humao.rest-client
code --install-extension rangav.vscode-thunder-client

# Code Quality
code --install-extension sonarsource.sonarlint-vscode
code --install-extension aaron-bond.better-comments
code --install-extension streetsidesoftware.code-spell-checker

# Markdown
code --install-extension yzhang.markdown-all-in-one
code --install-extension bierner.markdown-mermaid

# Theme
code --install-extension pkief.material-icon-theme
code --install-extension zhuangtongfa.material-theme
```

---

## 📋 Список расширений (25 штук)

### ✅ Обязательные (4):
1. **ESLint** - линтинг JavaScript/TypeScript
2. **Prettier** - форматирование кода
3. **Tailwind CSS IntelliSense** - автодополнение Tailwind
4. **TypeScript Importer** - автоимпорт модулей

### 🔧 Git (2):
5. **GitLens** - Git history, blame, search
6. **Git Graph** - визуальная история git

### 🐳 Docker & DevOps (3):
7. **Docker** - управление контейнерами
8. **Kubernetes** - управление кластерами
9. **YAML** - синтаксис YAML

### 🗄️ Базы данных (2):
10. **SQLTools** - PostgreSQL, ClickHouse клиент
11. **Redis Client** - Redis GUI

### 🚀 Productivity (4):
12. **Path Intellisense** - автодополнение путей
13. **Auto Rename Tag** - переименование тегов
14. **Error Lens** - подсветка ошибок
15. **Todo Tree** - поиск TODO/FIXME

### 🌐 API Testing (2):
16. **REST Client** - HTTP запросы в .http файлах
17. **Thunder Client** - легковесный API клиент

### ✨ Code Quality (3):
18. **SonarLint** - качество кода
19. **Better Comments** - цветные комментарии
20. **Code Spell Checker** - проверка орфографии

### 📝 Markdown (2):
21. **Markdown All in One** - редактирование markdown
22. **Markdown Mermaid** - диаграммы Mermaid

### 🎨 Theme (2):
23. **Material Icon Theme** - иконки файлов
24. **One Dark Pro** - темная тема

---

## ⚙️ Настройки VS Code

После установки расширений, настройки уже сконфигурированы в `.vscode/settings.json`:

✅ Автосохранение через 1 секунду
✅ Форматирование при сохранении (Prettier)
✅ ESLint auto-fix при сохранении
✅ Tailwind CSS автодополнение
✅ TypeScript настройки
✅ Git auto-fetch
✅ Error Lens включен
✅ Todo Tree настроен

---

## 🔍 Проверка установки

### PowerShell команда для проверки:
```powershell
code --list-extensions | findstr -i "eslint prettier tailwind gitlens docker"
```

### Ожидаемый результат:
```
dbaeumer.vscode-eslint
esbenp.prettier-vscode
bradlc.vscode-tailwindcss
eamodio.gitlens
ms-azuretools.vscode-docker
```

---

## 🚨 Если расширения не работают

### 1. Перезагрузите VS Code
```
Ctrl+Shift+P → "Developer: Reload Window"
```

### 2. Проверьте версию VS Code
```powershell
code --version
```
Должна быть версия >= 1.80

### 3. Проверьте установку Node.js
```powershell
node --version
npm --version
```

### 4. Переустановите проблемное расширение
```
Ctrl+Shift+X → Найти расширение → Uninstall → Install
```

---

## 🎯 Claude Code специфичные настройки

Для полноценной работы **Claude Code** убедитесь что:

1. ✅ У вас установлено расширение Claude Code
2. ✅ Вы авторизованы в Claude Code
3. ✅ Проект открыт как workspace (не отдельный файл)

### Проверка Claude Code:
```
Ctrl+Shift+P → "Claude Code: Sign In"
```

---

## 📦 Дополнительные опциональные расширения

Если работаете с Python/ML:
```powershell
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension ms-toolsai.jupyter
```

Если работаете с Go:
```powershell
code --install-extension golang.go
code --install-extension premparihar.gotestexplorer
```

---

## ✅ Готово!

После установки всех расширений:
1. Перезагрузите VS Code
2. Откройте проект
3. Начинайте работать с полной поддержкой Claude Code!

**Все расширения будут работать автоматически с настройками из `.vscode/settings.json`**
