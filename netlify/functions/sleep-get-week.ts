import { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import {
  successResponse,
  errorResponse,
  handleCors,
  getQueryParams,
} from './utils/response';
import { getSleepWeeksCollection } from './utils/db';
import { requireAuth, AuthenticatedEvent } from './utils/auth-middleware';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'GET') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  try {
    // Authenticate request
    const user = requireAuth(event as AuthenticatedEvent);

    const { year, week } = getQueryParams(event);

    // Validate input
    if (!year || !week) {
      return errorResponse(
        'VALIDATION_ERROR',
        'year and week query parameters are required',
        400
      );
    }

    const yearNum = parseInt(year);
    const weekNum = parseInt(week);

    if (isNaN(yearNum) || isNaN(weekNum)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'year and week must be valid numbers',
        400
      );
    }

    const sleepWeeksCollection = await getSleepWeeksCollection();

    // Find week data
    const weekData = await sleepWeeksCollection.findOne({
      userId: new ObjectId(user.userId),
      year: yearNum,
      weekNumber: weekNum,
    });

    if (!weekData) {
      // Return empty week data structure
      return successResponse({
        data: {
          year: yearNum,
          weekNumber: weekNum,
          weekStartDate: '',
          weekData: [],
        },
      });
    }

    return successResponse({
      data: {
        year: weekData.year,
        weekNumber: weekData.weekNumber,
        weekStartDate: weekData.weekStartDate,
        weekData: weekData.weekData,
      },
    });
  } catch (error) {
    // Check if it's an auth error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return error;
    }

    console.error('Get week error:', error);
    return errorResponse(
      'SERVER_ERROR',
      'Failed to retrieve week data',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
