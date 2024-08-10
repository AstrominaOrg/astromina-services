const { default: mongoose } = require('mongoose');
const config = require('./config/config');
const logger = require('./config/logger');
const dcbot = require('./dcbot');
const { getIssueByOwnerAndRepoAndIssueNumber, updateIssue } = require('./services/issue.service');

async function recoverThreads() {
  try {
    const channel = await dcbot.channels.fetch(config.discord.channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel ID or the channel is not text-based.');
    }

    const threads = await channel.threads.fetchActive();

    threads.threads.forEach(async (thread) => {
      if (thread.type === 12) {
        const match = thread.name.match(/Issue #(\d+) - (\w+)\/([\w-]+)/);

        if (match) {
          const [, issueNumber, ownerLogin, repoName] = match;

          const issue = await getIssueByOwnerAndRepoAndIssueNumber(ownerLogin, repoName, issueNumber);

          if (issue) {
            updateIssue(issue.issueId, {
              thread: {
                id: thread.id,
                name: thread.name,
              },
            });
          }

          logger.info(
            `Recovered and updated issue #${issue.number} for ${ownerLogin}/${repoName} with thread ID: ${thread.id}`
          );
        } else {
          logger.warn(`Thread name does not match expected pattern: ${thread.name}`);
        }
      }
    });
  } catch (error) {
    logger.error('Error during thread recovery:', error);
  }
}

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  dcbot.once('ready', () => {
    logger.info('Connected to Discord');
    recoverThreads();
  });
});
