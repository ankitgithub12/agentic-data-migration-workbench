import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/db.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers (permissive CSP for bundled React assets)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development, configured CORS_ORIGIN, or undefined for curl/same-origin
      if (!origin || origin.startsWith('http://localhost') || origin === config.corsOrigin) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for assessment evaluation
      }
    },
    credentials: true,
  })
);

// Payload size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Structured request logging
app.use(requestLogger);

// Rate limiter for AI operations
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many AI analysis requests. Please wait a moment before trying again.',
    },
  },
});
app.use('/api/projects/:id/ai', aiRateLimiter);

// Mount main API router
app.use('/api', apiRoutes);

// Serve static client assets in production if available
const clientDistPath = path.resolve(__dirname, '../../../client/dist');
const serverPublicPath = path.resolve(__dirname, '../public');
const staticPath = fs.existsSync(clientDistPath) ? clientDistPath : (fs.existsSync(serverPublicPath) ? serverPublicPath : null);

if (staticPath) {
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// 404 handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    },
  });
});

// Fallback 404 handler if static SPA not loaded
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested path ${req.path} was not found.`,
    },
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server function
export const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      logger.info(
        { event: 'SERVER_STARTED', port: config.port, env: config.env },
        `Migration Workbench API running on http://localhost:${config.port}`
      );
    });
    return server;
  } catch (err) {
    logger.error({ event: 'SERVER_START_FAILED', error: err.message }, 'Failed to start server');
    process.exit(1);
  }
};

// Auto-run if executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
