import api from './api';
import { SignupCredentials, LoginCredentials, AuthResponse, User } from '../types/auth.types';
import { setAccessToken, clearAccessToken } from '../utils/token';

export const authService = {
  async signup(credentials: SignupCredentials): Promise<{ user: User; accessToken: string }> {
    const response = await api.post<AuthResponse>('/auth-signup', credentials);

    if (response.data.success && response.data.accessToken) {
      setAccessToken(response.data.accessToken);
      return {
        user: response.data.user!,
        accessToken: response.data.accessToken,
      };
    }

    throw new Error('Signup failed');
  },

  async login(credentials: LoginCredentials): Promise<{ user: User; accessToken: string }> {
    const response = await api.post<AuthResponse>('/auth-login', credentials);

    if (response.data.success && response.data.accessToken) {
      setAccessToken(response.data.accessToken);
      return {
        user: response.data.user!,
        accessToken: response.data.accessToken,
      };
    }

    throw new Error('Login failed');
  },

  async refresh(): Promise<string> {
    const response = await api.post<{ success: boolean; accessToken: string }>('/auth-refresh');

    if (response.data.success && response.data.accessToken) {
      setAccessToken(response.data.accessToken);
      return response.data.accessToken;
    }

    throw new Error('Token refresh failed');
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth-logout');
    } finally {
      clearAccessToken();
    }
  },
};
