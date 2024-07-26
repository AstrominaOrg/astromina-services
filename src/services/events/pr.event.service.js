const { getLinkedIssues } = require('../github.service');
const { wrapHandlerWithCheck } = require('./helper');
const { createOrUpdateIssue, getIssueByIssueNumberAndRepositoryId } = require('../issue.service');
const { sendThreadMessage } = require('../discord.service');
const { savePullRequest } = require('../../utils/pr.utils');

async function handlePullRequestCreate(context) {
  const { pull_request: pullRequest, repository } = context.payload;
  let linkedIssues = await getLinkedIssues(repository.name, repository.owner.login, pullRequest.number, 5);
  linkedIssues = linkedIssues.repository.pullRequest.closingIssuesReferences.nodes.map((issue) => issue.number);

  pullRequest.author = pullRequest.user;

  await savePullRequest(pullRequest, repository, linkedIssues);
}

async function handlePullRequestEdit() {
  // TODO: Implement this function
}

async function handlePullRequestClose(context) {
  const { pull_request: pullRequest, repository } = context.payload;
  let linkedIssues = await getLinkedIssues(repository.name, repository.owner.login, pullRequest.number, 5);
  linkedIssues = linkedIssues.repository.pullRequest.closingIssuesReferences.nodes.map((issue) => issue.number);

  if (pullRequest.merged) {
    linkedIssues.forEach(async (issue) => {
      const issueDB = await getIssueByIssueNumberAndRepositoryId(issue, repository.node_id);
      if (issueDB && issueDB.thread && issueDB.thread.id) {
        await createOrUpdateIssue({
          issueId: issueDB.issueId,
          solved: true,
        });

        await sendThreadMessage({
          threadId: issueDB.thread.id,
          message: `Issue ${issue} has been solved by pull request [${pullRequest.title}](${pullRequest.html_url})! ${
            issueDB.price
          } to ${issueDB.assignees
            .map((assignee) => `[${assignee.login}](https://github.com/${assignee.login})`)
            .join(', ')}`,
        });

        const button = {
          type: 2,
          style: 3,
          label: 'Confirm you received the reward',
          custom_id: `received_reward_${issueDB.issueId}`,
        };

        await sendThreadMessage({
          threadId: issueDB.thread.id,
          message: 'Please confirm you received the reward by clicking the button below.',
          components: [
            {
              type: 1,
              components: [button],
            },
          ],
        });
      }
    });
  }

  pullRequest.author = pullRequest.user;

  await savePullRequest(pullRequest, repository, linkedIssues);
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
