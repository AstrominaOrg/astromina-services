const {
  IssueEventService,
  OrganizationEventService,
  PullRequestEventService,
  RepositoryEventService,
} = require('./services/events');
/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

module.exports = (app) => {
  app.log.info('Probot app is running!');

  app.onAny(async (context) => {
    app.log.info(`Event: ${context.payload.action}`);
  });

  const handleError = async (context, handler) => {
    try {
      await handler(context);
    } catch (error) {
      app.log.error(`Error handling event: ${context.event}.${context.payload.action} - ${error.message} - ${error.stack}`);
    }
  };

  /*
  ISSUE EVENT HANDLERS
  */

  app.on('issues.opened', async (context) => {
    handleError(context, IssueEventService.handleIssueCreate);
  });

  app.on(
    ['issues.closed', 'issues.deleted', 'issues.edited', 'issues.deleted', 'issues.labeled', 'issues.unlabeled'],
    async (context) => {
      handleError(context, IssueEventService.handleIssueChange);
    }
  );

  app.on('issues.transferred', async (context) => {
    handleError(context, IssueEventService.handleIssueTransfer);
  });

  app.on('issues.assigned', async (context) => {
    handleError(context, IssueEventService.handleAssigned);
  });

  app.on('issues.unassigned', async (context) => {
    handleError(context, IssueEventService.handleUnassigned);
  });

  app.on('issue_comment.created', async (context) => {
    handleError(context, IssueEventService.handlePriceCommand);
  });

  /*
  ORGANIZATION EVENT HANDLERS
  */

  app.on('organization.member_added', async (context) => {
    handleError(context, OrganizationEventService.handleMemberChange);
  });

  app.on('organization.member_removed', async (context) => {
    handleError(context, OrganizationEventService.handleMemberChange);
  });

  /*
  REPOSITORY EVENT HANDLERS
  */

  app.on(['star.created', 'star.deleted'], async (context) => {
    handleError(context, RepositoryEventService.handleStar);
  });

  app.on('installation.created', async (context) => {
    const { repositories } = context.payload;

    repositories.forEach((repository) => {
      context.payload.repository = repository;
      handleError(context, RepositoryEventService.handleRepositoryAdd);
    });
  });

  app.on('installation_repositories.added', async (context) => {
    const repositories = context.payload.repositories_added;

    repositories.forEach((repository) => {
      context.payload.repository = repository;
      handleError(context, RepositoryEventService.handleRepositoryAdd);
    });
  });

  app.on('installation_repositories.removed', async (context) => {
    const repositories = context.payload.repositories_removed;

    repositories.forEach((repository) => {
      context.payload.repository = repository;
      handleError(context, RepositoryEventService.handleRepositoryRemove);
    });
  });

  /*
  PULL REQUEST EVENTS
  */

  app.on(['pull_request.opened', 'pull_request.reopened', 'pull_request.edited'], async (context) => {
    handleError(context, PullRequestEventService.handlePullRequestCreate);
  });

  app.on('pull_request.closed', async (context) => {
    handleError(context, PullRequestEventService.handlePullRequestClose);
  });

  /*
  ERROR HANDLING
  */
  // Error handler function

  const exitHandler = () => {
    app.log.info('Exiting...');
    process.exit(1);
  };

  // Global error handlers
  process.on('uncaughtException', (error) => {
    app.log.error(`UNCAUGHT EXCEPTION: ${error.message}`);
    exitHandler();
  });

  process.on('unhandledRejection', (error) => {
    app.log.error(`UNHANDLED REJECTION: ${error.message}`);
    exitHandler();
  });

  process.on('SIGTERM', () => {
    app.log.info('SIGTERM received');
    exitHandler();
  });
};
