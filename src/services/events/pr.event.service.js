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
    url: pullRequest.html_url,
    repository: {
      id: repository.node_id,
      name: repository.name,
    },
    assignees: pullRequest.assignees.map((assignee) => {
      return {
        login: assignee.login,
        avatar_url: assignee.avatar_url,
      };
    }),
    requestedReviewers: pullRequest.requested_reviewers.map((reviewer) => {
      return {
        login: reviewer.login,
        avatar_url: reviewer.avatar_url,
      };
    }),
    linkedIssues: linkedIssues.repository.pullRequest.closingIssuesReferences.nodes.map((issue) => issue.number),
    state: pullRequest.state,
    labels: pullRequest.labels.map((label) => label.name),
    creator: {
      login: pullRequest.user.login,
      avatar_url: pullRequest.user.avatar_url,
    },
    merged: pullRequest.merged,
    commits: pullRequest.commits,
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
    repository: {
      id: repository.node_id,
      name: repository.name,
    },
    assignees: pullRequest.assignees.map((assignee) => {
      return {
        login: assignee.login,
        avatar_url: assignee.avatar_url,
      };
    }),
    requestedReviewers: pullRequest.requested_reviewers.map((reviewer) => {
      return {
        login: reviewer.login,
        avatar_url: reviewer.avatar_url,
      };
    }),
    url: pullRequest.html_url,
    linkedIssues: linkedIssues.repository.pullRequest.closingIssuesReferences.nodes.map((issue) => issue.number),
    state: pullRequest.state,
    labels: pullRequest.labels.map((label) => label.name),
    merged: pullRequest.merged,
    commits: pullRequest.commits,
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
