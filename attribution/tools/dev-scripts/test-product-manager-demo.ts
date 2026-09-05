/**
 * Демонстрация работы Product Manager Agent
 *
 * Запуск: npx tsx scripts/test-product-manager-demo.ts
 */

import { productManager } from '../lib/agents/product-manager/agent';

console.log('🧪 Тестирование Product Manager Agent\n');
console.log('='.repeat(60));

// Тест 1: Определение места для файлов
console.log('\n📁 Тест 1: Куда поместить файлы?\n');

const testFiles = [
  { file: 'SETUP_NEW.md', expected: 'docs/setup/' },
  { file: 'install-python.ps1', expected: 'scripts/setup/' },
  { file: 'WORKFLOW_DESIGN.md', expected: 'docs/workflows/' },
  { file: 'docker-compose.dev.yml', expected: 'config/' },
  { file: 'QUICK-START-2.md', expected: 'docs/guides/' },
  { file: 'STATUS_REPORT.md', expected: 'docs/status/' },
  { file: 'UI-UX-GUIDE.md', expected: 'lib/agents/ui-ux/docs/' },
  { file: 'fix-permissions.ps1', expected: 'scripts/setup/' },
];

let passed = 0;
let failed = 0;

testFiles.forEach(({ file, expected }) => {
  const location = productManager.suggestFileLocation(file);
  const status = location === expected ? '✅' : '❌';
  const result = location || '(не найдено)';

  if (location === expected) {
    passed++;
    console.log(`${status} ${file.padEnd(30)} → ${result}`);
  } else {
    failed++;
    console.log(`${status} ${file.padEnd(30)} → ${result} (ожидалось: ${expected})`);
  }
});

console.log(`\n✅ Пройдено: ${passed}/${testFiles.length}`);
if (failed > 0) {
  console.log(`❌ Провалено: ${failed}/${testFiles.length}`);
}

// Тест 2: Проверка файлов в корне
console.log('\n' + '='.repeat(60));
console.log('\n🔒 Тест 2: Разрешены ли файлы в корне?\n');

const rootFilesTest = [
  { file: 'README.md', shouldAllow: true },
  { file: 'package.json', shouldAllow: true },
  { file: 'next.config.ts', shouldAllow: true },
  { file: 'components.json', shouldAllow: true },
  { file: 'tsconfig.json', shouldAllow: true },
  { file: 'SETUP.md', shouldAllow: false },
  { file: 'install-docker.ps1', shouldAllow: false },
  { file: 'docker-compose.yml', shouldAllow: false },
  { file: 'MY_NOTES.md', shouldAllow: false },
  { file: 'tailwind.config.ts', shouldAllow: true },
];

let rootPassed = 0;
let rootFailed = 0;

rootFilesTest.forEach(({ file, shouldAllow }) => {
  const allowed = productManager.isAllowedInRoot(file);
  const correct = allowed === shouldAllow;
  const status = correct ? '✅' : '❌';

  if (correct) {
    rootPassed++;
  } else {
    rootFailed++;
  }

  if (allowed) {
    console.log(`${status} ${file.padEnd(30)} РАЗРЕШЕН в корне ${!shouldAllow ? '(ОШИБКА!)' : ''}`);
  } else {
    console.log(`${status} ${file.padEnd(30)} ЗАПРЕЩЕН в корне ${shouldAllow ? '(ОШИБКА!)' : ''}`);
    const suggestion = productManager.suggestFileLocation(file);
    if (suggestion) {
      console.log(`   └─ Переместить в: ${suggestion}`);
    }
  }
});

console.log(`\n✅ Пройдено: ${rootPassed}/${rootFilesTest.length}`);
if (rootFailed > 0) {
  console.log(`❌ Провалено: ${rootFailed}/${rootFilesTest.length}`);
}

// Тест 3: Получение структуры проекта
console.log('\n' + '='.repeat(60));
console.log('\n🏗️  Тест 3: Структура проекта\n');

const structure = productManager.getProjectStructure();
console.log(`Всего определено папок: ${structure.length}`);

console.log('\n📦 Агенты:');
structure
  .filter(s => s.path.startsWith('lib/agents/') && s.owner)
  .forEach(s => {
    console.log(`  ✓ ${s.path.padEnd(40)} → ${s.owner}`);
  });

console.log('\n📚 Категории документации:');
structure
  .filter(s => s.path.startsWith('docs/') && s.type === 'directory')
  .forEach(s => {
    console.log(`  ✓ ${s.path.padEnd(25)} - ${s.purpose}`);
  });

console.log('\n⚙️  Скрипты и конфиги:');
structure
  .filter(s => (s.path.startsWith('scripts/') || s.path.startsWith('config/')) && s.type === 'directory')
  .forEach(s => {
    console.log(`  ✓ ${s.path.padEnd(25)} - ${s.purpose}`);
  });

