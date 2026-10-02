import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env.js';
import { logger } from './logger.js';

let mongodInstance = null;

export const connectDB = async () => {
  try {
    // Attempt connecting to configured MONGODB_URI with 2s timeout
    logger.info({ event: 'DB_CONNECTING', uri: config.mongodbUri.replace(/:([^:@]{1,})@/, ':****@') }, 'Attempting MongoDB connection...');
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 2500,
    });
    logger.info({ event: 'DB_CONNECTED', mode: 'standalone' }, 'Connected to MongoDB');
  } catch (err) {
    logger.warn({ event: 'DB_STANDALONE_FAILED', message: err.message }, 'Failed connecting to standalone MongoDB. Initializing in-memory Mongo server for zero-config operation...');
    try {
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      logger.info({ event: 'DB_CONNECTED', mode: 'in-memory', uri: memoryUri }, 'Connected to in-memory MongoDB server successfully');
    } catch (memErr) {
      logger.error({ event: 'DB_CONNECTION_FATAL', error: memErr.message }, 'Could not initialize in-memory MongoDB');
      throw memErr;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    logger.info({ event: 'DB_DISCONNECTED' }, 'MongoDB disconnected');
  } catch (err) {
    logger.error({ event: 'DB_DISCONNECT_ERROR', error: err.message }, 'Error disconnecting MongoDB');
  }
};

export const getDBStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] || 'unknown';
  return {
    status: state === 'connected' ? 'connected' : 'unavailable',
    state,
    isMemory: Boolean(mongodInstance),
  };
};
