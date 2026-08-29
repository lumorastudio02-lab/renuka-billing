import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';

export function errorHandler(err, req, res, next) {
  let { statusCode, message, errors } = err;

  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || 'Internal Server Error';
    errors = err.errors || [];
  }

  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    stack: err.stack,
    errors,
  });

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    statusCode,
  });
}
