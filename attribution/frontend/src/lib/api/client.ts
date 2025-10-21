/**
 * API Client for UnMoGrowP Attribution Platform
 *
 * Communicates with Bun + Hono API layer (http://localhost:3001)
 * All requests are typed and include error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
  recaptchaToken: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface GoogleAuthRequest {
  recaptchaToken: string;
  credential?: string;
}

export interface DashboardStats {
  totalEvents: number;
  activeUsers: number;
  revenue: number;
}

export interface EventTrackRequest {
  event_type: string;
  app_id: string;
  device_id: string;
  user_id?: string;
  session_id: string;
  timestamp: number;
  platform: string;
  os_version: string;
  app_version: string;
  attribution?: Record<string, any>;
  event_data?: Record<string, any>;
  ip: string;
  user_agent: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== Authentication ====================

  /**
   * Login with email and password
   */
  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string): Promise<ApiResponse> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  /**
   * Google OAuth login
   */
  async googleAuth(request: GoogleAuthRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // ==================== Dashboard ====================

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/api/dashboard/stats');
  }

  /**
   * Get chart data by type
   */
  async getChartData(chartType: string): Promise<ApiResponse<any>> {
    return this.request(`/api/dashboard/charts/${chartType}`);
  }

  // ==================== Attribution ====================

  /**
   * Track single event
   */
  async trackEvent(event: EventTrackRequest): Promise<ApiResponse> {
    return this.request('/api/attribution/track', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  /**
   * Track batch events
   */
  async trackBatchEvents(events: EventTrackRequest[]): Promise<ApiResponse> {
    return this.request('/api/attribution/batch', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  }

  // ==================== Analytics ====================

  /**
   * Get analytics report by ID
   */
  async getReport(reportId: string): Promise<ApiResponse> {
    return this.request(`/api/analytics/reports/${reportId}`);
  }

  // ==================== Apps Management ====================

  /**
   * Get all apps
   */
  async getApps(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/apps');
  }

  /**
   * Create new app
   */
  async createApp(appData: any): Promise<ApiResponse> {
    return this.request('/api/apps', {
      method: 'POST',
      body: JSON.stringify(appData),
    });
  }

  // ==================== Health Check ====================

  /**
   * Check API health
   */
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing or custom instances
export default ApiClient;
