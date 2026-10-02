import pino from 'pino';
import { config } from './env.js';

const isDev = config.env === 'development';

export const logger = pino({
  level: config.logLevel,
  redact: [
    'req.headers.authorization',
    'req.headers["x-api-key"]',
    'password',
    'apiKey',
    'token',
    'LLM_API_KEY'
  ],
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'migration-workbench',
    env: config.env,
  },
});
