import { Handler } from '@netlify/functions';
import {
  successResponse,
  errorResponse,
  handleCors,
  parseBody,
} from './utils/response';
import { getUsersCollection } from './utils/db';
import { comparePassword } from './utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  createRefreshTokenCookie,
} from './utils/jwt';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  try {
    const { email, password } = parseBody(event);

    // Validate input
    if (!email || !password) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Email and password are required',
        400
      );
    }

    const usersCollection = await getUsersCollection();

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        401
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse('UNAUTHORIZED', 'Account is deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        401
      );
    }

    // Update last login time
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );

    const userId = user._id.toString();

    // Generate tokens
    const accessToken = generateAccessToken(userId, email);
    const refreshToken = generateRefreshToken(userId, email);

    // Return response with refresh token cookie
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
        'Set-Cookie': createRefreshTokenCookie(refreshToken),
      },
      body: JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: user.email,
          lastLoginAt: user.lastLoginAt,
        },
        accessToken,
      }),
    };
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(
      'SERVER_ERROR',
      'Login failed',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
