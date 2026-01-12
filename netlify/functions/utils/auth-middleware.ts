import { HandlerEvent } from '@netlify/functions';
import { verifyToken, TokenPayload } from './jwt';
import { errorResponse } from './response';

export interface AuthenticatedEvent extends HandlerEvent {
  user?: TokenPayload;
}

export function extractBearerToken(event: HandlerEvent): string | null {
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];

  if (!authHeader) return null;

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

export function authenticateRequest(event: AuthenticatedEvent): {
  authenticated: boolean;
  user?: TokenPayload;
  error?: any;
} {
  const token = extractBearerToken(event);

  if (!token) {
    return {
      authenticated: false,
      error: errorResponse('UNAUTHORIZED', 'No authorization token provided', 401),
    };
  }

  try {
    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      return {
        authenticated: false,
        error: errorResponse('UNAUTHORIZED', 'Invalid token type', 401),
      };
    }

    return {
      authenticated: true,
      user: payload,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token verification failed';

    return {
      authenticated: false,
      error: errorResponse('UNAUTHORIZED', message, 401),
    };
  }
}

export function requireAuth(event: AuthenticatedEvent): TokenPayload {
  const { authenticated, user, error } = authenticateRequest(event);

  if (!authenticated || !user) {
    throw error;
  }

  return user;
}
