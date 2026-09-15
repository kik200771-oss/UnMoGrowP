/**
 * Тест Product Manager Agent
 *
 * Проверяет:
 * - Определение места для файлов
 * - Проверку допустимости файлов в корне
 * - Генерацию отчета о структуре
 */

const { productManager } = require('../lib/agents/product-manager/agent');

console.log('🧪 Тестирование Product Manager Agent\n');
console.log('=' .repeat(60));

// Тест 1: Определение места для файлов
console.log('\n📁 Тест 1: Куда поместить файлы?\n');

const testFiles = [
  'SETUP_NEW.md',
  'install-python.ps1',
  'WORKFLOW_DESIGN.md',
  'docker-compose.dev.yml',
  'QUICK-START-2.md',
  'STATUS_REPORT.md',
  'UI-UX-GUIDE.md',
  'fix-permissions.ps1',
  'setup-database.ps1',
];

testFiles.forEach(file => {
  const location = productManager.suggestFileLocation(file);
  if (location) {
    console.log(`✅ ${file.padEnd(30)} → ${location}`);
  } else {
    console.log(`⚠️  ${file.padEnd(30)} → (правило не найдено)`);
  }
});

// Тест 2: Проверка файлов в корне
console.log('\n' + '='.repeat(60));
console.log('\n🔒 Тест 2: Разрешены ли файлы в корне?\n');

const rootFiles = [
  'README.md',
  'package.json',
  'next.config.ts',
  'components.json',
  'tsconfig.json',
  'SETUP.md',
  'install-docker.ps1',
  'docker-compose.yml',
  'MY_NOTES.md',
  'tailwind.config.ts',
];

rootFiles.forEach(file => {
  const allowed = productManager.isAllowedInRoot(file);
  if (allowed) {
    console.log(`✅ ${file.padEnd(30)} РАЗРЕШЕН в корне`);
  } else {
    console.log(`❌ ${file.padEnd(30)} ЗАПРЕЩЕН в корне`);
    const suggestion = productManager.suggestFileLocation(file);
    if (suggestion) {
      console.log(`   └─ Переместить в: ${suggestion}`);
    }
  }
});

// Тест 3: Получение структуры проекта
console.log('\n' + '='.repeat(60));
console.log('\n🏗️  Тест 3: Структура проекта\n');

const structure = productManager.getProjectStructure();
console.log(`Всего определено папок: ${structure.length}`);
console.log('\nАгенты:');
structure
  .filter(s => s.path.startsWith('lib/agents/') && s.owner)
  .forEach(s => {
    console.log(`  - ${s.path.padEnd(35)} (${s.owner})`);
  });

console.log('\nКатегории документации:');
structure
  .filter(s => s.path.startsWith('docs/'))
  .forEach(s => {
    console.log(`  - ${s.path}`);
  });

// Тест 4: Правила организации
console.log('\n' + '='.repeat(60));
console.log('\n📋 Тест 4: Правила организации файлов\n');

const rules = productManager.getOrganizationRules();
console.log(`Всего правил: ${rules.length}\n`);

rules.forEach((rule, index) => {
  console.log(`${index + 1}. ${rule.category.toUpperCase()}`);
  console.log(`   Pattern: ${rule.pattern}`);
  console.log(`   → ${rule.destination}\n`);
});

// Тест 5: Валидация структуры
console.log('=' .repeat(60));
console.log('\n✔️  Тест 5: Валидация структуры\n');

productManager.validateStructure().then(validation => {
  if (validation.valid) {
    console.log('✅ Структура проекта ВАЛИДНА');
  } else {
    console.log('❌ Найдены проблемы:');
    validation.issues.forEach(issue => console.log(`  - ${issue}`));
  }

  if (validation.suggestions.length > 0) {
    console.log('\n💡 Предложения по улучшению:');
    validation.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Все тесты завершены!\n');
});
