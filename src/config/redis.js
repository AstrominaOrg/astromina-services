const redis = require('redis');
const logger = require('./logger');
const config = require('./config');

const client = redis.createClient({
  url: `redis://${config.redis.host}:${config.redis.port}`,
});

client.connect();

client.on('error', (err) => {
  logger.error(`Redis error: ${JSON.stringify(err, null, 2)}`);
});

client.on('connect', () => {
  logger.info('Redis connected');
});

const set = async (key, value, duration) => {
  await client.setEx(key, duration, JSON.stringify(value));
};

const get = async (key) => {
  if (!client) {
    return null;
  }

  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

module.exports = {
  client,
  set,
  get,
};
