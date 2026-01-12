import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, SignupCredentials, LoginCredentials } from '../types/auth.types';
import { authService } from '../services/auth.service';
import { clearAccessToken } from '../utils/token';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      // Try to refresh token on app load
      const accessToken = await authService.refresh();

      // Decode token to get user info
      const decoded: any = jwtDecode(accessToken);
      setUser({
        id: decoded.userId,
        email: decoded.email,
      });
    } catch (error) {
      // No valid refresh token, user needs to login
      clearAccessToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(credentials: LoginCredentials) {
    try {
      setLoading(true);
      setError(null);

      const { user } = await authService.login(credentials);
      setUser(user);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        error.message ||
        'Login failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signup(credentials: SignupCredentials) {
    try {
      setLoading(true);
      setError(null);

      const { user } = await authService.signup(credentials);
      setUser(user);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        error.message ||
        'Signup failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      clearAccessToken();
      setLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
