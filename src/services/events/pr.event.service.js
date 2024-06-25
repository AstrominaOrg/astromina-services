const { createOrUpdatePullRequest } = require('../pr.service');
const { getLinkedIssues } = require('../github.service');
const { wrapHandlerWithCheck } = require('./helper');
const { createOrUpdateIssue, getIssueByIssueNumberAndRepositoryId } = require('../issue.service');
const { sendThreadMessage } = require('../discord.service');
const dcbot = require('../../dcbot');

async function handlePullRequestCreate(context) {
  const { pull_request: pullRequest, repository } = context.payload;
  const linkedIssues = await getLinkedIssues(repository.name, repository.owner.login, pullRequest.number, 5);

  await createOrUpdatePullRequest({
    pullRequestId: pullRequest.node_id,
    number: pullRequest.number,
    title: pullRequest.title,
    body: pullRequest.body,
    repositoryId: repository.node_id,
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

async function handlePullRequestClose(context) {
  const { pull_request: pullRequest, repository } = context.payload;
  const linkedIssues = await getLinkedIssues(repository.name, repository.owner.login, pullRequest.number, 5);

  if (pullRequest.merged) {
    linkedIssues.repository.pullRequest.closingIssuesReferences.nodes.forEach(async (issue) => {
      const issueDB = await getIssueByIssueNumberAndRepositoryId(issue.number, repository.node_id);
      if (issueDB) {
        await createOrUpdateIssue({
          issueId: issueDB.issueId,
          solved: true,
        });

        await sendThreadMessage({
          client: dcbot,
          threadId: issueDB.thread.id,
          message: `Issue ${issue.number} has been solved by pull request [${pullRequest.title}](${pullRequest.html_url})! ${
            issueDB.price
          } to ${issueDB.assignees
            .map((assignee) => `[${assignee.login}](https://github.com/${assignee.login})`)
            .join(', ')}`,
        });
      }
    });
  }

  await createOrUpdatePullRequest({
    pullRequestId: pullRequest.node_id,
    title: pullRequest.title,
    body: pullRequest.body,
    repositoryId: repository.node_id,
    assignees: pullRequest.assignees.map((assignee) => assignee.login),
    requestedReviewers: pullRequest.requested_reviewers.map((reviewer) => reviewer.login),
    linkedIssues: linkedIssues.repository.pullRequest.closingIssuesReferences.nodes.map((issue) => issue.number),
    state: pullRequest.state,
    labels: pullRequest.labels.map((label) => label.name),
    merged: pullRequest.merged,
    commits: pullRequest.commits,
    additions: pullRequest.additions,
    deletions: pullRequest.deletions,
    changedFiles: pullRequest.changed_files,
    comments: pullRequest.comments,
    reviewComments: pullRequest.review_comments,
    maintainerCanModify: pullRequest.maintainer_can_modify,
    mergeable: pullRequest.mergeable,
    draft: pullRequest.draft,
  });
}

async function handlePullRequestReopen() {
  // TODO: Implement this function
}

module.exports = {
  handlePullRequestCreate: wrapHandlerWithCheck(handlePullRequestCreate),
  handlePullRequestEdit: wrapHandlerWithCheck(handlePullRequestEdit),
  handlePullRequestClose: wrapHandlerWithCheck(handlePullRequestClose),
  handlePullRequestReopen: wrapHandlerWithCheck(handlePullRequestReopen),
};
