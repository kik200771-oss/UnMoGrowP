# Настройка аутентификации и reCAPTCHA

## 1. Настройка Google OAuth

### Создание проекта в Google Cloud Console

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Перейдите в раздел "API и сервисы" → "Учетные данные"
4. Нажмите "Создать учетные данные" → "Идентификатор клиента OAuth"
5. Выберите тип приложения: "Веб-приложение"
6. Настройте параметры:
   - **Название**: Attribution Platform
   - **Разрешенные источники JavaScript**: `http://localhost:3000`
   - **Разрешенные URI перенаправления**:
     - `http://localhost:3000/api/auth/callback/google`
     - (Для продакшена добавьте ваш домен)

7. Скопируйте полученные:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

## 2. Настройка Google reCAPTCHA v2

### Создание ключей reCAPTCHA

1. Перейдите на [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create)
2. Заполните форму:
   - **Ярлык**: Attribution Platform Login
   - **Тип reCAPTCHA**: reCAPTCHA v2 → "Я не робот (Checkbox)"
   - **Домены**:
     - `localhost`
     - (Для продакшена добавьте ваш домен)
3. Согласитесь с условиями использования
4. Нажмите "Отправить"

5. Скопируйте полученные ключи:
   - **Ключ сайта** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - **Секретный ключ** → `RECAPTCHA_SECRET_KEY`

## 3. Настройка переменных окружения

### Создание .env.local

Скопируйте `.env.example` в `.env.local`:

```bash
cp .env.example .env.local
```

### Заполнение значений

Откройте `.env.local` и замените placeholder значения:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=сгенерируйте-случайную-строку-32-символа

# Google OAuth (из шага 1)
GOOGLE_CLIENT_ID=ваш-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ваш-google-client-secret

# Google reCAPTCHA v2 (из шага 2)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ваш-recaptcha-site-key
RECAPTCHA_SECRET_KEY=ваш-recaptcha-secret-key
```

### Генерация NEXTAUTH_SECRET

Выполните команду для генерации секретного ключа:

```bash
openssl rand -base64 32
```

Или используйте онлайн генератор: https://generate-secret.vercel.app/32

## 4. Перезапуск сервера разработки

После настройки переменных окружения перезапустите сервер:

```bash
npm run dev
```

## 5. Проверка работы

1. Откройте http://localhost:3000/login
2. Проверьте, что reCAPTCHA отображается корректно
3. Нажмите на "Вход через аккаунт Google"
4. Должно открыться окно авторизации Google

## Для продакшена

При развертывании на продакшене:

1. Добавьте ваш домен в:
   - Google Cloud Console → OAuth 2.0 Client IDs → Authorized redirect URIs
   - Google reCAPTCHA Admin → Settings → Domains

2. Обновите переменную окружения:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   ```

3. Убедитесь, что все секретные ключи надежно сохранены и не попали в git репозиторий!
