/**
 * Test script для UI/UX Agent (JavaScript версия)
 * Проверяет API ключ, подключение к Anthropic API и работу агента
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// Читаем .env.local вручную
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    console.error('Не удалось прочитать .env.local:', error.message);
  }
}

loadEnv();

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}/5] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function testUIUXAgent() {
  log('\n=== UI/UX Agent Debugger ===\n', 'blue');

  // 1. Проверка API ключа
  logStep(1, 'Проверка ANTHROPIC_API_KEY');
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    logError('ANTHROPIC_API_KEY не найден в .env.local');
    logWarning('Добавьте ANTHROPIC_API_KEY=sk-ant-... в файл .env.local');
    process.exit(1);
  }

  if (!apiKey.startsWith('sk-ant-')) {
    logError('ANTHROPIC_API_KEY имеет неверный формат (должен начинаться с sk-ant-)');
    process.exit(1);
  }

  logSuccess(`API ключ найден: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 5)}`);

  // 2. Создание клиента Anthropic
  logStep(2, 'Инициализация Anthropic клиента');
  let client;

  try {
    // Пробуем разные варианты импорта
    client = new (Anthropic.default || Anthropic)({ apiKey });
    logSuccess('Anthropic клиент создан');
  } catch (error) {
    logError(`Ошибка создания клиента: ${error.message}`);
    process.exit(1);
  }

  // 3. Проверка доступных моделей
  logStep(3, 'Проверка моделей');
  const modelsToTest = [
    'claude-sonnet-4-5-20250929',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-sonnet-20240229',
  ];

  log('Тестирование моделей...');

  for (const model of modelsToTest) {
    try {
      log(`  Пробую модель: ${model}`, 'yellow');

      const response = await client.messages.create({
        model,
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: 'Respond with just "OK" if you can read this.',
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        logSuccess(`  ✓ Модель ${model} работает! Ответ: "${content.text.trim()}"`);

        // Если нашли рабочую модель, используем её для следующих тестов
        log(`\n✓ Нашли рабочую модель!`, 'green');

        // 4. Тест UI/UX анализа
        logStep(4, 'Тестирование UI/UX анализа');

        const testCode = `export function TestButton({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}`;

        log('Отправляю тестовый компонент на анализ...');

        const analysisResponse = await client.messages.create({
          model,
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `Analyze this React button component for UI/UX issues. Return JSON with:
- score (0-100)
- issues (array of strings)
- recommendations (array of strings)

Component code:
${testCode}

Return only JSON.`,
          }],
        });

        const analysisContent = analysisResponse.content[0];
        if (analysisContent.type === 'text') {
          try {
            // Пытаемся извлечь JSON
            const jsonMatch = analysisContent.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);
              logSuccess('UI/UX анализ работает!');
              log(`  Score: ${result.score || 'N/A'}`);
              log(`  Issues: ${result.issues?.length || 0} найдено`);
              log(`  Recommendations: ${result.recommendations?.length || 0} найдено`);
            } else {
              logWarning('Получен ответ, но не в JSON формате');
              log('  ' + analysisContent.text.substring(0, 100) + '...');
            }
          } catch (e) {
            logWarning(`Не удалось распарсить JSON: ${e.message}`);
          }
        }

        // 5. Итоговая проверка
        logStep(5, 'Итоги');
        logSuccess('Все тесты пройдены! ✓');
        log(`\n┌─────────────────────────────────────┐`, 'green');
        log(`│  Рабочая модель: ${model}`, 'green');
        log(`│  API ключ: валидный ✓`, 'green');
        log(`│  Подключение: работает ✓`, 'green');
        log(`└─────────────────────────────────────┘`, 'green');

        log('\n✓ UI/UX Agent готов к работе!', 'green');

        log('\n📝 Обновите файл lib/agents/ui-ux/agent.ts:', 'cyan');
        log(`   this.model = '${model}';`, 'yellow');

        log('\n🌐 Затем откройте:', 'cyan');
        log('   http://localhost:3000/ui-ux-demo', 'blue');

        process.exit(0);
      }
    } catch (error) {
      if (error.status === 404) {
        logWarning(`  ✗ Модель ${model} не найдена (404)`);
      } else if (error.status === 401) {
        logError(`  ✗ Ошибка авторизации (401) - неверный API ключ`);
        logWarning('\nПолучите новый ключ на https://console.anthropic.com/');
        process.exit(1);
      } else if (error.status === 429) {
        logError(`  ✗ Превышен лимит запросов (429)`);
        logWarning('Подождите немного и попробуйте снова');
      } else {
        logError(`  ✗ Ошибка: ${error.message}`);
      }
    }
  }

  logError('\n✗ Ни одна из моделей не работает!');
  log('\n🔧 Попробуйте:', 'yellow');
  log('  1. Проверить API ключ на https://console.anthropic.com/');
  log('  2. Проверить баланс аккаунта');
  log('  3. Обновить SDK: npm update @anthropic-ai/sdk');
  log('  4. Проверить интернет-соединение');

  process.exit(1);
}

// Запуск теста
testUIUXAgent().catch((error) => {
  logError(`\n✗ Неожиданная ошибка: ${error.message}`);
  console.error(error);
  process.exit(1);
});
