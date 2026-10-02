import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  // Capture stack trace server-side with structured logging
  logger.error(
    {
      requestId: req.id || req.headers['x-request-id'],
      route: req.originalUrl,
      method: req.method,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack,
    },
    'Request error caught in global error handler'
  );

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Handle explicit status errors
  const statusCode = err.status || err.statusCode || (err.message.includes('not found') ? 404 : 400);
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST');

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred.',
    },
  });
};
