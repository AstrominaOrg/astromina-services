const mongoose = require('mongoose');
const config = require('./config/config');
const { overrideAssignee, overrideManager } = require('./services/github.service');
const logger = require('./config/logger');

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  if (process.argv[2] === '--override-assignee') {
    const username = process.argv[3];
    overrideAssignee(username);
  } else if (process.argv[2] === '--override-manager') {
    const username = process.argv[3];
    overrideManager(username);
  } else {
    logger.error('Invalid argument. Use --override-assignee or --override-manager');
  }
});
