import { logger } from '../config/logger.js';
import crypto from 'crypto';

export const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(
      {
        requestId,
        method: req.method,
        route: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
      `${req.method} ${req.originalUrl} completed with ${res.statusCode} in ${duration}ms`
    );
  });

  next();
};
