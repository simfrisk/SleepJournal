import { Handler } from '@netlify/functions';
import {
  successResponse,
  errorResponse,
  handleCors,
} from './utils/response';
import {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  createRefreshTokenCookie,
  extractTokenFromCookie,
} from './utils/jwt';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  try {
    // Extract refresh token from cookie
    const cookieHeader = event.headers['cookie'] || event.headers['Cookie'];
    const refreshToken = extractTokenFromCookie(cookieHeader);

    if (!refreshToken) {
      return errorResponse('UNAUTHORIZED', 'No refresh token provided', 401);
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyToken(refreshToken);
    } catch (error) {
      return errorResponse(
        'UNAUTHORIZED',
        error instanceof Error ? error.message : 'Invalid refresh token',
        401
      );
    }

    // Verify token type
    if (payload.type !== 'refresh') {
      return errorResponse('UNAUTHORIZED', 'Invalid token type', 401);
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(payload.userId, payload.email);
    const newRefreshToken = generateRefreshToken(payload.userId, payload.email);

    // Return response with new refresh token cookie
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
        'Set-Cookie': createRefreshTokenCookie(newRefreshToken),
      },
      body: JSON.stringify({
        success: true,
        accessToken: newAccessToken,
      }),
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return errorResponse(
      'SERVER_ERROR',
      'Failed to refresh token',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
