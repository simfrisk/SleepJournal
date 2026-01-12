import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export function generateAccessToken(userId: string, email: string): string {
  const payload: TokenPayload = {
    userId,
    email,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });
}

export function generateRefreshToken(userId: string, email: string): string {
  const payload: TokenPayload = {
    userId,
    email,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function createRefreshTokenCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = [
    `refreshToken=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${7 * 24 * 60 * 60}`, // 7 days in seconds
    'SameSite=Strict',
  ];

  if (isProduction) {
    cookieOptions.push('Secure');
  }

  return cookieOptions.join('; ');
}

export function clearRefreshTokenCookie(): string {
  return 'refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict';
}

export function extractTokenFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));

  if (!refreshCookie) return null;

  return refreshCookie.split('=')[1];
}
