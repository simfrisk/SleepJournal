import { Handler } from '@netlify/functions';
import {
  successResponse,
  errorResponse,
  handleCors,
} from './utils/response';
import { clearRefreshTokenCookie } from './utils/jwt';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  try {
    // Clear refresh token cookie
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
        'Set-Cookie': clearRefreshTokenCookie(),
      },
      body: JSON.stringify({
        success: true,
        message: 'Logged out successfully',
      }),
    };
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(
      'SERVER_ERROR',
      'Logout failed',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
