import Anthropic from '@anthropic-ai/sdk';

interface DesignSpec {
  colors: {
    background: string;
    primary: string;
    secondary: string;
    text: string;
    borders: string;
  };
  typography: {
    fontFamily: string;
    sizes: Record<string, string>;
    weights: Record<string, string>;
  };
  spacing: {
    padding: Record<string, string>;
    margin: Record<string, string>;
    gaps: Record<string, string>;
  };
  components: Array<{
    name: string;
    type: string;
    dimensions: { width: string; height: string };
    position: string;
    styling: Record<string, string>;
    interactivity: string[];
  }>;
  effects: {
    shadows: string[];
    transitions: string[];
    animations: string[];
  };
  layout: {
    structure: string;
    alignment: string;
    responsive: boolean;
  };
}

export class DesignAnalyzer {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyzeDesign(imageBase64: string, description?: string): Promise<DesignSpec> {
    const prompt = `Проанализируй этот дизайн интерфейса и создай ДЕТАЛЬНУЮ спецификацию для реализации.

${description ? `Контекст: ${description}` : ''}

Верни JSON со следующей структурой:
{
  "colors": {
    "background": "точный цвет в rgb() или hex",
    "primary": "основной цвет кнопок/акцентов",
    "secondary": "вторичный цвет",
    "text": "цвет текста",
    "borders": "цвет границ"
  },
  "typography": {
    "fontFamily": "название шрифта или generic",
    "sizes": {
      "heading": "размер заголовков",
      "body": "размер основного текста",
      "small": "размер мелкого текста"
    },
    "weights": {
      "normal": "400",
      "medium": "500",
      "bold": "700"
    }
  },
  "spacing": {
    "padding": {"container": "значение", "card": "значение"},
    "margin": {"section": "значение", "element": "значение"},
    "gaps": {"flex": "значение", "grid": "значение"}
  },
  "components": [
    {
      "name": "название компонента",
      "type": "button/input/card/etc",
      "dimensions": {"width": "значение", "height": "значение"},
      "position": "описание позиционирования",
      "styling": {
        "borderRadius": "значение",
        "boxShadow": "значение",
        "другие стили": "значения"
      },
      "interactivity": ["hover эффект", "focus состояние", "active состояние"]
    }
  ],
  "effects": {
    "shadows": ["детальное описание каждой тени"],
    "transitions": ["transition: property duration easing"],
    "animations": ["описание анимаций если есть"]
  },
  "layout": {
    "structure": "описание структуры (flex/grid/etc)",
    "alignment": "как выровнены элементы",
    "responsive": true/false
  }
}

ВАЖНО:
- Используй ТОЧНЫЕ значения цветов (не "синий", а "rgb(109, 140, 248)")
- Измеряй размеры в px
- Описывай ВСЕ интерактивные состояния (hover, focus, active)
- Обращай внимание на z-index и наложение элементов
- Описывай тени с точными значениями
- Отмечай floating labels, transitions и другие эффекты

Верни ТОЛЬКО валидный JSON без дополнительного текста.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return this.parseSpec(textContent.text);
  }

  private parseSpec(text: string): DesignSpec {
    try {
      // Попытка извлечь JSON из markdown блока
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      return JSON.parse(jsonText.trim());
    } catch (error) {
      console.error('Error parsing design spec:', error);
      throw new Error('Failed to parse design specification');
    }
  }

  generateHTMLFromSpec(spec: DesignSpec, componentName: string): string {
    // Генерация HTML прототипа на основе спецификации
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${componentName} - Prototype</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${spec.typography.fontFamily};
            background: ${spec.colors.background};
            color: ${spec.colors.text};
        }

        /* Добавьте стили на основе спецификации */
        /* Это базовый шаблон, который нужно дополнить */
    </style>
</head>
<body>
    <!-- Структура на основе spec.components -->
    <div class="container">
        <!-- Компоненты будут добавлены здесь -->
    </div>
</body>
</html>`;
  }
}
