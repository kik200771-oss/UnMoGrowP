/**
 * Вспомогательные утилиты для UI/UX агента
 */

import type { Issue, Recommendation } from '../types';

/**
 * Сортирует проблемы по серьезности
 */
export function sortIssuesBySeverity(issues: Issue[]): Issue[] {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...issues].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

/**
 * Группирует проблемы по категориям
 */
export function groupIssuesByCategory(issues: Issue[]): Record<string, Issue[]> {
  return issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);
}

/**
 * Сортирует рекомендации по приоритету
 */
export function sortRecommendationsByPriority(
  recommendations: Recommendation[]
): Recommendation[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

/**
 * Фильтрует рекомендации по категории
 */
export function filterRecommendationsByCategory(
  recommendations: Recommendation[],
  category: string
): Recommendation[] {
  return recommendations.filter((rec) => rec.category === category);
}

/**
 * Вычисляет общий score на основе отдельных метрик
 */
export function calculateOverallScore(scores: {
  accessibility: number;
  usability: number;
  visualDesign: number;
}): number {
  // Веса для каждой категории
  const weights = {
    accessibility: 0.4, // 40% - самое важное
    usability: 0.35, // 35%
    visualDesign: 0.25, // 25%
  };

  return Math.round(
    scores.accessibility * weights.accessibility +
      scores.usability * weights.usability +
      scores.visualDesign * weights.visualDesign
  );
}

/**
 * Получает цвет для отображения score
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'green';
  if (score >= 70) return 'yellow';
  if (score >= 50) return 'orange';
  return 'red';
}

/**
 * Получает текстовое описание score
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Отлично';
  if (score >= 70) return 'Хорошо';
  if (score >= 50) return 'Удовлетворительно';
  return 'Требуется улучшение';
}

/**
 * Форматирует код для отображения
 */
export function formatCode(code: string): string {
  return code.trim();
}

/**
 * Извлекает компонент из кода (например, из файла)
 */
export function extractComponentCode(fileContent: string): string {
  // Простая логика - можно расширить
  return fileContent.trim();
}

/**
 * Проверяет, является ли строка валидным React компонентом
 */
export function isValidReactComponent(code: string): boolean {
  // Простая проверка на наличие JSX
  return /(?:function|const|class)\s+\w+/.test(code) && /<[A-Z]/.test(code);
}

/**
 * Генерирует краткое резюме анализа
 */
export function generateSummary(
  accessibilityScore: number,
  usabilityScore: number,
  visualScore: number,
  issuesCount: number
): string {
  const overallScore = calculateOverallScore({
    accessibility: accessibilityScore,
    usability: usabilityScore,
    visualDesign: visualScore,
  });

  const label = getScoreLabel(overallScore);

  return `Общая оценка: ${overallScore}/100 (${label}). Найдено проблем: ${issuesCount}.`;
}
