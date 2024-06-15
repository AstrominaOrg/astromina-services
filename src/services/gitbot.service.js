const { createOrUpdateIssue, getIssueByIssueId, updateIssueByIssueId, deleteIssueByIssueId } = require('./issue.service');
const { getOrganizationByOrgId } = require('./organization.service');
const { getRepositoryByRepoId, createOrUpdateRepository } = require('./repository.service');
const { createOrUpdatePullRequest } = require('./pr.service');
const { getLinkedIssues } = require('./graphql.service');
const { createPrivateThread, addThreadMember, removeThreadMember, sendThreadMessage } = require('./discord.service');
const config = require('../config/config');
const dcbot = require('../dcbot');
const { getUserByGithubId } = require('./user.service');

async function sendComment(context, message) {
  const params = context.issue({ body: message });
  return context.octokit.issues.createComment(params);
}

async function handleIssueCreate(context) {
  const { issue, repository } = context.payload;

  await createOrUpdateIssue({
    issueId: issue.id,
    number: issue.number,
    title: issue.title,
    description: issue.body,
    assignees: issue.assignees.map((assignee) => assignee.login),
    repositoryId: repository.id,
    creator: issue.user.login,
    labels: issue.labels.map((label) => label.name),
    state: issue.state,
  });
}

async function handleAssigned(context) {
  const { issue, assignee } = context.payload;

  const user = await getUserByGithubId(assignee.id);

  if (user && user.discord && user.discord.id !== null) {
    const discordId = user.discord.id;
    const userDB = await getIssueByIssueId(issue.id);

    if (userDB && userDB.thread && userDB.thread.id) {
      await addThreadMember({ client: dcbot, threadId: userDB.thread.id, userId: discordId });
    }
  }
  await createOrUpdateIssue({
    issueId: issue.id,
    assignees: issue.assignees.map((dev) => dev.login),
  });
}

async function handleUnassigned(context) {
  const { issue, assignee } = context.payload;

  const user = await getUserByGithubId(assignee.id);

  if (user && user.discord && user.discord.id) {
    const discordId = user.discord.id;
    const userDB = await getIssueByIssueId(issue.id);

    if (userDB && userDB.thread && userDB.thread.id) {
      await removeThreadMember({ client: dcbot, threadId: userDB.thread.id, userId: discordId });
    }

    await createOrUpdateIssue({
      issueId: issue.id,
      assignees: issue.assignees.map((dev) => dev.login),
    });
  }
}

async function handleIssueClose(context) {
  const { issue } = context.payload;

  await createOrUpdateIssue({
    issueId: issue.id,
    state: issue.state,
  });
}

async function handleIssueLabel(context) {
  const { issue } = context.payload;

  await createOrUpdateIssue({
    issueId: issue.id,
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

  await createOrUpdateIssue({
    issueId: issue.id,
    state: issue.state,
  });
}

async function handleIssueEdit(context) {
  const { issue } = context.payload;

  await createOrUpdateIssue({
    issueId: issue.id,
    title: issue.title,
    description: issue.body,
    assignees: issue.assignees.map((assignee) => assignee.login),
    labels: issue.labels.map((label) => label.name),
    state: issue.state,
  });
}

async function handleIssueDelete(context) {
  const { issue } = context.payload;

  await createOrUpdateIssue({
    issueId: issue.id,
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

async function handlePullRequestCreate(context) {
  const { pull_request: pullRequest, repository } = context.payload;
  const linkedIssues = await getLinkedIssues(repository.name, repository.owner.login, pullRequest.number, 5);

  await createOrUpdatePullRequest({
    pullRequestId: pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    body: pullRequest.body,
    repositoryId: repository.id,
    assignees: pullRequest.assignees.map((assignee) => assignee.login),
    requestedReviewers: pullRequest.requested_reviewers.map((reviewer) => reviewer.login),
    linkedIssues: linkedIssues.repository.pullRequest.closingIssuesReferences.nodes.map((issue) => issue.number),
    state: pullRequest.state,
    labels: pullRequest.labels.map((label) => label.name),
    creator: pullRequest.user.login,
    merged: pullRequest.merged,
    commits: pullRequest.commits,
    additions: pullRequest.additions,
    deletions: pullRequest.deletions,
    changedFiles: pullRequest.changed_files,
    comments: pullRequest.comments,
    reviewComments: pullRequest.review_comments,
    maintainerCanModify: pullRequest.maintainer_can_modify,
    mergeable: pullRequest.mergeable,
    authorAssociation: pullRequest.author_association,
    draft: pullRequest.draft,
  });
}

async function handlePullRequestEdit() {
  // TODO: Implement this function
}

async function handlePullRequestClose() {
  // TODO: Implement this function
}

async function handlePullRequestReopen() {
  // TODO: Implement this function
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
  // await sendComment(context, `Price has been updated to $${price}`);
  const userDB = await getIssueByIssueId(issueId);
  let thread;

  if (userDB && userDB.thread && userDB.thread.id) {
    thread = userDB.thread;
    await sendThreadMessage({
      client: dcbot,
      threadId: thread.id,
      message: `Price has been updated to $${price}`,
    });
  } else {
    thread = await createPrivateThread({
      client: dcbot,
      channelId: config.discord.channelId,
      threadName: `Issue #${issue.number}`,
      initialMessage: `The issue #${issue.number} now marked as bounty with $${price} bounty. Assignees will be added to this thread when they are assigned to the issue.`,
      ids: [],
      reason: 'Issue marked as bounty',
    });
  }

  await updateIssueByIssueId(issueId, {
    thread: {
      id: thread.id,
      name: thread.name,
      members: [],
    },
  });
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
  handleAssigned,
  handleUnassigned,
  handleRepositoryAdd,
  handleRepositoryRemove,
  handlePullRequestCreate,
  handlePullRequestEdit,
  handlePullRequestClose,
  handlePullRequestReopen,
  checkOrganizationAndRepository,
};
