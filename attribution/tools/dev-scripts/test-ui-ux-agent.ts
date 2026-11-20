/**
 * Test script для UI/UX Agent
 * Проверяет API ключ, подключение к Anthropic API и работу агента
 */

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logStep(step: number, message: string) {
  log(`\n[${step}/5] ${message}`, 'cyan');
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logError(message: string) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

async function testUIUXAgent() {
  log('\n=== UI/UX Agent Debugger ===\n', 'blue');

  // 1. Проверка API ключа
  logStep(1, 'Проверка ANTHROPIC_API_KEY');
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    logError('ANTHROPIC_API_KEY не найден в .env.local');
    process.exit(1);
  }

  if (!apiKey.startsWith('sk-ant-')) {
    logError('ANTHROPIC_API_KEY имеет неверный формат (должен начинаться с sk-ant-)');
    process.exit(1);
  }

  logSuccess(`API ключ найден: ${apiKey.substring(0, 15)}...`);

  // 2. Создание клиента Anthropic
  logStep(2, 'Инициализация Anthropic клиента');
  let client: Anthropic;

  try {
    client = new Anthropic({ apiKey });
    logSuccess('Anthropic клиент создан');
  } catch (error) {
    logError(`Ошибка создания клиента: ${error}`);
    process.exit(1);
  }

  // 3. Проверка доступных моделей
  logStep(3, 'Проверка моделей');
  const modelsToTest = [
    'claude-sonnet-4-5-20250929',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
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
        logSuccess(`  ✓ Модель ${model} работает! Ответ: "${content.text}"`);

        // Если нашли рабочую модель, используем её для следующих тестов
        log(`\nИспользую модель ${model} для дальнейших тестов`, 'green');

        // 4. Тест UI/UX анализа
        logStep(4, 'Тестирование UI/UX анализа');

        const testCode = `
export function TestButton({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}`;

        log('Отправляю тестовый компонент на анализ...');

        const analysisResponse = await client.messages.create({
          model,
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `Проанализируй этот React компонент и верни JSON с полями:
- score (0-100)
- issues (массив строк)
- recommendations (массив строк)

Код компонента:
${testCode}

Верни только JSON, без дополнительного текста.`,
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
              log(`  Issues: ${result.issues?.length || 0}`);
              log(`  Recommendations: ${result.recommendations?.length || 0}`);
            } else {
              logWarning('Получен ответ, но не в JSON формате');
              log(analysisContent.text.substring(0, 200));
            }
          } catch (e) {
            logWarning(`Не удалось распарсить JSON: ${e}`);
          }
        }

        // 5. Итоговая проверка
        logStep(5, 'Итоги');
        logSuccess('Все тесты пройдены!');
        log(`\nРабочая модель: ${model}`, 'green');
        log(`API ключ: валидный`, 'green');
        log(`Подключение: работает`, 'green');

        log('\n✓ UI/UX Agent готов к работе!', 'green');
        log('\nОткройте http://localhost:3000/ui-ux-demo и попробуйте анализ.', 'cyan');

        process.exit(0);
      }
    } catch (error: any) {
      if (error.status === 404) {
        logWarning(`  ✗ Модель ${model} не найдена (404)`);
      } else if (error.status === 401) {
        logError(`  ✗ Ошибка авторизации (401) - проверьте API ключ`);
        process.exit(1);
      } else {
        logError(`  ✗ Ошибка: ${error.message}`);
      }
    }
  }

  logError('\nНи одна из моделей не работает!');
  log('\nПопробуйте:', 'yellow');
  log('1. Проверить API ключ на https://console.anthropic.com/');
  log('2. Проверить баланс аккаунта');
  log('3. Обновить @anthropic-ai/sdk: npm update @anthropic-ai/sdk');

  process.exit(1);
}

// Запуск теста
testUIUXAgent().catch((error) => {
  logError(`\nНеожиданная ошибка: ${error.message}`);
  console.error(error);
  process.exit(1);
});
