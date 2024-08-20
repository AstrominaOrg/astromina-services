const {
  IssueEventService,
  OrganizationEventService,
  PullRequestEventService,
  RepositoryEventService,
} = require('./services/events');
const { recoverOrganization } = require('./services/github.service');
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

  app.on(['issues.closed', 'issues.edited', 'issues.labeled', 'issues.unlabeled', 'issues.reopened'], async (context) => {
    handleError(context, IssueEventService.handleIssueChange);
  });

  app.on('issues.deleted', async (context) => {
    handleError(context, IssueEventService.handleIssueDeleted);
  });

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

  app.on('member.added', async (context) => {
    handleError(context, RepositoryEventService.handleMemberAdded);
  });

  app.on('member.removed', async (context) => {
    handleError(context, RepositoryEventService.handleMemberRemoved);
  });

  app.on(['repository.privatized', 'repository.publicized'], async (context) => {
    handleError(context, RepositoryEventService.handleVisibilityChange);
  });

  app.on('installation.created', async (context) => {
    const { repositories } = context.payload;

    repositories.forEach((repository) => {
      context.payload.repository = repository;
      handleError(context, RepositoryEventService.handleRepositoryAdd);
    });

    try {
      recoverOrganization(context.payload.installation.account.login);
    } catch (error) {
      app.log.error(`Error recovering organization: ${error.message} - ${error.stack}`);
    }
  });

  app.on('installation_repositories.added', async (context) => {
    const repositories = context.payload.repositories_added;

    repositories.forEach((repository) => {
      context.payload.repository = repository;
      handleError(context, RepositoryEventService.handleRepositoryAdd);
    });

    try {
      recoverOrganization(context.payload.installation.account.login);
    } catch (error) {
      app.log.error(`Error recovering organization: ${error.message} - ${error.stack}`);
    }
  });

  app.on('installation_repositories.removed', async (context) => {
    const repositories = context.payload.repositories_removed;

    repositories.forEach((repository) => {
      context.payload.repository = repository;
      handleError(context, RepositoryEventService.handleRepositoryRemove);
    });
    try {
      recoverOrganization(context.payload.installation.account.login);
    } catch (error) {
      app.log.error(`Error recovering organization: ${error.message} - ${error.stack}`);
    }
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
};
