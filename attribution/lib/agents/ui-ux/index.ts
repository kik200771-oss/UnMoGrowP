/**
 * UI/UX Agent - AI-ассистент для анализа и улучшения пользовательского интерфейса
 *
 * Экспортирует все необходимые компоненты для работы с агентом
 */

// Основной агент (только для server-side)
export { UIUXAgent, getUIUXAgent } from './agent';

// Типы и интерфейсы
export type {
  UIAnalysisRequest,
  UIAnalysisResponse,
  DesignSystemConfig,
  AccessibilityReport,
  UsabilityReport,
  VisualDesignReport,
  Issue,
  Recommendation,
  DesignSuggestion,
  ComponentImprovement,
} from './types';

// Клиентские утилиты
export {
  analyzeComponent,
  getDesignSuggestions,
  improveComponent,
  checkAccessibility,
} from './utils/client';

// Вспомогательные утилиты
export {
  sortIssuesBySeverity,
  groupIssuesByCategory,
  sortRecommendationsByPriority,
  filterRecommendationsByCategory,
  calculateOverallScore,
  getScoreColor,
  getScoreLabel,
  formatCode,
  extractComponentCode,
  isValidReactComponent,
  generateSummary,
} from './utils/helpers';
