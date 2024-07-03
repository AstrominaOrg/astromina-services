const { updateIssue, deleteIssue, getIssue } = require('../issue.service');
const { removeThreadMember, tryAddThreadMember, getOrCreateThread } = require('../discord.service');
const { getUser } = require('../user.service');
const dcbot = require('../../dcbot');
const { wrapHandlerWithCheck } = require('./helper');
const { saveIssue } = require('../../utils/issue.utils');
const { isMember } = require('../organization.service');

async function handleIssueCreate(context) {
  const { issue, repository } = context.payload;

  await saveIssue(issue, repository);
}

async function handleIssueChange(context) {
  const { issue, repository } = context.payload;

  await saveIssue(issue, repository);
}

async function handleAssigned(context) {
  const { issue, assignee, repository } = context.payload;

  await saveIssue(issue, repository);
  tryAddThreadMember({ client: dcbot, issue, githubUsername: assignee.login });
}

async function handleUnassigned(context) {
  const { issue, assignee, repository } = context.payload;
  const user = await getUser(assignee.login);

  if (user && user.discord && user.discord.id) {
    const discordId = user.discord.id;
    const userDB = await getIssue(issue.node_id);

    if (userDB && userDB.thread && userDB.thread.id) {
      await removeThreadMember({ client: dcbot, threadId: userDB.thread.id, userId: discordId });
    }

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
  const thread = await getOrCreateThread({ client: dcbot, user: userDB, issue, price });

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