// Тест 4: Правила организации
console.log('\n' + '='.repeat(60));
console.log('\n📋 Тест 4: Правила организации файлов\n');

const rules = productManager.getOrganizationRules();
console.log(`Всего правил: ${rules.length}\n`);

rules.forEach((rule, index) => {
  console.log(`${(index + 1).toString().padStart(2)}. ${rule.category.toUpperCase()}`);
  console.log(`    Pattern: ${rule.pattern}`);
  console.log(`    → ${rule.destination}\n`);
});

// Тест 5: Валидация структуры
console.log('='.repeat(60));
console.log('\n✔️  Тест 5: Валидация структуры\n');

(async () => {
  const validation = await productManager.validateStructure();

  if (validation.valid) {
    console.log('✅ Структура проекта ВАЛИДНА\n');
  } else {
    console.log('❌ Найдены проблемы:\n');
    validation.issues.forEach(issue => console.log(`  - ${issue}`));
    console.log();
  }

  if (validation.suggestions.length > 0) {
    console.log('💡 Предложения по улучшению:\n');
    validation.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
    console.log();
  }

  // Тест 6: Claude Command Agents
  console.log('='.repeat(60));
  console.log('\n🤖 Тест 6: Claude Code AI Agents\n');

  const agents = productManager.getClaudeCommandAgents();
  console.log(`Всего AI агентов в .claude/commands: ${agents.length}`);
  console.log('Общий размер промптов: 237 KB\n');

  agents.forEach(agent => {
    const stackInfo = agent.expectedStack ? ` [${agent.expectedStack.join(', ')}]` : '';
    console.log(`  ✓ ${agent.name.padEnd(20)} (${agent.size}) - ${agent.purpose}${stackInfo}`);
  });

  console.log();

  // Тест 7: Stack Status
  console.log('='.repeat(60));
  console.log('\n⚠️  Тест 7: Статус технологического стека\n');

  const stackStatus = productManager.getStackStatus();
  const hasMismatches = productManager.hasStackMismatches();
  const criticalIssues = productManager.getCriticalStackIssues();

  console.log(`Несоответствия найдены: ${hasMismatches ? '⚠️  ДА' : '✅ НЕТ'}`);
  console.log(`Критических проблем: ${criticalIssues.length}\n`);

  stackStatus.forEach(item => {
    const icon = item.status === 'match' ? '✅' : item.status === 'mismatch' ? '⚠️' : '❌';
    console.log(`${icon} ${item.component}`);
    console.log(`   Планировалось: ${item.planned}`);
    console.log(`   Текущее: ${item.current}`);
    if (item.impact) {
      console.log(`   Влияние: ${item.impact}`);
    }
    console.log();
  });

  // Тест 8: Migration Recommendations
  console.log('='.repeat(60));
  console.log('\n🚀 Тест 8: Рекомендации по миграции\n');

  const recommendations = productManager.getMigrationRecommendations();
  console.log(`Рекомендуемый вариант: ${recommendations.recommended}\n`);

  recommendations.options.forEach(option => {
    console.log(`${option.variant === recommendations.recommended ? '🌟' : '  '} Вариант ${option.variant}: ${option.title}`);
    console.log(`   Срок: ${option.timeline}`);
    console.log(`   Плюсы:`);
    option.pros.forEach(pro => console.log(`     + ${pro}`));
    console.log(`   Минусы:`);
    option.cons.forEach(con => console.log(`     - ${con}`));
    console.log();
  });

  // Итоговая статистика
  console.log('='.repeat(60));
  console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА\n');

  const totalTests = testFiles.length + rootFilesTest.length;
  const totalPassed = passed + rootPassed;
  const totalFailed = failed + rootFailed;
  const successRate = ((totalPassed / totalTests) * 100).toFixed(1);

  console.log(`Всего тестов: ${totalTests}`);
  console.log(`✅ Успешно: ${totalPassed} (${successRate}%)`);
  console.log(`❌ Провалено: ${totalFailed}`);
  console.log();

  if (totalFailed === 0) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Product Manager работает корректно!\n');
  } else {
    console.log('⚠️  Есть провалившиеся тесты. Требуется доработка.\n');
  }

  console.log('='.repeat(60));
  console.log('\n💡 Дополнительная информация\n');
  console.log(`Product Manager теперь знает о:`);
  console.log(`  ✓ 11 AI агентах в .claude/commands (237 KB промптов)`);
  console.log(`  ✓ Оригинальной концепции из DOCUMENTS/ (350+ страниц)`);
  console.log(`  ✓ Несоответствии стека: Svelte 5 → Next.js`);
  console.log(`  ✓ Отсутствующих компонентах: Go backend, Bun API, ML pipeline`);
  console.log(`  ✓ 3 вариантах миграции с рекомендациями\n`);

  console.log('='.repeat(60));
})();
