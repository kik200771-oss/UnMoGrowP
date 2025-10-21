/**
 * Типы и интерфейсы для UI/UX агента
 */

export interface UIAnalysisRequest {
  componentCode?: string;
  componentType?: 'button' | 'form' | 'card' | 'navigation' | 'layout' | 'other';
  designSystem?: DesignSystemConfig;
  context?: string;
  userFlow?: string;
}

export interface DesignSystemConfig {
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background: string;
    text: string;
  };
  spacing: {
    unit: number; // базовая единица в px
    scale: number[]; // множители для spacing
  };
  typography: {
    fontFamily: string;
    fontSizes: number[];
    lineHeights: number[];
  };
  borderRadius: number[];
}

export interface UIAnalysisResponse {
  score: number; // 0-100
  accessibility: AccessibilityReport;
  usability: UsabilityReport;
  visualDesign: VisualDesignReport;
  recommendations: Recommendation[];
  summary: string;
}

export interface AccessibilityReport {
  score: number;
  issues: Issue[];
  passed: string[];
  wcagLevel: 'A' | 'AA' | 'AAA' | 'none';
}

export interface UsabilityReport {
  score: number;
  issues: Issue[];
  strengths: string[];
  userExperience: {
    clarity: number;
    efficiency: number;
    learnability: number;
  };
}

export interface VisualDesignReport {
  score: number;
  issues: Issue[];
  strengths: string[];
  designPrinciples: {
    contrast: number;
    hierarchy: number;
    consistency: number;
    whitespace: number;
  };
}

export interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'accessibility' | 'usability' | 'visual' | 'performance';
  description: string;
  location?: string;
  suggestion: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  codeExample?: string;
  rationale: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

export interface DesignSuggestion {
  type: 'color' | 'spacing' | 'typography' | 'layout' | 'interaction';
  suggestion: string;
  reasoning: string;
  beforeAfter?: {
    before: string;
    after: string;
  };
}

export interface ComponentImprovement {
  component: string;
  improvements: {
    accessibility: string[];
    usability: string[];
    visual: string[];
  };
  codeSnippets?: {
    before: string;
    after: string;
  };
}
