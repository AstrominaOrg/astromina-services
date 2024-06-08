const { createOrUpdateIssue, getIssueByIssueId, updateIssueByIssueId } = require('./issue.service');
const { getOrganizationByOrgId } = require('./organization.service');
const { getRepositoryByRepoId } = require('./repository.service');

async function sendComment(context, message) {
  const params = context.issue({ body: message });
  return context.octokit.issues.createComment(params);
}

async function handleIssueCreate(context) {
  const { issue } = context.payload;
  const issueId = issue.id;

  await createOrUpdateIssue({
    issueId,
    title: issue.title,
    description: issue.body,
    assignee: issue.assignee ? issue.assignee.login : null,
    creator: context.payload.sender.login,
    state: issue.state,
  });
}

async function handleAssigneeUpdate(context) {
  const { issue } = context.payload;
  const issueId = issue.id;

  await createOrUpdateIssue({
    issueId,
    title: issue.title,
    description: issue.body,
    assignee: issue.assignee ? issue.assignee.login : null,
    state: issue.state,
  });
}

async function handleIssueClose(context) {
  const { issue } = context.payload;
  const issueId = issue.id;

  await createOrUpdateIssue({
    issueId,
    title: issue.title,
    description: issue.body,
    assignee: issue.assignee ? issue.assignee.login : null,
    state: issue.state,
  });
}

async function checkOrganizationAndRepository(context) {
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
  handlePriceCommand,
  handleAssigneeUpdate,
  checkOrganizationAndRepository,
};
