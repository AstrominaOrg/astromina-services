const { createOrUpdateIssue } = require('../services/issue.service');

const saveIssue = async (issue, repository) => {
  const { owner } = repository;

  const issueData = {
    issueId: issue.node_id || issue.id,
    number: issue.number,
    title: issue.title,
    url: issue.html_url || issue.url,
    description: issue.body,
    assignees: issue.assignees.map((assignee) => ({
      login: assignee.login,
      id: assignee.id,
      avatar_url: assignee.avatar_url || assignee.avatarUrl,
    })),
    repository: {
      id: repository.node_id || repository.id,
      name: repository.name,
    },
    owner: {
      login: owner.login,
      avatar_url: owner.avatar_url || owner.avatarUrl,
    },
    managers: [
      {
        login: owner.login,
        avatar_url: owner.avatar_url || owner.avatarUrl,
      },
    ],
    labels: issue.labels.map((label) => label.name),
    state: issue.state.toLowerCase(),
  };

  await createOrUpdateIssue(issueData);
};

module.exports = {
  saveIssue,
};
