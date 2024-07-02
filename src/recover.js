const mongoose = require('mongoose');
const config = require('./config/config');
const logger = require('./config/logger');
const { recoverOrganization } = require('./services/github.service');

const organization = process.argv[2];
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  recoverOrganization(organization);
});
