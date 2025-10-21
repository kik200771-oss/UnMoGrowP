/**
 * Product Manager Agent
 *
 * Ответственность:
 * - Контроль структуры проекта
 * - Организация файлов и документации
 * - Мониторинг соблюдения стандартов
 * - Координация работы других агентов
 * - Отслеживание соответствия технологического стека плану
 */

export interface ProjectStructure {
  path: string;
  type: 'directory' | 'file';
  purpose: string;
  owner?: string; // Какой агент отвечает за эту область
}

export interface FileOrganizationRule {
  pattern: string;
  destination: string;
  category: string;
}

export interface ClaudeCommandAgent {
  name: string;
  file: string;
  size: string;
  purpose: string;
  expectedStack?: string[];
}

export interface StackStatus {
  component: string;
  planned: string;
  current: string;
  status: 'match' | 'mismatch' | 'missing';
  impact?: string;
}

export class ProductManagerAgent {
  // 11 AI агентов в .claude/commands (237 KB промптов)
  private readonly claudeCommandAgents: ClaudeCommandAgent[] = [
    {
      name: 'orchestrator',
      file: 'orchestrator.md',
      size: '28 KB',
      purpose: 'Координация всех агентов и задач',
      expectedStack: ['Svelte 5', 'Go', 'Bun', 'Python'],
    },
    {
      name: 'pm',
      file: 'pm.md',
      size: '22 KB',
      purpose: 'Product Management и приоритизация',
      expectedStack: ['Svelte 5', 'Go', 'Bun'],
    },
    {
      name: 'frontend',
      file: 'frontend.md',
      size: '21 KB',
      purpose: 'Frontend разработка на Svelte 5 + SvelteKit',
      expectedStack: ['Svelte 5', 'SvelteKit', 'Vite', 'Apache ECharts'],
    },
    {
      name: 'backend-go',
      file: 'backend-go.md',
      size: '20 KB',
      purpose: 'Backend разработка на Go (event ingestion 10M req/sec)',
      expectedStack: ['Go 1.21+', 'Fiber', 'Chi', 'ClickHouse'],
    },
    {
      name: 'ml',
      file: 'ml.md',
      size: '14 KB',
      purpose: 'ML/AI пайплайны и модели',
      expectedStack: ['Python 3.11+', 'FastAPI', 'LightGBM', 'XGBoost'],
    },
    {
      name: 'ux',
      file: 'ux.md',
      size: '18 KB',
      purpose: 'UX дизайн и прототипирование',
      expectedStack: ['Svelte 5', 'Figma'],
    },
    {
      name: 'techlead',
      file: 'techlead.md',
      size: '25 KB',
      purpose: 'Технические решения и архитектура',
      expectedStack: ['Svelte 5', 'Go', 'Bun', 'Rust'],
    },
    {
      name: 'qa',
      file: 'qa.md',
      size: '16 KB',
      purpose: 'Тестирование и Quality Assurance',
      expectedStack: ['Playwright', 'Vitest', 'Go testing'],
    },
    {
      name: 'devops',
      file: 'devops.md',
      size: '19 KB',
      purpose: 'DevOps и инфраструктура',
      expectedStack: ['Docker', 'Kubernetes', 'Prometheus'],
    },
    {
      name: 'security',
      file: 'security.md',
      size: '17 KB',
      purpose: 'Безопасность и аудит',
      expectedStack: ['Go', 'OWASP'],
    },
    {
      name: 'docs',
      file: 'docs.md',
      size: '17 KB',
      purpose: 'Документация и technical writing',
      expectedStack: ['Markdown', 'Svelte MDsveX'],
    },
  ];

