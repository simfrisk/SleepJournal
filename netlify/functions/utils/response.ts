import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export interface SuccessResponse {
  success: true;
  [key: string]: any;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse = SuccessResponse | ErrorResponse;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

export function successResponse(data: any, statusCode: number = 200) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: true,
      ...data,
    }),
  };
}

export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: {
        code,
        message,
        ...(process.env.NODE_ENV !== 'production' && details ? { details } : {}),
      },
    }),
  };
}

export function handleCors(event: HandlerEvent) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }
  return null;
}

export function parseBody(event: HandlerEvent) {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

export function getQueryParams(event: HandlerEvent) {
  return event.queryStringParameters || {};
}
