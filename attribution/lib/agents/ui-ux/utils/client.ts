/**
 * Клиентские утилиты для работы с UI/UX агентом
 */

import type {
  UIAnalysisRequest,
  UIAnalysisResponse,
  DesignSuggestion,
  ComponentImprovement,
} from '../types';

/**
 * Анализирует UI компонент через API
 */
export async function analyzeComponent(
  request: UIAnalysisRequest
): Promise<UIAnalysisResponse> {
  const response = await fetch('/api/ui-ux/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze component');
  }

  return response.json();
}

/**
 * Получает рекомендации по дизайну
 */
export async function getDesignSuggestions(
  context: string,
  designSystem?: UIAnalysisRequest['designSystem']
): Promise<DesignSuggestion[]> {
  const response = await fetch('/api/ui-ux/suggestions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ context, designSystem }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get suggestions');
  }

  const data = await response.json();
  return data.suggestions;
}

/**
 * Улучшает компонент с помощью агента
 */
export async function improveComponent(
  componentCode: string,
  componentType: string
): Promise<ComponentImprovement> {
  const response = await fetch('/api/ui-ux/improve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ componentCode, componentType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to improve component');
  }

  return response.json();
}

/**
 * Проверяет accessibility компонента
 */
export async function checkAccessibility(componentCode: string): Promise<{
  score: number;
  issues: string[];
  recommendations: string[];
}> {
  const response = await fetch('/api/ui-ux/accessibility', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ componentCode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check accessibility');
  }

  return response.json();
}
