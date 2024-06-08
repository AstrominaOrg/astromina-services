const {
  handleIssueCreate,
  handleAssigneeUpdate,
  handleIssueClose,
  checkOrganizationAndRepository,
  handlePriceCommand,
} = require('./services/gitbot.service');

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

module.exports = (app) => {
  app.log.info('Probot app is running!');

  app.on('issues.opened', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleIssueCreate(context);
    }
  });

  app.on('issues.assigned', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleAssigneeUpdate(context);
    }
  });

  // app.on('issues.opened', async () => {});
  // app.on('issues.closed', async () => {});
  // app.on('issues.deleted', async () => {});
  // app.on('issues.edited', async () => {});
  // app.on('issues.reopened', async () => {});
  // app.on('issues.transferred', async () => {});
  // app.on('issues.labeled', async () => {});
  // app.on('issues.unlabeled', async () => {});
  // app.on('issues.milestoned', async () => {});
  // app.on('issues.demilestoned', async () => {});
  // app.on('issues.locked', async () => {});
  // app.on('issues.unlocked', async () => {});
  // app.on('issues.pinned', async () => {});
  // app.on('issues.unpinned', async () => {});
  // app.on('issues.unassigned', async () => {});
  // app.on('issues.assigned', async () => {});
  // app.on('issues.transferred', async () => {});

  app.on('issues.closed', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleIssueClose(context);
    }
  });

  app.on('issue_comment.created', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handlePriceCommand(context);
    }
  });
};
