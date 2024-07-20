const mongoose = require('mongoose');
const { run } = require('probot');
const gitbot = require('./gitbot');
const config = require('./config/config');
const logger = require('./config/logger');

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  run(gitbot, {
    env: {
      PORT: config.github.port,
      APP_ID: config.github.appId,
      PRIVATE_KEY: config.github.privateKey,
      WEBHOOK_PROXY_URL: config.github.webhookProxyUrl,
      WEBHOOK_PATH: config.github.webhookPath,
      WEBHOOK_SECRET: config.github.webhookSecret,
      NODE_ENV: config.env,
    },
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
});