  // Статус соответствия технологического стека
  private readonly stackStatus: StackStatus[] = [
    {
      component: 'Frontend',
      planned: 'Svelte 5 + SvelteKit + Vite (40 KB bundle)',
      current: 'Next.js 15.5.6 + React 19.1.0 (140 KB bundle)',
      status: 'mismatch',
      impact: 'Производительность: 3-5x медленнее, bundle в 3.5x больше',
    },
    {
      component: 'Backend (Event Ingestion)',
      planned: 'Go 1.21+ + Fiber/Chi (10M req/sec)',
      current: 'Не создан',
      status: 'missing',
      impact: 'Критично: основная функциональность отсутствует',
    },
    {
      component: 'API Layer',
      planned: 'Bun + Hono (3x faster than Node.js)',
      current: 'Не создан',
      status: 'missing',
      impact: 'API производительность не оптимальна',
    },
    {
      component: 'Attribution Engine',
      planned: 'Rust (высокая производительность)',
      current: 'Не создан',
      status: 'missing',
      impact: 'Ключевая функциональность отсутствует',
    },
    {
      component: 'ML Pipeline',
      planned: 'Python 3.11+ + FastAPI + LightGBM + XGBoost',
      current: 'Не создан',
      status: 'missing',
      impact: 'ML/AI функционал отсутствует',
    },
    {
      component: 'Data Infrastructure',
      planned: 'ClickHouse + PostgreSQL + Redis + Kafka',
      current: 'ClickHouse + PostgreSQL + Redis + Kafka (100% готов)',
      status: 'match',
      impact: '✅ Полностью соответствует плану',
    },
  ];

  private readonly structure: ProjectStructure[] = [
    // Claude Code AI Agents (11 агентов)
    {
      path: '.claude/commands/',
      type: 'directory',
      purpose: '11 AI агентов для разработки (237 KB промптов, настроены на Svelte 5 + Go + Bun)',
      owner: 'claude-code',
    },

    // Original Project Documentation (350+ страниц)
    {
      path: 'DOCUMENTS/',
      type: 'directory',
      purpose: 'Оригинальная концепция UnMoGrowP - 350+ страниц документации (Svelte 5 + Go + Bun стек)',
      owner: 'product-manager-agent',
    },

    // Local Agents (lib/agents/)
    {
      path: 'lib/agents/ui-ux/',
      type: 'directory',
      purpose: 'UI/UX анализ компонентов',
      owner: 'ui-ux-agent',
    },
    {
      path: 'lib/agents/ui-ux/docs/',
      type: 'directory',
      purpose: 'Документация UI/UX агента',
      owner: 'ui-ux-agent',
    },
    {
      path: 'lib/agents/design-analyzer/',
      type: 'directory',
      purpose: 'Анализ дизайна и генерация спецификаций',
      owner: 'design-analyzer-agent',
    },
    {
      path: 'lib/agents/design-analyzer/docs/',
      type: 'directory',
      purpose: 'Документация Design Analyzer агента',
      owner: 'design-analyzer-agent',
    },
    {
      path: 'lib/agents/product-manager/',
      type: 'directory',
      purpose: 'Управление проектом и структурой',
      owner: 'product-manager-agent',
    },
    {
      path: 'lib/agents/product-manager/docs/',
      type: 'directory',
      purpose: 'Документация Product Manager агента',
      owner: 'product-manager-agent',
    },

    // Documentation structure
    {
      path: 'docs/setup/',
      type: 'directory',
      purpose: 'Документы по установке и настройке проекта',
    },
    {
      path: 'docs/workflows/',
      type: 'directory',
      purpose: 'Рабочие процессы и методологии',
    },
    {
      path: 'docs/architecture/',
      type: 'directory',
      purpose: 'Архитектура проекта и технические решения',
    },
    {
      path: 'docs/guides/',
      type: 'directory',
      purpose: 'Руководства для пользователей и разработчиков',
    },
    {
      path: 'docs/status/',
      type: 'directory',
      purpose: 'Статусы проекта и отчеты',
    },

    // Scripts
    {
      path: 'scripts/',
      type: 'directory',
      purpose: 'Скрипты и утилиты проекта',
    },
    {
      path: 'scripts/setup/',
      type: 'directory',
      purpose: 'PowerShell скрипты для установки и настройки окружения',
    },

    // Config
    {
      path: 'config/',
      type: 'directory',
      purpose: 'Конфигурационные файлы сервисов (Docker, etc)',
    },

    // Prototypes
    {
      path: 'prototypes/',
      type: 'directory',
      purpose: 'HTML прототипы компонентов',
    },

    // Team
    {
      path: 'team/',
      type: 'directory',
      purpose: 'Информация о команде агентов',
    },
  ];

