# Установка недостающих сервисов

## ✅ Уже установлено:
- Git v2.51.1
- Node.js v22.20.0
- Python v3.14.0
- Bun v1.3.0

## ⚠️ Требуется установить вручную:

### 1. Go (Backend)

**Вариант A: Через Chocolatey (требуется права администратора)**

1. Открой PowerShell **от имени администратора** (правой кнопкой → "Запустить от имени администратора")
2. Выполни:
```powershell
choco install golang -y
```
3. Проверь установку:
```powershell
go version
```

**Вариант B: Ручная установка**

1. Скачай установщик: https://go.dev/dl/
2. Выбери: `go1.25.3.windows-amd64.msi`
3. Запусти установщик
4. Перезапусти терминал
5. Проверь: `go version`

---

### 2. Docker Desktop (КРИТИЧНО ВАЖНО!)

**Вариант A: Через Chocolatey (требуется права администратора)**

1. Открой PowerShell **от имени администратора**
2. Выполни:
```powershell
choco install docker-desktop -y
```

**Вариант B: Ручная установка (РЕКОМЕНДУЕТСЯ)**

1. Скачай: https://www.docker.com/products/docker-desktop/
2. Нажми "Download for Windows"
3. Запусти `Docker Desktop Installer.exe`
4. Следуй инструкциям установщика
5. **ВАЖНО:** Выбери "Use WSL 2 instead of Hyper-V"
6. Перезагрузи компьютер
7. Запусти Docker Desktop из меню Пуск
8. Дождись полного запуска (иконка в трее перестанет крутиться)

**Проверка Docker:**
```powershell
docker --version
docker-compose --version
```

---

## После установки Go и Docker:

### Запуск локальных сервисов

1. Убедись что Docker Desktop запущен (проверь иконку в трее)

2. Перейди в папку проекта:
```powershell
cd C:\КОДИНГ\attribution
```

3. Запусти все сервисы:
```powershell
docker-compose up -d
```

4. Проверь статус:
```powershell
docker-compose ps
```

Ожидаемый вывод:
```
NAME                      STATUS    PORTS
unmogrowp-clickhouse      running   0.0.0.0:8123->8123/tcp, 0.0.0.0:9000->9000/tcp
unmogrowp-postgres        running   0.0.0.0:5432->5432/tcp
unmogrowp-redis           running   0.0.0.0:6379->6379/tcp
unmogrowp-kafka           running   0.0.0.0:9092->9092/tcp
unmogrowp-zookeeper       running   0.0.0.0:2181->2181/tcp
unmogrowp-kafka-ui        running   0.0.0.0:8080->8080/tcp
```

5. Открой Kafka UI: http://localhost:8080

---

## Тестирование подключения к сервисам

### ClickHouse
```powershell
curl http://localhost:8123/?query=SELECT%201
```
Ожидается: `1`

### PostgreSQL
```powershell
docker-compose exec postgres psql -U unmogrowp -c "SELECT 1"
```
Ожидается: `1`

### Redis
```powershell
docker-compose exec redis redis-cli -a dev_password_123 ping
```
Ожидается: `PONG`

### Kafka
```powershell
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

---

## Полезные команды Docker Compose

```powershell
# Остановить все сервисы
docker-compose down

# Перезапустить конкретный сервис
docker-compose restart postgres

# Посмотреть логи
docker-compose logs -f

# Посмотреть логи конкретного сервиса
docker-compose logs -f clickhouse

# Остановить и удалить все данные (осторожно!)
docker-compose down -v
```

---

## Troubleshooting

### Docker Desktop не запускается

1. Проверь включена ли виртуализация в BIOS:
```powershell
systeminfo | findstr /i "hyper"
```

2. Включи WSL2:
```powershell
wsl --install
wsl --set-default-version 2
```

3. Перезагрузи компьютер

### Порт уже занят

Если порт занят (например 5432 для PostgreSQL):

```powershell
# Найди процесс на порту
netstat -ano | findstr :5432

# Останови процесс (замени <PID> на номер процесса)
taskkill /PID <PID> /F
```

### ClickHouse не запускается

Проверь логи:
```powershell
docker-compose logs clickhouse
```

Возможно нужно увеличить память для Docker:
1. Docker Desktop → Settings → Resources
2. Memory: минимум 8 GB (рекомендуется 12 GB)
3. Apply & Restart

---

## Следующие шаги

После успешной установки всех сервисов:

1. ✅ VS Code extensions установлены (31 штука)
2. ✅ Runtime environments установлены (Node, Python, Bun)
3. ⏳ Установи Go и Docker (следуй инструкциям выше)
4. ⏳ Запусти `docker-compose up -d`
5. ⏳ Начинай разработку с AI агентами!

**Пример использования агента:**
```
/backend-go create health check endpoint that tests all services
```

Агент создаст код, который проверит подключение к ClickHouse, PostgreSQL, Redis и Kafka!

---

**Нужна помощь?** Открой `SETUP.md` для подробной документации.
