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

  /*
  ISSUE EVENT HANDLERS
  */

  app.on('issues.opened', async (context) => {
    IssueEventService.handleIssueCreate(context);
  });

  app.on(
    ['issues.closed', 'issues.deleted', 'issues.edited', 'issues.deleted', 'issues.labeled', 'issues.unlabeled'],
    async (context) => {
      IssueEventService.handleIssueChange(context);
    }
  );

  app.on('issues.transferred', async (context) => {
    IssueEventService.handleIssueTransfer(context);
  });

  app.on('issues.assigned', async (context) => {
    await IssueEventService.handleAssigned(context);
  });

  app.on('issues.unassigned', async (context) => {
    IssueEventService.handleUnassigned(context);
  });

  app.on('issue_comment.created', async (context) => {
    IssueEventService.handlePriceCommand(context);
  });

  /*
  ORGANIZATION EVENT HANDLERS
  */

  app.on('organization.member_added', async (context) => {
    OrganizationEventService.handleMemberChange(context);
  });

  app.on('organization.member_removed', async (context) => {
    OrganizationEventService.handleMemberChange(context);
  });

  /*
  REPOSITORY EVENT HANDLERS
  */

  app.on(['star.created', 'star.deleted'], async (context) => {
    RepositoryEventService.handleStar(context);
  });

  app.on('installation.created', async (context) => {
    const { repositories } = context.payload;

    repositories.forEach((repository) => {
      context.payload.repository = repository;
      RepositoryEventService.handleRepositoryAdd(context);
    });
  });

  app.on('installation_repositories.added', async (context) => {
    const repositories = context.payload.repositories_added;

    repositories.forEach((repository) => {
      context.payload.repository = repository;
      RepositoryEventService.handleRepositoryAdd(context);
    });
  });

  app.on('installation_repositories.removed', async (context) => {
    const repositories = context.payload.repositories_removed;

    repositories.forEach((repository) => {
      context.payload.repository = repository;
      RepositoryEventService.handleRepositoryRemove(context);
    });
  });

  /*
  PULL REQUEST EVENTS
  */

  app.on(['pull_request.opened', 'pull_request.reopened', 'pull_request.edited'], async (context) => {
    PullRequestEventService.handlePullRequestCreate(context);
  });

  app.on('pull_request.closed', async (context) => {
    PullRequestEventService.handlePullRequestClose(context);
  });
};
