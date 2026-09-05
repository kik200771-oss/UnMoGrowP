/**
 * Authentication Store for UnMoGrowP Attribution Platform
 *
 * Manages JWT tokens, user state, and authentication flow
 * Uses Svelte 5 runes for reactive state management
 */

import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import Cookies from 'js-cookie';
import { api } from '$lib/api/client';
import type { LoginRequest, LoginResponse, GoogleAuthRequest } from '$lib/api/client';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  permissions?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

// Create Svelte stores
export const authState = writable<AuthState>(initialState);

// Auth actions
class AuthService {

  constructor() {
    // Initialize auth state from cookies on browser load
    if (browser) {
      this.initializeFromCookies();
    }
  }

  private initializeFromCookies() {
    const token = Cookies.get('auth_token');
    const userStr = Cookies.get('auth_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        authState.update(state => ({
          ...state,
          isAuthenticated: true,
          user,
          token,
        }));
      } catch (error) {
        console.warn('Failed to parse user from cookies:', error);
        this.logout();
      }
    }
  }

  private setLoading(loading: boolean) {
    authState.update(state => ({ ...state, isLoading: loading }));
  }

  private setError(error: string | null) {
    authState.update(state => ({ ...state, error }));
  }

  private setAuthData(user: User, token: string, rememberMe: boolean = false) {
    if (browser) {
      const expires = rememberMe ? 7 : 1; // 7 days or 1 day

      // Save to cookies
      Cookies.set('auth_token', token, { expires });
      Cookies.set('auth_user', JSON.stringify(user), { expires });

      // Save to API client
      api.saveAuthToken(token, rememberMe);
    }

    // Update store
    authState.update(state => ({
      ...state,
      isAuthenticated: true,
      user,
      token,
      error: null,
    }));
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string, rememberMe: boolean = false, recaptchaToken: string = 'test-token'): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    try {
      const loginRequest: LoginRequest = {
        email,
        password,
        rememberMe,
        recaptchaToken,
      };

      const response = await api.login(loginRequest);

      if (response.success && response.data) {
        this.setAuthData(response.data.user, response.data.token, rememberMe);
        return true;
      } else {
        this.setError(response.error || 'Login failed');
        return false;
      }
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Login failed');
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await api.register(email, password, name);
      console.log('Registration response:', response); // DEBUG
      console.log('response.success:', response.success); // DEBUG
      console.log('response.data:', response.data); // DEBUG
      console.log('Condition result:', response.success && response.data); // DEBUG

      if (response.success && response.data) {
        console.log('SUCCESS: Setting auth data and returning true'); // DEBUG
        // Use token from registration response directly
        this.setAuthData(response.data.user, response.data.token);
        return true;
      } else {
        console.log('FAILURE: Setting error and returning false'); // DEBUG
        console.log('response.error:', response.error); // DEBUG
        this.setError(response.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Registration failed');
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Google OAuth login
   */
  async googleAuth(credential?: string, recaptchaToken: string = 'test-token'): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    try {
      const googleRequest: GoogleAuthRequest = {
        credential,
        recaptchaToken,
      };

      const response = await api.googleAuth(googleRequest);

      if (response.success && response.data) {
        this.setAuthData(response.data.user, response.data.token);
        return true;
      } else {
        this.setError(response.error || 'Google login failed');
        return false;
      }
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Google login failed');
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Logout user
   */
  logout() {
    if (browser) {
      // Clear cookies
      Cookies.remove('auth_token');
      Cookies.remove('auth_user');

      // Clear API client token
      api.clearAuthToken();
    }

    // Reset store
    authState.set(initialState);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!browser) return false;
    return api.isAuthenticated();
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    if (!browser) return null;
    return api.getToken() || null;
  }

  /**
   * Refresh authentication state
   */
  async refreshAuth(): Promise<void> {
    if (!this.isAuthenticated()) {
      this.logout();
      return;
    }

    try {
      // Verify token is still valid by making a test API call
      const response = await api.healthCheck();

      if (!response.success) {
        // Token might be expired, logout
        this.logout();
      }
    } catch (error) {
      console.warn('Auth refresh failed:', error);
      this.logout();
    }
  }
}

// Export singleton instance
export const auth = new AuthService();

// Helper function to get current auth state
export function getAuthState(): AuthState {
  let currentState: AuthState = initialState;
  authState.subscribe(state => currentState = state)();
  return currentState;
}