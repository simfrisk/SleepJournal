import { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import {
  successResponse,
  errorResponse,
  handleCors,
} from './utils/response';
import { getUserSettingsCollection } from './utils/db';
import { requireAuth, AuthenticatedEvent } from './utils/auth-middleware';

// Default settings
const DEFAULT_SETTINGS = {
  targetSchedule: {
    bedTime: '',
    riseTime: '',
  },
  theme: 'light',
  viewMode: 'week',
  selectedDay: 0,
};

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

    const settingsCollection = await getUserSettingsCollection();

    // Find user settings
    const settings = await settingsCollection.findOne({
      userId: new ObjectId(user.userId),
    });

    if (!settings) {
      // Return default settings if none exist
      return successResponse({
        settings: DEFAULT_SETTINGS,
      });
    }

    return successResponse({
      settings: {
        targetSchedule: settings.targetSchedule || DEFAULT_SETTINGS.targetSchedule,
        theme: settings.theme || DEFAULT_SETTINGS.theme,
        viewMode: settings.viewMode || DEFAULT_SETTINGS.viewMode,
        selectedDay: settings.selectedDay ?? DEFAULT_SETTINGS.selectedDay,
      },
    });
  } catch (error) {
    // Check if it's an auth error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return error;
    }

    console.error('Get settings error:', error);
    return errorResponse(
      'SERVER_ERROR',
      'Failed to retrieve settings',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
