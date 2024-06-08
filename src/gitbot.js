const {
  handleIssueCreate,
  handleAssigneeUpdate,
  handleIssueClose,
  handleIssueDelete,
  handleIssueEdit,
  handleIssueReopen,
  handleIssueTransfer,
  handleIssueLabel,
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

  app.on('issues.closed', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleIssueClose(context);
    }
  });

  app.on('issues.deleted', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleIssueDelete(context);
    }
  });

  app.on('issues.edited', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleIssueEdit(context);
    }
  });

  app.on('issues.reopened', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleIssueReopen(context);
    }
  });

  app.on('issues.transferred', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleIssueTransfer(context);
    }
  });

  app.on(['issues.labeled', 'issues.unlabeled'], async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleIssueLabel(context);
    }
  });

  app.on(['issues.assigned', 'issues.unassigned'], async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleAssigneeUpdate(context);
    }
  });

  app.on('issue_comment.created', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handlePriceCommand(context);
    }
  });
};