  private readonly organizationRules: FileOrganizationRule[] = [
    // PowerShell scripts
    {
      pattern: /\.ps1$/i,
      destination: 'scripts/setup/',
      category: 'scripts',
    },
    // Docker and service configs
    {
      pattern: /^docker-compose.*\.yml$/i,
      destination: 'config/',
      category: 'service-config',
    },
    // Setup documents
    {
      pattern: /^(SETUP|INSTALL|DOMAIN|NGROK|DEV-ENVIRONMENT).*\.md$/i,
      destination: 'docs/setup/',
      category: 'setup',
    },
    // Workflow documents
    {
      pattern: /^(WORKFLOW|DESIGN_WORKFLOW|DOCUMENTATION).*\.md$/i,
      destination: 'docs/workflows/',
      category: 'workflows',
    },
    // Architecture documents
    {
      pattern: /^(ARCHITECTURE|TECH|STACK).*\.md$/i,
      destination: 'docs/architecture/',
      category: 'architecture',
    },
    // Guides
    {
      pattern: /^(QUICK-START|START|GUIDE).*\.md$/i,
      destination: 'docs/guides/',
      category: 'guides',
    },
    // Status documents
    {
      pattern: /^(STATUS|SUCCESS|PROGRESS|REPORT).*\.md$/i,
      destination: 'docs/status/',
      category: 'status',
    },
    // Agent-specific docs
    {
      pattern: /^UI-UX.*\.md$/i,
      destination: 'lib/agents/ui-ux/docs/',
      category: 'agent-specific',
    },
    {
      pattern: /^DESIGN-ANALYZER.*\.md$/i,
      destination: 'lib/agents/design-analyzer/docs/',
      category: 'agent-specific',
    },
    {
      pattern: /^PRODUCT-MANAGER.*\.md$/i,
      destination: 'lib/agents/product-manager/docs/',
      category: 'agent-specific',
    },
  ];

  /**
   * Получить структуру проекта
   */
  getProjectStructure(): ProjectStructure[] {
    return this.structure;
  }

  /**
   * Получить правила организации файлов
   */
  getOrganizationRules(): FileOrganizationRule[] {
    return this.organizationRules;
  }

  /**
   * Определить куда должен быть перемещен файл
   */
  suggestFileLocation(filename: string): string | null {
    for (const rule of this.organizationRules) {
      if (rule.pattern.test(filename)) {
        return rule.destination;
      }
    }
    return null;
  }

  /**
   * Проверка допустимости файла в корне проекта
   */
  isAllowedInRoot(filename: string): boolean {
    const allowedFiles = [
      // Documentation
      'README.md',
      'PROJECT_STRUCTURE.md',
      'LICENSE',
      'CHANGELOG.md',

      // Package management
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',

      // Configs that MUST be in root
      'components.json',       // Shadcn CLI
      'next.config.ts',        // Next.js
      'next.config.js',
      'next-env.d.ts',
      'tsconfig.json',         // TypeScript
      'jsconfig.json',
      'tailwind.config.ts',    // Tailwind
      'tailwind.config.js',
      'postcss.config.mjs',    // PostCSS
      'postcss.config.js',
      'eslint.config.mjs',     // ESLint
      'eslint.config.js',
      '.eslintrc.json',
      '.prettierrc',

      // Git
      '.gitignore',
      '.gitattributes',

      // Environment
      '.env',
      '.env.local',
      '.env.example',

      // Editor
      '.editorconfig',

      // CI/CD
      '.github',
      'vercel.json',
      'netlify.toml',
    ];

    return allowedFiles.includes(filename);
  }

