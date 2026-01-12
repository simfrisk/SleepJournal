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

    const { year } = getQueryParams(event);

    const sleepWeeksCollection = await getSleepWeeksCollection();

    // Build query
    const query: any = { userId: new ObjectId(user.userId) };

    // If year is provided, filter by year
    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum)) {
        return errorResponse('VALIDATION_ERROR', 'year must be a valid number', 400);
      }
      query.year = yearNum;
    }

    // Find all weeks for user (optionally filtered by year)
    const weeks = await sleepWeeksCollection
      .find(query)
      .sort({ year: -1, weekNumber: -1 }) // Most recent first
      .toArray();

    return successResponse({
      weeks: weeks.map(week => ({
        year: week.year,
        weekNumber: week.weekNumber,
        weekStartDate: week.weekStartDate,
        weekData: week.weekData,
      })),
    });
  } catch (error) {
    // Check if it's an auth error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return error;
    }

    console.error('Get all weeks error:', error);
    return errorResponse(
      'SERVER_ERROR',
      'Failed to retrieve weeks data',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
