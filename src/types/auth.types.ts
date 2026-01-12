export interface User {
  id: string;
  email: string;
  lastLoginAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  message?: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
