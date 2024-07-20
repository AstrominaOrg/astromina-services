const { updateIssue, deleteIssue, getIssue } = require('../issue.service');
const { removeThreadMember, tryAddThreadMember, getOrCreateThread } = require('../discord.service');
const { getUser } = require('../user.service');
const { wrapHandlerWithCheck } = require('./helper');
const { saveIssue } = require('../../utils/issue.utils');
const { isMember } = require('../organization.service');

async function handleIssueCreate(context) {
  const { issue, repository } = context.payload;

  issue.author = issue.user;

  await saveIssue(issue, repository);
}

async function handleIssueChange(context) {
  const { issue, repository } = context.payload;

  issue.author = issue.user;

  await saveIssue(issue, repository);
}

async function handleAssigned(context) {
  const { issue, assignee, repository } = context.payload;

  issue.author = issue.user;

  await saveIssue(issue, repository);
  const user = await getUser(assignee.login);
  const issueDB = await getIssue(issue.node_id);
  tryAddThreadMember({ user, issue: issueDB });
}

async function handleUnassigned(context) {
  const { issue, assignee, repository } = context.payload;
  const user = await getUser(assignee.login);

  if (user && user.discord && user.discord.id) {
    const discordId = user.discord.id;
    const userDB = await getIssue(issue.node_id);

    if (userDB && userDB.thread && userDB.thread.id) {
      await removeThreadMember({ threadId: userDB.thread.id, userId: discordId });
    }

    issue.author = issue.user;

    await saveIssue(issue, repository);
  }
}

async function handleIssueTransfer(context) {
  const { issue } = context.payload;

  await deleteIssue(issue.node_id);
}

async function handlePriceCommand(context) {
  const { comment, issue, sender, repository } = context.payload;

  if (!comment.body.startsWith('/price')) {
    return;
  }
  const price = comment.body.split(' ')[1];

  if (!price || price < 0) {
    return;
  }

  if (!isMember(repository.owner.login, sender.login)) {
    return;
  }

  const issueId = issue.node_id;

  await updateIssue(issueId, { price });
  // await sendComment(context, `Price has been updated to $${price}`);

  const userDB = await getIssue(issueId);
  const userDiscordIds = await Promise.all(
    issue.assignees
      .map(async (assignee) => {
        const user = await getUser(assignee.login);
        return user.discord.id;
      })
      .filter((discordId) => discordId !== null)
  );

  const thread = await getOrCreateThread({ user: userDB, issue, price, assignees: userDiscordIds });

  await updateIssue(issueId, {
    thread: {
      id: thread.id,
      name: thread.name,
      members: [],
    },
  });
}

module.exports = {
  handleIssueCreate: wrapHandlerWithCheck(handleIssueCreate),
  handleIssueTransfer: wrapHandlerWithCheck(handleIssueTransfer),
  handlePriceCommand: wrapHandlerWithCheck(handlePriceCommand),
  handleAssigned: wrapHandlerWithCheck(handleAssigned),
  handleIssueChange: wrapHandlerWithCheck(handleIssueChange),
  handleUnassigned: wrapHandlerWithCheck(handleUnassigned),
};
