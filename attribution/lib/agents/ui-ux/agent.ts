import Anthropic from '@anthropic-ai/sdk';
import type {
  UIAnalysisRequest,
  UIAnalysisResponse,
  DesignSuggestion,
  ComponentImprovement,
} from './types';

/**
 * UI/UX Агент - AI-ассистент для анализа и улучшения пользовательского интерфейса
 */
export class UIUXAgent {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.model = 'claude-sonnet-4-5-20250929'; // Claude Sonnet 4.5 - Latest and best for coding
  }

  /**
   * Анализирует UI компонент и возвращает детальный отчет
   */
  async analyzeComponent(request: UIAnalysisRequest): Promise<UIAnalysisResponse> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildAnalysisPrompt(request);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return this.parseAnalysisResponse(content.text);
      }

      throw new Error('Unexpected response format from Claude');
    } catch (error) {
      console.error('Error analyzing component:', error);
      throw error;
    }
  }

  /**
   * Генерирует рекомендации по улучшению дизайна
   */
  async getDesignSuggestions(
    context: string,
    designSystem?: UIAnalysisRequest['designSystem']
  ): Promise<DesignSuggestion[]> {
    const systemPrompt = `Ты эксперт по UI/UX дизайну. Твоя задача - давать конкретные,
    применимые рекомендации по улучшению пользовательского интерфейса, основываясь на
    лучших практиках дизайна, accessibility и usability.`;

    const userPrompt = `
Контекст: ${context}

${designSystem ? `Design System:\n${JSON.stringify(designSystem, null, 2)}` : ''}

Предложи 5-7 конкретных улучшений для данного контекста. Для каждого улучшения укажи:
1. Тип улучшения (color/spacing/typography/layout/interaction)
2. Конкретное предложение
3. Обоснование почему это улучшит UX

Ответ верни в формате JSON массива объектов с полями: type, suggestion, reasoning.
`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return this.parseDesignSuggestions(content.text);
      }

      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error getting design suggestions:', error);
      throw error;
    }
  }

  /**
   * Анализирует компонент и предлагает конкретные улучшения кода
   */
  async improveComponent(
    componentCode: string,
    componentType: string
  ): Promise<ComponentImprovement> {
    const systemPrompt = `Ты эксперт по React, TypeScript, Tailwind CSS и UI/UX.
    Анализируй код компонентов и предлагай конкретные улучшения для accessibility,
    usability и визуального дизайна.`;

    const userPrompt = `
Проанализируй следующий ${componentType} компонент и предложи улучшения:

\`\`\`tsx
${componentCode}
\`\`\`

Предложи улучшения в трех категориях:
1. Accessibility (ARIA-атрибуты, клавиатурная навигация, screen readers)
2. Usability (удобство использования, понятность, feedback)
3. Visual (визуальная иерархия, spacing, цвета, типографика)

Также предоставь улучшенную версию кода.

Ответ верни в формате JSON:
{
  "component": "название компонента",
  "improvements": {
    "accessibility": ["улучшение 1", "улучшение 2"],
    "usability": ["улучшение 1", "улучшение 2"],
    "visual": ["улучшение 1", "улучшение 2"]
  },
  "codeSnippets": {
    "before": "исходный код",
    "after": "улучшенный код"
  }
}
`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return this.parseComponentImprovement(content.text);
      }

      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error improving component:', error);
      throw error;
    }
  }

  /**
   * Проверяет accessibility компонента
   */
  async checkAccessibility(componentCode: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const systemPrompt = `Ты эксперт по веб-accessibility (WCAG 2.1).
    Проверяй код на соответствие стандартам accessibility и предлагай улучшения.`;

    const userPrompt = `
Проверь accessibility следующего компонента:

\`\`\`tsx
${componentCode}
\`\`\`

Проверь:
- ARIA-атрибуты
- Семантический HTML
- Клавиатурную навигацию
- Контрастность цветов
- Альтернативный текст
- Focus management

Верни результат в JSON формате:
{
  "score": 0-100,
  "issues": ["проблема 1", "проблема 2"],
  "recommendations": ["рекомендация 1", "рекомендация 2"]
}
`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return this.parseAccessibilityReport(content.text);
      }

      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error checking accessibility:', error);
      throw error;
    }
  }

  // Private helper methods

  private buildSystemPrompt(): string {
    return `Ты профессиональный UI/UX дизайнер и эксперт по веб-разработке.
Твоя специализация:
- Анализ пользовательских интерфейсов
- Web accessibility (WCAG 2.1 AA/AAA)
- Usability testing и UX research
- Visual design principles
- React, TypeScript, Tailwind CSS
- Design systems

При анализе компонентов ты оцениваешь:
1. Accessibility - доступность для всех пользователей
2. Usability - удобство использования
3. Visual Design - визуальный дизайн и иерархия
4. Performance - влияние на производительность
5. Consistency - соответствие design system

Давай конкретные, применимые рекомендации с примерами кода.`;
  }

  private buildAnalysisPrompt(request: UIAnalysisRequest): string {
    let prompt = 'Проанализируй следующий UI компонент:\n\n';

    if (request.componentCode) {
      prompt += `\`\`\`tsx\n${request.componentCode}\n\`\`\`\n\n`;
    }

    if (request.componentType) {
      prompt += `Тип компонента: ${request.componentType}\n`;
    }

    if (request.context) {
      prompt += `Контекст использования: ${request.context}\n`;
    }

    if (request.designSystem) {
      prompt += `\nDesign System:\n${JSON.stringify(request.designSystem, null, 2)}\n`;
    }

    if (request.userFlow) {
      prompt += `\nПользовательский flow: ${request.userFlow}\n`;
    }

    prompt += `
Проведи детальный анализ и верни результат СТРОГО в следующем JSON формате.

ВАЖНО:
- Возвращай ТОЛЬКО валидный JSON без markdown блоков
- Escape все специальные символы в строках (кавычки, переносы строк)
- Все текстовые поля должны быть в одну строку
- Используй максимум 100 символов для description и suggestion
- Не используй кавычки внутри строк, замени на одинарные кавычки или убери

Формат ответа:
{
  "score": 0-100,
  "accessibility": {
    "score": 0-100,
    "issues": [{"severity": "critical/high/medium/low", "description": "краткое описание до 100 символов", "suggestion": "краткое решение до 100 символов"}],
    "passed": ["что работает хорошо"],
    "wcagLevel": "A/AA/AAA/none"
  },
  "usability": {
    "score": 0-100,
    "issues": [{"severity": "high/medium/low", "description": "описание", "suggestion": "решение"}],
    "strengths": ["сильные стороны"],
    "userExperience": {
      "clarity": 0-100,
      "efficiency": 0-100,
      "learnability": 0-100
    }
  },
  "visualDesign": {
    "score": 0-100,
    "issues": [{"severity": "high/medium/low", "description": "описание", "suggestion": "решение"}],
    "strengths": ["сильные стороны"],
    "designPrinciples": {
      "contrast": 0-100,
      "hierarchy": 0-100,
      "consistency": 0-100,
      "whitespace": 0-100
    }
  },
  "recommendations": [
    {
      "priority": "high/medium/low",
      "category": "категория",
      "title": "краткий заголовок",
      "description": "краткое описание до 150 символов",
      "codeExample": "краткий пример",
      "rationale": "краткое обоснование до 150 символов",
      "estimatedImpact": "high/medium/low"
    }
  ],
  "summary": "краткий итог анализа в одну строку до 200 символов"
}
`;

    return prompt;
  }

  private parseAnalysisResponse(text: string): UIAnalysisResponse {
    try {
      // Извлекаем JSON из ответа (может быть обернут в markdown код блок)
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      let jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

      // Очищаем и валидируем JSON
      jsonText = jsonText.trim();

      // Попытка 1: прямой парсинг
      try {
        return JSON.parse(jsonText);
      } catch (e1) {
        // Попытка 2: удаляем trailing comma и пробуем снова
        jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
        try {
          return JSON.parse(jsonText);
        } catch (e2) {
          // Попытка 3: если JSON обрезан, пытаемся закрыть его
          const openBraces = (jsonText.match(/\{/g) || []).length;
          const closeBraces = (jsonText.match(/\}/g) || []).length;
          const openBrackets = (jsonText.match(/\[/g) || []).length;
          const closeBrackets = (jsonText.match(/\]/g) || []).length;

          let fixedText = jsonText;
          // Закрываем незакрытые массивы и объекты
          for (let i = 0; i < openBrackets - closeBrackets; i++) fixedText += ']';
          for (let i = 0; i < openBraces - closeBraces; i++) fixedText += '}';

          try {
            return JSON.parse(fixedText);
          } catch (e3) {
            // Логируем для debugging
            console.error('Failed to parse JSON after all attempts');
            console.error('Original text length:', text.length);
            console.error('First 500 chars:', text.substring(0, 500));
            console.error('Last 500 chars:', text.substring(text.length - 500));
            throw e3;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      throw new Error('Failed to parse AI response - invalid JSON format');
    }
  }

  private parseDesignSuggestions(text: string): DesignSuggestion[] {
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      return JSON.parse(jsonText.trim());
    } catch (error) {
      console.error('Error parsing design suggestions:', error);
      return [];
    }
  }

  private parseComponentImprovement(text: string): ComponentImprovement {
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      return JSON.parse(jsonText.trim());
    } catch (error) {
      console.error('Error parsing component improvement:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private parseAccessibilityReport(text: string): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      return JSON.parse(jsonText.trim());
    } catch (error) {
      console.error('Error parsing accessibility report:', error);
      return { score: 0, issues: [], recommendations: [] };
    }
  }
}

// Singleton instance для удобного использования
let agentInstance: UIUXAgent | null = null;

export function getUIUXAgent(apiKey?: string): UIUXAgent {
  if (!agentInstance) {
    agentInstance = new UIUXAgent(apiKey);
  }
  return agentInstance;
}
