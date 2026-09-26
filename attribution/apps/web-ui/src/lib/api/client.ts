/**
 * API Client for UnMoGrowP Attribution Platform
 *
 * Communicates with Bun + Hono API layer (http://localhost:3004)
 * JWT RBAC Authorization + Real ClickHouse Data
 * All requests are typed and include error handling
 */

import { browser } from '$app/environment';
import Cookies from 'js-cookie';

const API_BASE_URL = typeof window !== 'undefined'
  ? (window.location.origin.includes('localhost') ? 'http://localhost:8080' : window.location.origin)
  : 'http://localhost:8080'; // Redis-integrated Go API Gateway (v3.0.0-redis)

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    cache_hit?: boolean;
    response_time?: string;
    source?: string;
  };
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
  total_events: number;
  active_users: number;
  revenue_today: number;
  conversions: number;
  cache_enabled?: boolean;
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

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (browser) {
      const token = Cookies.get('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Generic fetch wrapper with JWT authentication and error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      // Always try to parse JSON response, regardless of status code
      const data = await response.json();

      // If response is not ok and data doesn't have success field, add it
      if (!response.ok && data.success === undefined) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // JWT Authentication utilities
  saveAuthToken(token: string, rememberMe: boolean = false): void {
    if (browser) {
      const expires = rememberMe ? 7 : 1; // 7 days or 1 day
      Cookies.set('auth_token', token, { expires });
    }
  }

  clearAuthToken(): void {
    if (browser) {
      Cookies.remove('auth_token');
    }
  }

  isAuthenticated(): boolean {
    if (!browser) return false;
    return !!Cookies.get('auth_token');
  }

  getToken(): string | undefined {
    if (!browser) return undefined;
    return Cookies.get('auth_token');
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
   * Check if email is available for registration
   */
  async checkEmailAvailability(email: string): Promise<ApiResponse<{ available: boolean; message?: string }>> {
    return this.request<{ available: boolean; message?: string }>('/api/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string): Promise<ApiResponse<LoginResponse>> {
    console.log('[API CLIENT] Register request to:', `${this.baseUrl}/api/auth/register`); // DEBUG
    console.log('[API CLIENT] Request payload:', { email, password: '***', name }); // DEBUG

    const response = await this.request<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    console.log('[API CLIENT] Register response:', response); // DEBUG
    return response;
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

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ resetToken?: string; expiresAt?: string }>> {
    return this.request<{ resetToken?: string; expiresAt?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  /**
   * Verify password reset token
   */
  async verifyResetToken(token: string): Promise<ApiResponse<{ email: string }>> {
    return this.request<{ email: string }>('/api/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // ==================== Dashboard ====================

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/api/v1/dashboard/stats');
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
