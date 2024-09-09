const { getLinkedIssues, sendCommendToIssue } = require('../github.service');
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

function getResolutionTime(createdAt) {
  const currentTime = new Date();

  const resolutionTimeMs = currentTime - createdAt;

  const resolutionTimeSeconds = Math.floor((resolutionTimeMs / 1000) % 60);

  const resolutionTimeMinutes = Math.floor((resolutionTimeMs / (1000 * 60)) % 60);

  const resolutionTimeHours = Math.floor(resolutionTimeMs / (1000 * 60 * 60));

  let resolutionTimeFormatted = '';

  if (resolutionTimeHours > 0) {
    resolutionTimeFormatted += `${resolutionTimeHours} hours, `;
  }

  resolutionTimeFormatted += `${resolutionTimeMinutes} minutes, ${resolutionTimeSeconds} seconds`;

  return resolutionTimeFormatted;
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

        const comment = `
**🎉 Congrats ${issueDB.assignees.map((assignee) => `@${assignee.login}`).join(', ')}!**

The PR has been merged, and the issue is officially closed!

| **Icon** | **Details** |
| --- | --- |
| ⭐ **Bounty Hunter** | ${issueDB.assignees.map((assignee) => `@${assignee.login}`).join(', ')} |
| 🙌 **Merged** | #${pullRequest.number} |
| ⏰ **Resolution Time** | ${getResolutionTime(issueDB.createdAt)} |
| 💸 **Reward** | ${issueDB.price} MINA |

***Next Steps:***

- 💸 **Payment:** The bounty owner will now proceed with your payment of **${
          issueDB.price
        } MINA**. Please confirm the details in your private Discord thread (you’ve already in).
- 👥 **Communication:** Stay connected through your Discord thread for any final discussions. If you haven’t already, make sure you’ve joined the [AstroMina Discord server](https://discord.com/invite/pNafn2Vk3N).
- 🏆 **Recognition:** Your contribution will be highlighted in our monthly contributor spotlight, showcasing your dedication to the community.
- 📈 **Feedback:** We’d love to hear your experience[. Feel free to share any suggestions on how we can improve the process.](https://forms.gle/281iPnWcuKPZ8vK2A) Your insights are valuable to us.
`;

        await sendCommendToIssue(issueDB.owner.login, issueDB.repository.name, issueDB.number, comment);

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
