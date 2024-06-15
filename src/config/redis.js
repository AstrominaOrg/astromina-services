const redis = require('redis');
const logger = require('./logger');
const config = require('./config');

const client = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
});

client.connect();

client.on('error', (err) => {
  logger.error(err);
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
