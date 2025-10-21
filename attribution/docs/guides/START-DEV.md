# 🚀 Запуск UnMoGrowP Development Environment

## Быстрый старт

### 1️⃣ Настроить локальный домен (один раз)

**Вариант A: Автоматически**
```powershell
# Запустить PowerShell от имени администратора
cd C:\КОДИНГ\attribution
.\setup-local-domain.ps1
```

**Вариант B: Вручную**
1. Откройте Notepad **от имени администратора**
2. Откройте: `C:\Windows\System32\drivers\etc\hosts`
3. Добавьте в конец:
```
# UnMoGrowP Local Development Domains
127.0.0.1    unmogrowp.local
127.0.0.1    api.unmogrowp.local
127.0.0.1    kafka.unmogrowp.local
```
4. Сохраните и выполните: `ipconfig /flushdns`

### 2️⃣ Запустить Docker сервисы

```powershell
# Убедитесь что Docker Desktop запущен
docker-compose up -d

# Проверьте статус
docker-compose ps
```

Ожидаемый результат - все сервисы должны быть **healthy**:
- ✅ ClickHouse (8123, 9000)
- ✅ PostgreSQL (5432)
- ✅ Redis (6379)
- ✅ Kafka (9092-9093)
- ✅ Zookeeper (2181)
- ✅ Kafka UI (8080)

### 3️⃣ Запустить Next.js фронтенд

```powershell
npm run dev
```

## 🌐 Доступные URL

После запуска откройте в браузере:

| Сервис | URL | Описание |
|--------|-----|----------|
| **Frontend** | http://unmogrowp.local:3000 | Next.js приложение |
| **Kafka UI** | http://kafka.unmogrowp.local:8080 | Управление Kafka |
| **ClickHouse** | http://localhost:8123 | HTTP API |
| **PostgreSQL** | localhost:5432 | База данных |
| **Redis** | localhost:6379 | Кэш |

## 📝 Полезные команды

### Docker

```powershell
# Посмотреть логи всех сервисов
docker-compose logs -f

# Посмотреть логи конкретного сервиса
docker-compose logs -f clickhouse
docker-compose logs -f postgres

# Перезапустить сервис
docker-compose restart clickhouse

# Остановить все
docker-compose down

# Остановить и удалить данные (осторожно!)
docker-compose down -v
```

### Next.js

```powershell
# Запуск с кастомным доменом
npm run dev

# Запуск с localhost (если есть проблемы с доменом)
npm run dev:localhost

# Сборка продакшн версии
npm run build

# Запуск продакшн версии
npm run start

# Линтинг кода
npm run lint
```

### Проверка сервисов

```powershell
# ClickHouse
curl http://localhost:8123/?query=SELECT%201

# PostgreSQL
docker-compose exec postgres psql -U unmogrowp -c "SELECT 1"

# Redis
docker-compose exec redis redis-cli -a dev_password_123 ping

# Kafka topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

## 🔧 Troubleshooting

### Домен не открывается

1. **Проверьте hosts файл:**
   ```powershell
   notepad C:\Windows\System32\drivers\etc\hosts
   ```
   Должны быть строки с `unmogrowp.local`

2. **Очистите DNS кэш:**
   ```powershell
   ipconfig /flushdns
   ```

3. **Проверьте ping:**
   ```powershell
   ping unmogrowp.local
   ```
   Должен отвечать `127.0.0.1`

4. **Перезапустите браузер**

### Next.js не запускается

1. **Проверьте что порт 3000 свободен:**
   ```powershell
   netstat -ano | findstr :3000
   ```

2. **Переустановите зависимости:**
   ```powershell
   rm -rf node_modules
   npm install
   ```

3. **Запустите с localhost:**
   ```powershell
   npm run dev:localhost
   ```

### Docker сервисы не запускаются

1. **Проверьте что Docker Desktop запущен:**
   - Посмотрите иконку в трее
   - Она должна быть зелёной и не крутиться

2. **Проверьте логи:**
   ```powershell
   docker-compose logs clickhouse
   docker-compose logs postgres
   ```

3. **Перезапустите Docker Desktop**

4. **Пересоздайте контейнеры:**
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

## 📁 Структура проекта

```
C:\КОДИНГ\attribution\
├── app/                    # Next.js приложение (App Router)
├── clickhouse-config/      # Конфигурация ClickHouse
├── public/                 # Статические файлы
├── .env.local             # Переменные окружения (не коммитить!)
├── docker-compose.yml     # Docker сервисы
├── package.json           # Зависимости Node.js
├── next.config.ts         # Конфигурация Next.js
├── tsconfig.json          # Конфигурация TypeScript
└── tailwind.config.ts     # Конфигурация Tailwind CSS
```

## 🎯 Следующие шаги

После успешного запуска:

1. ✅ Все сервисы запущены
2. ✅ Домен настроен
3. ✅ Next.js работает
4. ⏭️ Создать схемы баз данных
5. ⏭️ Разработать Go backend
6. ⏭️ Создать UI компоненты
7. ⏭️ Реализовать attribution engine

## 📚 Дополнительная документация

- [STATUS.md](STATUS.md) - Текущий статус проекта
- [SETUP.md](SETUP.md) - Полная инструкция по установке
- [SETUP-DOMAIN.md](SETUP-DOMAIN.md) - Детали настройки домена
- [DEV-ENVIRONMENT.md](DEV-ENVIRONMENT.md) - Описание dev окружения

---

**Готово к разработке!** 🚀

Откройте http://unmogrowp.local:3000 и начинайте разработку!
