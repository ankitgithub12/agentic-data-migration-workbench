import { getDBStatus } from '../config/db.js';

export const getHealth = (req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus.status === 'connected';

  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'ok' : 'degraded',
    database: dbStatus.status,
    databaseMode: dbStatus.isMemory ? 'in-memory-embedded' : 'mongodb-standalone',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};
