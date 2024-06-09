const { createOrUpdateIssue, getIssueByIssueId, updateIssueByIssueId, deleteIssueByIssueId } = require('./issue.service');
const { getOrganizationByOrgId } = require('./organization.service');
const { getRepositoryByRepoId, createOrUpdateRepository } = require('./repository.service');

async function sendComment(context, message) {
  const params = context.issue({ body: message });
  return context.octokit.issues.createComment(params);
}

async function handleIssueCreate(context) {
  const { issue, repository } = context.payload;
  const repo = await getRepositoryByRepoId(repository.id);
  const issueId = issue.id;

  await createOrUpdateIssue({
    issueId,
    title: issue.title,
    description: issue.body,
    assignees: issue.assignees.map((assignee) => assignee.login),
    repository: repo,
    creator: context.payload.sender.login,
    labels: issue.labels.map((label) => label.name),
    state: issue.state,
  });
}

async function handleAssigneeUpdate(context) {
  const { issue } = context.payload;
  const issueId = issue.id;

  await createOrUpdateIssue({
    issueId,
    assignees: issue.assignees.map((assignee) => assignee.login),
  });
}

async function handleIssueClose(context) {
  const { issue } = context.payload;
  const issueId = issue.id;

  await createOrUpdateIssue({
    issueId,
    state: issue.state,
  });
}

async function handleIssueLabel(context) {
  const { issue } = context.payload;
  const issueId = issue.id;

  await createOrUpdateIssue({
    issueId,
    labels: issue.labels.map((label) => label.name),
  });
}

async function handleIssueTransfer(context) {
  const { issue } = context.payload;
  const issueId = issue.id;

  await deleteIssueByIssueId(issueId);
}

async function handleIssueReopen(context) {
  const { issue } = context.payload;
  const issueId = issue.id;

  await createOrUpdateIssue({
    issueId,
    state: issue.state,
  });
}

async function handleIssueEdit(context) {
  const { issue } = context.payload;
  const issueId = issue.id;

  await createOrUpdateIssue({
    issueId,
    title: issue.title,
    description: issue.body,
    assignees: issue.assignees.map((assignee) => assignee.login),
    labels: issue.labels.map((label) => label.name),
    state: issue.state,
  });
}

async function handleIssueDelete(context) {
  const { issue } = context.payload;
  const issueId = issue.id;

  await createOrUpdateIssue({
    issueId,
    state: issue.state,
  });
}

async function handleRepositoryAdd(context) {
  const { repositories_added: repositories, installation } = context.payload;

  // eslint-disable-next-line no-restricted-syntax
  for (const repository of repositories) {
    // eslint-disable-next-line no-await-in-loop
    await createOrUpdateRepository({
      repositoryId: repository.id,
      name: repository.name,
      full_name: repository.full_name,
      owner: installation.account.login,
      type: 'Organization',
      state: 'accepted',
    });
  }
}

async function handleRepositoryRemove(context) {
  const { repositories_removed: repositories, installation } = context.payload;

  // eslint-disable-next-line no-restricted-syntax
  for (const repository of repositories) {
    // eslint-disable-next-line no-await-in-loop
    await createOrUpdateRepository({
      repositoryId: repository.id,
      name: repository.name,
      full_name: repository.full_name,
      owner: installation.account.login,
      type: 'Organization',
      state: 'deleted',
    });
  }
}

async function checkOrganizationAndRepository(context, type = 'issue') {
  if (type === 'issue') {
    if (context.payload.repository.owner.type !== 'Organization') {
      const repositoryId = context.payload.repository.id;
      const repository = await getRepositoryByRepoId(repositoryId);

      if (!repository || repository.state !== 'accepted') {
        return false;
      }

      return true;
    }
    const organizationId = context.payload.organization.id;

    const organization = await getOrganizationByOrgId(organizationId);

    if (!organization || organization.state !== 'accepted') {
      return false;
    }

    return true;
  }

  if (type === 'installation') {
    const organizationId = context.payload.installation.account.id;

    const organization = await getOrganizationByOrgId(organizationId);

    if (!organization || organization.state !== 'accepted') {
      return false;
    }

    return true;
  }

  return false;
}

async function handlePriceCommand(context) {
  const { comment } = context.payload;

  if (!comment.body.startsWith('/price')) {
    return;
  }
  const price = comment.body.split(' ')[1];
  const issueId = context.payload.issue.id;
  const sender = context.payload.sender.login;
  const issue = await getIssueByIssueId(issueId);

  if (issue.creator !== sender) {
    await sendComment(context, 'You are not allowed to update the price');
    return;
  }

  await updateIssueByIssueId(issueId, { price });
  await sendComment(context, `Price has been updated to $${price}`);
}

module.exports = {
  handleIssueClose,
  handleIssueCreate,
  handleIssueDelete,
  handleIssueEdit,
  handleIssueLabel,
  handleIssueTransfer,
  handleIssueReopen,
  handlePriceCommand,
  handleAssigneeUpdate,
  handleRepositoryAdd,
  handleRepositoryRemove,
  checkOrganizationAndRepository,
};