  /**
   * Валидация структуры проекта
   */
  async validateStructure(): Promise<{
    valid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Здесь можно добавить логику проверки структуры
    // Например, проверить наличие обязательных папок

    return {
      valid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * Генерация отчета о структуре проекта
   */
  generateStructureReport(): string {
    let report = '# Структура проекта Attribution Platform\n\n';
    report += '## Агенты (lib/agents/)\n\n';

    const agentDirs = this.structure.filter(
      (s) => s.path.startsWith('lib/agents/') && s.type === 'directory'
    );

    for (const dir of agentDirs) {
      report += `### ${dir.path}\n`;
      report += `**Назначение:** ${dir.purpose}\n`;
      if (dir.owner) {
        report += `**Ответственный:** ${dir.owner}\n`;
      }
      report += '\n';
    }

    report += '## Документация (docs/)\n\n';

    const docDirs = this.structure.filter(
      (s) => s.path.startsWith('docs/') && s.type === 'directory'
    );

    for (const dir of docDirs) {
      report += `### ${dir.path}\n`;
      report += `**Назначение:** ${dir.purpose}\n\n`;
    }

    report += '## Скрипты (scripts/)\n\n';
    const scriptDirs = this.structure.filter(
      (s) => s.path.startsWith('scripts/') && s.type === 'directory'
    );
    for (const dir of scriptDirs) {
      report += `### ${dir.path}\n`;
      report += `**Назначение:** ${dir.purpose}\n\n`;
    }

    report += '## Конфигурация (config/)\n\n';
    const configDirs = this.structure.filter(
      (s) => s.path.startsWith('config/') && s.type === 'directory'
    );
    for (const dir of configDirs) {
      report += `### ${dir.path}\n`;
      report += `**Назначение:** ${dir.purpose}\n\n`;
    }

    report += '## Прототипы (prototypes/)\n\n';
    report += 'HTML прототипы компонентов перед конвертацией в React.\n\n';

    report += '## Правила организации файлов\n\n';

    for (const rule of this.organizationRules) {
      report += `- **${rule.category}:** ${rule.pattern} → ${rule.destination}\n`;
    }

    return report;
  }

  /**
   * Получить информацию о 11 AI агентах в .claude/commands
   */
  getClaudeCommandAgents(): ClaudeCommandAgent[] {
    return this.claudeCommandAgents;
  }

  /**
   * Получить статус соответствия технологического стека
   */
  getStackStatus(): StackStatus[] {
    return this.stackStatus;
  }

  /**
   * Проверить есть ли несоответствия в стеке
   */
  hasStackMismatches(): boolean {
    return this.stackStatus.some(
      (s) => s.status === 'mismatch' || s.status === 'missing'
    );
  }

  /**
   * Получить критические проблемы стека
   */
  getCriticalStackIssues(): StackStatus[] {
    return this.stackStatus.filter((s) => s.status !== 'match');
  }

  /**
   * Генерация отчета о статусе технологического стека
   */
  generateStackStatusReport(): string {
    let report = '# Статус технологического стека UnMoGrowP\n\n';

    const mismatches = this.stackStatus.filter((s) => s.status === 'mismatch');
    const missing = this.stackStatus.filter((s) => s.status === 'missing');
    const matches = this.stackStatus.filter((s) => s.status === 'match');

    report += `## Сводка\n\n`;
    report += `- ✅ Соответствует: ${matches.length}\n`;
    report += `- ⚠️ Несоответствие: ${mismatches.length}\n`;
    report += `- ❌ Отсутствует: ${missing.length}\n\n`;

    if (mismatches.length > 0) {
      report += `## ⚠️ Несоответствия\n\n`;
      for (const item of mismatches) {
        report += `### ${item.component}\n`;
        report += `**Планировалось:** ${item.planned}\n`;
        report += `**Текущее состояние:** ${item.current}\n`;
        if (item.impact) {
          report += `**Влияние:** ${item.impact}\n`;
        }
        report += '\n';
      }
    }

    if (missing.length > 0) {
      report += `## ❌ Отсутствующие компоненты\n\n`;
      for (const item of missing) {
        report += `### ${item.component}\n`;
        report += `**Планировалось:** ${item.planned}\n`;
        report += `**Текущее состояние:** ${item.current}\n`;
        if (item.impact) {
          report += `**Влияние:** ${item.impact}\n`;
        }
        report += '\n';
      }
    }

    if (matches.length > 0) {
      report += `## ✅ Соответствует плану\n\n`;
      for (const item of matches) {
        report += `### ${item.component}\n`;
        report += `**Статус:** ${item.current}\n\n`;
      }
    }

    return report;
  }

  /**
   * Генерация отчета о Claude Command агентах
   */
  generateClaudeAgentsReport(): string {
    let report = '# Claude Code AI Agents (.claude/commands)\n\n';
    report += `**Всего агентов:** ${this.claudeCommandAgents.length}\n`;
    report += `**Общий размер промптов:** 237 KB\n\n`;

    report += '## Список агентов\n\n';

    for (const agent of this.claudeCommandAgents) {
      report += `### ${agent.name}\n`;
      report += `**Файл:** ${agent.file}\n`;
      report += `**Размер:** ${agent.size}\n`;
      report += `**Назначение:** ${agent.purpose}\n`;
      if (agent.expectedStack) {
        report += `**Ожидаемый стек:** ${agent.expectedStack.join(', ')}\n`;
      }
      report += '\n';
    }

    report += '## ⚠️ Критическое несоответствие\n\n';
    report +=
      'Все 11 агентов настроены на работу со стеком **Svelte 5 + Go + Bun**,\n';
    report +=
      'но текущая реализация использует **Next.js + React**.\n\n';
    report += '**Последствия:**\n';
    report +=
      '- Frontend агент генерирует Svelte код вместо React\n';
    report +=
      '- Backend-Go агент ожидает структуру Go проекта (которого нет)\n';
    report +=
      '- ML агент ожидает Python + FastAPI (не создан)\n\n';

    return report;
  }

  /**
   * Получить рекомендации по миграции
   */
  getMigrationRecommendations(): {
    recommended: string;
    options: Array<{
      variant: string;
      title: string;
      timeline: string;
      pros: string[];
      cons: string[];
    }>;
  } {
    return {
      recommended: 'Variant A',
      options: [
        {
          variant: 'A',
          title: 'Полная миграция на Svelte 5 + Go + Bun',
          timeline: '2-3 дня',
          pros: [
            'Соответствие оригинальному плану из DOCUMENTS/',
            'Все 11 AI агентов работают как задумано',
            'Производительность: 3-5x быстрее React',
            'Bundle size: 40 KB вместо 140 KB (3.5x меньше)',
            'Идеально для data-heavy дашбордов',
            'Event ingestion: 10M req/sec (Go)',
          ],
          cons: [
            'Нужно переписать Login страницу (1 файл)',
            '2-3 дня работы',
          ],
        },
        {
          variant: 'B',
          title: 'Гибридный подход',
          timeline: '2 дня',
          pros: [
            'Сохранить Next.js Login',
            'Создать Go backend для event ingestion',
            'Добавить Bun API layer',
            'Быстрая реализация',
          ],
          cons: [
            'Frontend остается Next.js (производительность хуже)',
            'Frontend агент не будет работать корректно',
            'Bundle size остается 140 KB',
            'Несоответствие оригинальному плану',
          ],
        },
        {
          variant: 'C',
          title: 'Обновить AI агентов под Next.js',
          timeline: '5-7 дней',
          pros: [
            'Сохранить весь текущий код',
            'Не нужно ничего переписывать',
          ],
          cons: [
            'Нужно переписать 11 агентов (237 KB промптов)',
            'Потеря преимуществ Svelte (производительность)',
            'Отказ от оригинального плана',
            'Bundle size остается 3.5x больше',
            'Не достигнуть 10M req/sec на Node.js',
          ],
        },
      ],
    };
  }
}

export const productManager = new ProductManagerAgent();
