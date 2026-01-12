import { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import {
  successResponse,
  errorResponse,
  handleCors,
  parseBody,
} from './utils/response';
import { getUserSettingsCollection } from './utils/db';
import { requireAuth, AuthenticatedEvent } from './utils/auth-middleware';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'PUT') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  try {
    // Authenticate request
    const user = requireAuth(event as AuthenticatedEvent);

    const body = parseBody(event);
    const { targetSchedule, theme, viewMode, selectedDay } = body;

    // Build update object with only provided fields
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (targetSchedule !== undefined) {
      updateFields.targetSchedule = targetSchedule;
    }

    if (theme !== undefined) {
      // Validate theme
      if (!['light', 'dark'].includes(theme)) {
        return errorResponse(
          'VALIDATION_ERROR',
          'theme must be either "light" or "dark"',
          400
        );
      }
      updateFields.theme = theme;
    }

    if (viewMode !== undefined) {
      // Validate viewMode
      if (!['week', 'day', 'analytics'].includes(viewMode)) {
        return errorResponse(
          'VALIDATION_ERROR',
          'viewMode must be "week", "day", or "analytics"',
          400
        );
      }
      updateFields.viewMode = viewMode;
    }

    if (selectedDay !== undefined) {
      // Validate selectedDay
      const dayNum = parseInt(selectedDay);
      if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
        return errorResponse(
          'VALIDATION_ERROR',
          'selectedDay must be a number between 0 and 6',
          400
        );
      }
      updateFields.selectedDay = dayNum;
    }

    const settingsCollection = await getUserSettingsCollection();

    // Upsert settings (create or update)
    const result = await settingsCollection.updateOne(
      { userId: new ObjectId(user.userId) },
      {
        $set: updateFields,
        $setOnInsert: {
          userId: new ObjectId(user.userId),
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Fetch updated settings
    const updatedSettings = await settingsCollection.findOne({
      userId: new ObjectId(user.userId),
    });

    return successResponse({
      message: 'Settings updated successfully',
      settings: {
        targetSchedule: updatedSettings?.targetSchedule || { bedTime: '', riseTime: '' },
        theme: updatedSettings?.theme || 'light',
        viewMode: updatedSettings?.viewMode || 'week',
        selectedDay: updatedSettings?.selectedDay ?? 0,
      },
    });
  } catch (error) {
    // Check if it's an auth error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return error;
    }

    console.error('Update settings error:', error);
    return errorResponse(
      'SERVER_ERROR',
      'Failed to update settings',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
