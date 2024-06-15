const {
  handleIssueCreate,
  handleIssueClose,
  handleIssueDelete,
  handleIssueEdit,
  handleIssueReopen,
  handleIssueTransfer,
  handleIssueLabel,
  handleRepositoryAdd,
  checkOrganizationAndRepository,
  handlePriceCommand,
  handleRepositoryRemove,
  handlePullRequestCreate,
  handleAssigned,
  handleUnassigned,
} = require('./services/gitbot.service');

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

module.exports = (app) => {
  app.log.info('Probot app is running!');

  /*
  ISSUE EVENTS
  */

  app.onAny(async (context) => {
    app.log.info(`Event: ${context.payload.action}`);
  });

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

  app.on('issues.assigned', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleAssigned(context);
    }
  });

  app.on('issues.unassigned', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handleUnassigned(context);
    }
  });

  app.on('issue_comment.created', async (context) => {
    if (await checkOrganizationAndRepository(context)) {
      handlePriceCommand(context);
    }
  });

  /*
  REPOSITORY EVENTS
  */

  app.on('installation_repositories.added', async (context) => {
    if (await checkOrganizationAndRepository(context, 'installation')) {
      handleRepositoryAdd(context);
    }
  });

  app.on('installation_repositories.removed', async (context) => {
    if (await checkOrganizationAndRepository(context, 'installation')) {
      handleRepositoryRemove(context);
    }
  });

  /*
  PULL REQUEST EVENTS
  */

  app.on(['pull_request.opened', 'pull_request.reopened', 'pull_request.edited'], async (context) => {
    app.log.info('Pull request opened');
    if (await checkOrganizationAndRepository(context)) {
      handlePullRequestCreate(context);
    }
  });
};
