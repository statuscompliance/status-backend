import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.DRAGONFLY_HOST,
  port: process.env.DRAGONFLY_PORT,
});


redis.on('connect', () => {
  console.log('[redis] Successfully connected');
});

redis.on('error', (err) => {
  console.log('[redis] error', err);
});

export default redis;
