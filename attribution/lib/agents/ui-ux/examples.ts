/**
 * Примеры использования UI/UX агента
 *
 * Эти примеры показывают, как использовать агент для различных задач.
 * Можно запустить эти примеры в API route или Server Action.
 */

import { getUIUXAgent } from './agent';
import type { UIAnalysisRequest } from './types';

/**
 * Пример 1: Базовый анализ кнопки
 */
export async function exampleBasicButtonAnalysis() {
  const agent = getUIUXAgent();

  const buttonCode = `
export function SubmitButton({ onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
    >
      Submit
    </button>
  );
}
  `.trim();

  const analysis = await agent.analyzeComponent({
    componentCode: buttonCode,
    componentType: 'button',
    context: 'Primary action button for form submission in a marketing attribution dashboard',
  });

  return analysis;
}

/**
 * Пример 2: Анализ формы входа
 */
export async function exampleLoginFormAnalysis() {
  const agent = getUIUXAgent();

  const formCode = `
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md"
      >
        Sign In
      </button>
    </form>
  );
}
  `.trim();

  const analysis = await agent.analyzeComponent({
    componentCode: formCode,
    componentType: 'form',
    context: 'User authentication form on the login page',
    userFlow: 'User enters email and password, clicks sign in button, gets authenticated',
  });

  return analysis;
}

/**
 * Пример 3: Анализ с Design System
 */
export async function exampleAnalysisWithDesignSystem() {
  const agent = getUIUXAgent();

  const cardCode = `
export function MetricCard({ title, value, change, icon }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-sm text-green-600 mt-1">+{change}%</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}
  `.trim();

  const designSystem = {
    colors: {
      primary: '#4F46E5',
      secondary: '#06B6D4',
      accent: '#10B981',
      background: '#F9FAFB',
      text: '#111827',
    },
    spacing: {
      unit: 4,
      scale: [1, 2, 3, 4, 6, 8, 12, 16, 20, 24],
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSizes: [12, 14, 16, 18, 20, 24, 30, 36],
      lineHeights: [1.2, 1.4, 1.5, 1.6, 1.8],
    },
    borderRadius: [4, 6, 8, 12, 16, 24],
  };

  const analysis = await agent.analyzeComponent({
    componentCode: cardCode,
    componentType: 'card',
    context: 'Metric card displaying key performance indicators on dashboard',
    designSystem,
  });

  return analysis;
}

/**
 * Пример 4: Получение рекомендаций по дизайну
 */
export async function exampleDesignSuggestions() {
  const agent = getUIUXAgent();

  const suggestions = await agent.getDesignSuggestions(
    `Дашборд для платформы маркетинговой атрибуции. Показывает:
    - Ключевые метрики (конверсии, ROI, клики)
    - Графики по каналам
    - Таблицу последних событий
    - Фильтры по датам и каналам
    Целевая аудитория: маркетологи и аналитики`,
    {
      colors: {
        primary: '#4F46E5',
        secondary: '#06B6D4',
        background: '#FFFFFF',
        text: '#111827',
      },
      spacing: {
        unit: 4,
        scale: [1, 2, 3, 4, 6, 8, 12, 16],
      },
      typography: {
        fontFamily: 'Inter',
        fontSizes: [12, 14, 16, 18, 24, 32],
        lineHeights: [1.4, 1.5, 1.6],
      },
      borderRadius: [8, 12, 16],
    }
  );

  return suggestions;
}

/**
 * Пример 5: Улучшение компонента
 */
export async function exampleComponentImprovement() {
  const agent = getUIUXAgent();

  const navigationCode = `
export function Navigation() {
  return (
    <nav className="flex gap-4">
      <a href="/">Home</a>
      <a href="/dashboard">Dashboard</a>
      <a href="/analytics">Analytics</a>
      <a href="/settings">Settings</a>
    </nav>
  );
}
  `.trim();

  const improvement = await agent.improveComponent(navigationCode, 'navigation');

  return improvement;
}

/**
 * Пример 6: Проверка accessibility
 */
export async function exampleAccessibilityCheck() {
  const agent = getUIUXAgent();

  const modalCode = `
export function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <button onClick={onClose} className="float-right">×</button>
        {children}
      </div>
    </div>
  );
}
  `.trim();

  const report = await agent.checkAccessibility(modalCode);

  return report;
}

/**
 * Пример 7: Комплексный анализ dashboard компонента
 */
export async function exampleDashboardAnalysis() {
  const agent = getUIUXAgent();

  const dashboardCode = `
export function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Attribution Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <MetricCard title="Total Conversions" value="1,234" change="+12.5" />
          <MetricCard title="Revenue" value="$45,678" change="+8.3" />
          <MetricCard title="ROI" value="320%" change="+15.7" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Channel Performance</h2>
          <div className="h-64">
            {/* Chart component */}
          </div>
        </div>
      </main>
    </div>
  );
}
  `.trim();

  const request: UIAnalysisRequest = {
    componentCode: dashboardCode,
    componentType: 'layout',
    context: 'Main dashboard page for attribution platform showing key metrics and charts',
    userFlow: `
      1. User logs in and lands on dashboard
      2. Views key metrics at a glance
      3. Scrolls to see detailed channel performance
      4. Can click on metrics for drill-down
    `,
    designSystem: {
      colors: {
        primary: '#4F46E5',
        secondary: '#06B6D4',
        accent: '#10B981',
        background: '#F9FAFB',
        text: '#111827',
      },
      spacing: {
        unit: 4,
        scale: [1, 2, 3, 4, 6, 8, 12, 16, 20, 24],
      },
      typography: {
        fontFamily: 'Inter',
        fontSizes: [12, 14, 16, 18, 20, 24, 30, 36, 48],
        lineHeights: [1.2, 1.4, 1.5, 1.6, 1.8],
      },
      borderRadius: [4, 6, 8, 12, 16],
    },
  };

  const analysis = await agent.analyzeComponent(request);

  return {
    overallScore: analysis.score,
    accessibilityScore: analysis.accessibility.score,
    usabilityScore: analysis.usability.score,
    visualScore: analysis.visualDesign.score,
    criticalIssues: analysis.recommendations.filter(r => r.priority === 'high'),
    summary: analysis.summary,
  };
}
