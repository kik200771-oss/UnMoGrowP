# 🌍 Настройка ngrok для публичного доступа

## Что такое ngrok?

ngrok создаёт безопасный туннель из интернета к вашему локальному серверу.

**Результат:** Вы получаете публичный URL (например `https://abc123.ngrok.io`), который можно отправить кому угодно в мире!

---

## 📦 Установка ngrok

### Вариант 1: Автоматическая установка (PowerShell от администратора)

```powershell
cd C:\КОДИНГ\attribution
.\install-ngrok.ps1
```

### Вариант 2: Ручная установка

1. **Скачайте ngrok:**
   - Перейдите: https://ngrok.com/download
   - Скачайте Windows (64-bit)

2. **Распакуйте:**
   - Создайте папку `C:\ngrok`
   - Распакуйте `ngrok.exe` в эту папку

3. **Добавьте в PATH:**
   ```powershell
   # PowerShell от администратора
   $env:Path += ";C:\ngrok"
   [Environment]::SetEnvironmentVariable("Path", $env:Path, "Machine")
   ```

4. **Проверьте:**
   ```powershell
   ngrok version
   ```

---

## 🔑 Настройка аккаунта (Один раз)

### 1. Создайте бесплатный аккаунт:

Перейдите: **https://dashboard.ngrok.com/signup**

- Можно через Google/GitHub
- Полностью бесплатно для базового использования

### 2. Получите authtoken:

После регистрации перейдите: **https://dashboard.ngrok.com/get-started/your-authtoken**

Скопируйте ваш токен (выглядит как: `2abc...xyz`)

### 3. Настройте токен:

```powershell
ngrok config add-authtoken ВАШ_ТОКЕН_ЗДЕСЬ
```

Пример:
```powershell
ngrok config add-authtoken 2abc123def456ghi789jkl
```

**Это нужно сделать только ОДИН РАЗ!**

---

## 🚀 Запуск туннеля

### Простой запуск:

```powershell
ngrok http 3000
```

### Запуск с кастомным поддоменом (платный план):

```powershell
ngrok http 3000 --subdomain=unmogrowp
# Получите: https://unmogrowp.ngrok.io
```

---

## 📊 Что вы увидите:

После запуска `ngrok http 3000`:

```
ngrok

Session Status                online
Account                       your@email.com
Version                       3.x.x
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### Ваш публичный URL:

**https://abc123.ngrok.io** ← Отправьте эту ссылку кому угодно!

---

## 🔍 Мониторинг запросов

ngrok предоставляет web интерфейс для мониторинга:

**Откройте:** http://127.0.0.1:4040

Вы увидите:
- Все HTTP запросы
- Параметры запросов
- Ответы сервера
- Время выполнения
- Возможность повторить запрос (Replay)

Это очень полезно для отладки!

---

## ⚡ Быстрый старт (всё вместе)

```powershell
# 1. Убедитесь что Next.js запущен
npm run dev

# 2. В НОВОМ терминале запустите ngrok
ngrok http 3000

# 3. Скопируйте URL (например https://abc123.ngrok.io)

# 4. Отправьте этот URL другому человеку

# 5. Они смогут открыть ваш сайт из любой точки мира!
```

---

## 🎯 Использование

### Для разработки:

```powershell
# Terminal 1: Next.js
npm run dev

# Terminal 2: ngrok
ngrok http 3000
```

### Для показа клиенту:

1. Запустите туннель: `ngrok http 3000`
2. Скопируйте URL: `https://abc123.ngrok.io`
3. Отправьте клиенту в Slack/Email/Telegram
4. Клиент открывает ссылку и видит ваш сайт в реальном времени!

---

## 💰 Бесплатный vs Платный план

### Бесплатный план (достаточно для разработки):

✅ Неограниченные туннели
✅ HTTPS автоматически
✅ Web интерфейс для мониторинга
❌ URL меняется при перезапуске
❌ Нет кастомных поддоменов
❌ Сессия истекает через 2 часа (нужно перезапустить)

### Платный план ($8/месяц):

✅ Всё из бесплатного
✅ Постоянный поддомен (например `unmogrowp.ngrok.io`)
✅ Кастомный домен (например `dev.yourdomain.com`)
✅ IP whitelisting
✅ Нет ограничения времени сессии

---

## 🔒 Безопасность

### ngrok безопасен:

- ✅ Все соединения через HTTPS (шифрование)
- ✅ Только вы знаете URL (пока не поделитесь)
- ✅ Можно добавить базовую аутентификацию:
  ```powershell
  ngrok http 3000 --auth="user:password"
  ```

### Рекомендации:

- ❗ Не показывайте URL публично
- ❗ Не коммитьте URL в git
- ❗ Остановите туннель когда не используете (Ctrl+C)
- ❗ В production используйте реальный хостинг (не ngrok)

---

## 🛠️ Полезные команды

```powershell
# Проверить версию
ngrok version

# Запустить туннель на порт 3000
ngrok http 3000

# С базовой аутентификацией
ngrok http 3000 --auth="username:password"

# На определённый домен/IP
ngrok http unmogrowp.local:3000

# С региональным сервером
ngrok http 3000 --region=eu

# Посмотреть конфигурацию
ngrok config check

# Посмотреть путь к конфигу
ngrok config edit
```

---

## 🎓 Примеры использования

### 1. Показать сайт клиенту:

```powershell
# Вы:
ngrok http 3000
# Получили: https://abc123.ngrok.io

# Отправили клиенту в Slack:
"Привет! Посмотри новый дизайн: https://abc123.ngrok.io"

# Клиент открывает и видит ваш сайт в реальном времени!
```

### 2. Тестирование на мобильных:

```powershell
# Запустили ngrok
ngrok http 3000

# Открыли ссылку на iPhone/Android
# Тестируете адаптивность в реальных условиях
```

### 3. Webhook тестирование:

```powershell
# Для приёма вебхуков от внешних сервисов:
ngrok http 3000

# Stripe, Telegram Bot, и другие сервисы смогут
# отправлять вебхуки на ваш локальный сервер
```

---

## 📚 Альтернативы ngrok

Если ngrok по какой-то причине не подходит:

- **localtunnel** - бесплатный open-source
  ```powershell
  npm install -g localtunnel
  lt --port 3000
  ```

- **Cloudflare Tunnel** - от Cloudflare
  ```powershell
  cloudflared tunnel --url http://localhost:3000
  ```

- **Tailscale** - VPN для команды

---

## ❓ Troubleshooting

### ngrok не запускается:

```powershell
# Проверьте установку
ngrok version

# Проверьте что порт свободен
netstat -ano | findstr :3000

# Проверьте authtoken
ngrok config check
```

### Туннель не работает:

1. Убедитесь что Next.js запущен (`npm run dev`)
2. Проверьте что порт правильный (3000)
3. Попробуйте перезапустить ngrok

### "Session expired":

Бесплатный план ограничивает сессии 2 часами. Просто:
```powershell
# Остановите (Ctrl+C)
# Запустите снова
ngrok http 3000
```

---

## 🎊 Готово!

После установки и настройки:

1. **Terminal 1:**
   ```powershell
   npm run dev
   ```

2. **Terminal 2:**
   ```powershell
   ngrok http 3000
   ```

3. **Получите URL:** `https://abc123.ngrok.io`

4. **Поделитесь с кем угодно!** 🌍

---

**Следующий шаг:** Запустите `.\install-ngrok.ps1` для установки!
