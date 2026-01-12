import { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import {
  successResponse,
  errorResponse,
  handleCors,
  parseBody,
} from './utils/response';
import { getSleepWeeksCollection } from './utils/db';
import { requireAuth, AuthenticatedEvent } from './utils/auth-middleware';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  try {
    // Authenticate request
    const user = requireAuth(event as AuthenticatedEvent);

    const { year, weekNumber, weekStartDate, weekData } = parseBody(event);

    // Validate input
    if (!year || !weekNumber || !weekStartDate || !weekData) {
      return errorResponse(
        'VALIDATION_ERROR',
        'year, weekNumber, weekStartDate, and weekData are required',
        400
      );
    }

    if (!Array.isArray(weekData) || weekData.length !== 7) {
      return errorResponse(
        'VALIDATION_ERROR',
        'weekData must be an array of 7 days',
        400
      );
    }

    const sleepWeeksCollection = await getSleepWeeksCollection();

    // Upsert week data (create or update)
    const result = await sleepWeeksCollection.updateOne(
      {
        userId: new ObjectId(user.userId),
        year,
        weekNumber,
      },
      {
        $set: {
          weekStartDate,
          weekData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId: new ObjectId(user.userId),
          year,
          weekNumber,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return successResponse(
      {
        message: 'Week data saved successfully',
        weekId: result.upsertedId?.toString() || 'updated',
      },
      200
    );
  } catch (error) {
    // Check if it's an auth error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return error;
    }

    console.error('Save week error:', error);
    return errorResponse(
      'SERVER_ERROR',
      'Failed to save week data',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
