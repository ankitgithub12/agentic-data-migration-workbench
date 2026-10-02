import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or server
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/migration_workbench',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL || 'info',
  llm: {
    provider: process.env.LLM_PROVIDER || 'gemini',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gemini-1.5-flash',
    baseUrl: process.env.LLM_BASE_URL || '',
  },
  maxSampleSize: 1000,
};
