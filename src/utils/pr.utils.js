const { createOrUpdatePullRequest } = require('../services/pr.service');

const savePullRequest = async (pullRequest, repository, linkedIssues) => {
  const pullRequestData = {
    pullRequestId: pullRequest.node_id || pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    body: pullRequest.body,
    url: pullRequest.html_url || pullRequest.url,
    repository: {
      id: repository.node_id || repository.id,
      name: repository.name,
    },
    assignees: pullRequest.assignees.map((assignee) => ({
      login: assignee.login || 'ghost',
      avatar_url: assignee.avatar_url || assignee.avatarUrl,
    })),
    requestedReviewers: pullRequest.requested_reviewers.map((reviewer) => ({
      login: reviewer.login || 'ghost',
      avatar_url: reviewer.avatar_url || reviewer.avatarUrl,
    })),
    linkedIssues,
    state: pullRequest.state,
    labels: pullRequest.labels.map((label) => label.name),
    managers: [
      {
        login: pullRequest.author.login,
        avatar_url: pullRequest.author.avatar_url || pullRequest.author.avatarUrl,
      },
    ],
    merged: pullRequest.merged,
    mergedAt: pullRequest.mergedAt || pullRequest.merged_at,
    commits: pullRequest.commits,
    comments: pullRequest.comments,
    reviewComments: pullRequest.review_comments,
    maintainerCanModify: pullRequest.maintainer_can_modify,
    mergeable: pullRequest.mergeable,
    authorAssociation: pullRequest.author_association,
    draft: pullRequest.draft,
  };

  await createOrUpdatePullRequest(pullRequestData);
};

module.exports = {
  savePullRequest,
};
