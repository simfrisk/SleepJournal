import { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import {
  successResponse,
  errorResponse,
  handleCors,
  parseBody,
} from './utils/response';
import { getUsersCollection } from './utils/db';
import {
  hashPassword,
  validatePassword,
  validateEmail,
} from './utils/password';
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

    // Validate email format
    if (!validateEmail(email)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid email format', 400);
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(
        'VALIDATION_ERROR',
        passwordValidation.errors.join(', '),
        400
      );
    }

    const usersCollection = await getUsersCollection();

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return errorResponse('USER_EXISTS', 'User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await usersCollection.insertOne({
      email,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
      emailVerified: false,
    });

    const userId = result.insertedId.toString();

    // Generate tokens
    const accessToken = generateAccessToken(userId, email);
    const refreshToken = generateRefreshToken(userId, email);

    // Return response with refresh token cookie
    return {
      statusCode: 201,
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
          email,
        },
        accessToken,
      }),
    };
  } catch (error) {
    console.error('Signup error:', error);
    return errorResponse(
      'SERVER_ERROR',
      'Failed to create user',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
