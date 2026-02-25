import { api, setAccessToken, clearAccessToken } from './client';
import type { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';

/**
 * Authentication API service
 * Aligned with backend response format: { data: { user, tokens } }
 */

export const authApi = {
  /**
   * Login user
   * Backend: POST /api/auth/login
   * Response: { data: { user: PublicUser, tokens: { access_token, refresh_token } } }
   */
  login: async (credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await api.post<{ data: { user: User; tokens: AuthTokens } }>(
      '/auth/login',
      credentials
    );

    // Store access token
    setAccessToken(response.data.tokens.access_token);

    return response.data;
  },

  /**
   * Register new user
   * Backend: POST /api/auth/register
   * Response: { data: { user: PublicUser, tokens: { access_token, refresh_token } } }
   */
  register: async (data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await api.post<{ data: { user: User; tokens: AuthTokens } }>(
      '/auth/register',
      data
    );

    // Store access token
    setAccessToken(response.data.tokens.access_token);

    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
    }
  },

  /**
   * Get current user
   * Backend: GET /api/auth/me
   * Response: { data: { user: PublicUser } }
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<{ data: { user: User } }>('/auth/me');
    return response.data.user;
  },

  /**
   * Refresh access token
   * Backend: POST /api/auth/refresh
   * Response: { data: { tokens: { access_token, refresh_token } } }
   */
  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await api.post<{ data: { tokens: AuthTokens } }>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    setAccessToken(response.data.tokens.access_token);
    return response.data.tokens;
  },
};
