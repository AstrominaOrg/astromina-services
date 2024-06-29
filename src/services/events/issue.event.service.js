const { createOrUpdateIssue, updateIssueByIssueId, deleteIssueByIssueId, getIssue } = require('../issue.service');
const { createPrivateThread, addThreadMember, removeThreadMember, sendThreadMessage } = require('../discord.service');
const { getUser } = require('../user.service');
const dcbot = require('../../dcbot');
const config = require('../../config/config');
const { wrapHandlerWithCheck } = require('./helper');

async function handleIssueCreate(context) {
  const { issue, repository } = context.payload;

  await createOrUpdateIssue({
    issueId: issue.node_id,
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    description: issue.body,
    assignees: issue.assignees.map((assignee) => {
      return {
        login: assignee.login,
        id: assignee.id,
      };
    }),
    repositoryId: repository.node_id,
    creator: issue.user.login,
    labels: issue.labels.map((label) => label.name),
    state: issue.state,
  });
}

async function handleIssueChange(context) {
  const { issue, repository } = context.payload;

  await createOrUpdateIssue({
    issueId: issue.node_id,
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    description: issue.body,
    assignees: issue.assignees.map((assignee) => {
      return {
        login: assignee.login,
        id: assignee.id,
      };
    }),
    repositoryId: repository.node_id,
    creator: issue.user.login,
    labels: issue.labels.map((label) => label.name),
    state: issue.state,
  });
}

async function handleAssigned(context) {
  const { issue, assignee, repository } = context.payload;

  await createOrUpdateIssue({
    issueId: issue.node_id,
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    description: issue.body,
    assignees: issue.assignees.map((dev) => {
      return {
        login: dev.login,
        id: dev.node_id,
      };
    }),
    repositoryId: repository.node_id,
    creator: issue.user.login,
    labels: issue.labels.map((label) => label.name),
    state: issue.state,
  });

  const user = await getUser(assignee.login);

  if (user && user.discord && user.discord.id !== null) {
    const discordId = user.discord.id;
    const userDB = await getIssue(issue.node_id);

    if (userDB && userDB.thread && userDB.thread.id) {
      await addThreadMember({ client: dcbot, threadId: userDB.thread.id, userId: discordId });
    }
  }

  const creator = await getUser(issue.user.login);

  if (creator && creator.discord && creator.discord.id !== null) {
    const discordId = creator.discord.id;
    const userDB = await getIssue(issue.node_id);

    if (userDB && userDB.thread && userDB.thread.id) {
      await addThreadMember({ client: dcbot, threadId: userDB.thread.id, userId: discordId });
    }
  }
}

async function handleUnassigned(context) {
  const { issue, assignee } = context.payload;

  const user = await getUser(assignee.login);

  if (user && user.discord && user.discord.id) {
    const discordId = user.discord.id;
    const userDB = await getIssue(issue.node_id);

    if (userDB && userDB.thread && userDB.thread.id) {
      await removeThreadMember({ client: dcbot, threadId: userDB.thread.id, userId: discordId });
    }

    await createOrUpdateIssue({
      issueId: issue.node_id,
      assignees: issue.assignees.map((dev) => {
        return {
          login: dev.login,
          id: dev.id,
        };
      }),
    });
  }
}

async function handleIssueTransfer(context) {
  const { issue } = context.payload;

  await deleteIssueByIssueId(issue.node_id);
}

async function handlePriceCommand(context) {
  const { comment } = context.payload;

  if (!comment.body.startsWith('/price')) {
    return;
  }
  const price = comment.body.split(' ')[1];
  const issueId = context.payload.issue.node_id;
  const sender = context.payload.sender.login;
  const issue = await getIssue(issueId);

  if (issue.creator.login !== sender) {
    // await sendComment(context, 'You are not allowed to update the price');
    return;
  }

  await updateIssueByIssueId(issueId, { price });
  // await sendComment(context, `Price has been updated to $${price}`);
  const userDB = await getIssue(issueId);
  let thread;

  if (userDB && userDB.thread && userDB.thread.id) {
    thread = userDB.thread;
    await sendThreadMessage({
      client: dcbot,
      threadId: thread.id,
      message: `Price has been updated to $${price}`,
    });
  } else {
    const userDiscordIds = await Promise.all(
      issue.assignees
        .map(async (assignee) => {
          const user = await getUser(assignee.login);
          return user.discord.id;
        })
        .filter((discordId) => discordId !== null)
    );

    thread = await createPrivateThread({
      client: dcbot,
      channelId: config.discord.channelId,
      threadName: `Issue #${issue.number}`,
      initialMessage: `The issue #${issue.number} now marked as bounty with $${price} bounty. Assignees will be added to this thread when they are assigned to the issue.`,
      ids: userDiscordIds,
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
  handleIssueCreate: wrapHandlerWithCheck(handleIssueCreate),
  handleIssueTransfer: wrapHandlerWithCheck(handleIssueTransfer),
  handlePriceCommand: wrapHandlerWithCheck(handlePriceCommand),
  handleAssigned: wrapHandlerWithCheck(handleAssigned),
  handleIssueChange: wrapHandlerWithCheck(handleIssueChange),
  handleUnassigned: wrapHandlerWithCheck(handleUnassigned),
};
