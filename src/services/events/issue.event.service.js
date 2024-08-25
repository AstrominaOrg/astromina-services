const { updateIssue, deleteIssue, getIssue, addManager } = require('../issue.service');
const { removeThreadMember, tryAddThreadMember, getOrCreateThread } = require('../discord.service');
const { getUser } = require('../user.service');
const { wrapHandlerWithCheck } = require('./helper');
const { saveIssue } = require('../../utils/issue.utils');
const { isMember } = require('../organization.service');
const { sendCommend } = require('../github.service');

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

async function handleIssueDeleted(context) {
  const { issue } = context.payload;

  await deleteIssue(issue.node_id);
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

  const isMemberOfOrganization = await isMember(repository.owner.login, sender.login);

  if (!isMemberOfOrganization) {
    return;
  }

  const issueId = issue.node_id;

  await updateIssue(issueId, { price });

  await addManager(issueId, sender);

  const text = `
## 💰 ${price} MINA BOUNTY!

This bounty is listed on [AstroMina.Org](https://app.astromina.org/)! You can list your own bounties or view all open bounties here.

### **If you want to be assigned to this bounty!**

- 🛬 Sign up on [AstroMina.Org](http://astromina.org/) with your GitHub account in just seconds.
- ✋ **Comment** on this issue if you want to be **assigned** to it.
- 🤝 Once assigned, a private Discord thread will be created between you and the bounty owner for communication. You can discuss details there.
- ⚠️ [Be sure to join the AstroMina Discord server here.](https://discord.com/invite/pNafn2Vk3N)
`;

  await sendCommend(context, text);

  const issueDB = await getIssue(issueId);

  const userDiscordIds = await Promise.all(
    issueDB.assignees
      .filter((assignee) => assignee !== null)
      .map(async (assignee) => {
        const user = await getUser(assignee.login);
        if (user === null || user.discord === null || user.discord.id === null) {
          return null;
        }
        return user.discord.id;
      })
  );

  const managersDiscordIds = await Promise.all(
    issueDB.managers
      .filter((manager) => manager !== null)
      .map(async (manager) => {
        const user = await getUser(manager.login);
        if (user === null || user.discord === null || user.discord.id === null) {
          return null;
        }
        return user.discord.id;
      })
  );

  const allDiscordIds = [...userDiscordIds, ...managersDiscordIds].filter((id) => id !== null);

  const thread = await getOrCreateThread({ issue: issueDB, price, assignees: allDiscordIds });

  issueDB.thread = {
    id: thread.id,
    name: thread.name,
    members: [],
  };

  await updateIssue(issueId, {
    thread: {
      id: thread.id,
      name: thread.name,
      members: [],
    },
  });

  const senderDB = await getUser(sender.login);

  if (senderDB) {
    await tryAddThreadMember({ user: senderDB, issue: issueDB });
  }
}

module.exports = {
  handleIssueCreate: wrapHandlerWithCheck(handleIssueCreate),
  handleIssueTransfer: wrapHandlerWithCheck(handleIssueTransfer),
  handlePriceCommand: wrapHandlerWithCheck(handlePriceCommand),
  handleAssigned: wrapHandlerWithCheck(handleAssigned),
  handleIssueChange: wrapHandlerWithCheck(handleIssueChange),
  handleUnassigned: wrapHandlerWithCheck(handleUnassigned),
  handleIssueDeleted: wrapHandlerWithCheck(handleIssueDeleted),
};
