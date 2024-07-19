const mongoose = require('mongoose');
const config = require('./config/config');
const { overrideAssignee, overrideManager, overrideThread } = require('./services/github.service');
const logger = require('./config/logger');

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  if (process.argv[2] === '--override-assignee') {
    const username = process.argv[3];
    overrideAssignee(username);
  } else if (process.argv[2] === '--override-manager') {
    const username = process.argv[3];
    overrideManager(username);
  } else if (process.argv[2] === '--override-thread') {
    const threadId = process.argv[3];
    const threadName = process.argv[4];
    const threadMember = process.argv[5];
    overrideThread(threadId, threadName, threadMember);
  } else {
    logger.error('Invalid argument. Use --override-assignee or --override-manager or --override-thread');
  }
});
