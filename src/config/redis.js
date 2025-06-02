import Redis from 'ioredis';
import logger from './logger.js';

const redis = new Redis({
  host: process.env.DRAGONFLY_HOST,
  port: process.env.DRAGONFLY_PORT,
});

redis.on('connect', () => {
  logger.info('Redis successfully connected', {
    host: process.env.DRAGONFLY_HOST,
    port: process.env.DRAGONFLY_PORT
  });
});

redis.on('error', (err) => {
  logger.error('Redis connection error', {
    message: err.message,
    stack: err.stack
  });
});

export default redis;
