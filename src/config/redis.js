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

module.exports = client;
