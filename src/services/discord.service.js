const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const httpStatus = require('http-status');
const logger = require('../config/logger');
const { getIssue } = require('./issue.service');
const config = require('../config/config');
const dcbot = require('../dcbot');
const { getUserById } = require('./user.service');
const { Issue } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Creates a private thread with specified users and sends an initial message.
 * @param {Object} params - The parameters for creating the thread.
 * @param {string} params.channelId - The ID of the channel where the thread will be created.
 * @param {string} params.threadName - The name of the thread to be created.
 * @param {string} params.initialMessage - The initial message to be sent in the thread.
 * @param {Array} params.ids - The users to be added to the thread.
 * @param {number} params.autoArchiveDuration - The duration in minutes after which the thread will be archived.
 * @param {string} params.reason - The reason for creating the thread.
 * @returns {Promise<ThreadChannel>} The created private thread.
 */
async function createPrivateThread({ channelId, threadName, initialMessage, ids, autoArchiveDuration, reason }) {
  try {
    const channel = await dcbot.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel ID or the channel is not text-based.');
    }

    const users = await Promise.all(ids.map((id) => dcbot.users.fetch(id)));

    const thread = await channel.threads.create({
      name: threadName,
      autoArchiveDuration,
      type: 12, // GUILD_PRIVATE_THREAD
      reason,
      invitable: false,
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const user of users) {
      // eslint-disable-next-line no-await-in-loop
      await thread.members.add(user.id);
    }

    await thread.send(initialMessage);

    return thread;
  } catch (error) {
    logger.error('Error creating private thread:', error);
  }
}

/**
 * Add a user to a private thread.
 * @param {Object} params - The parameters for adding a user to a thread.
 * @param {string} params.threadId - The ID of the thread where the user will be added.
 * @param {string} params.userId - The ID of the user to be added to the thread.
 */
async function addThreadMember({ threadId, userId }) {
  const thread = await dcbot.channels.fetch(threadId);
  if (!thread || !thread.isThread()) {
    throw new Error('Invalid thread ID or the channel is not a thread.');
  }

  const user = await dcbot.users.fetch(userId);
  if (!user) {
    throw new Error('Invalid user ID.');
  }

  await thread.members.add(user.id);
  await thread.send(`User <@${user.id}> has been added to the thread.`);
}

/**
 * Remove a user from a private thread.
 * @param {Object} params - The parameters for removing a user from a thread.
 * @param {string} params.threadId - The ID of the thread where the user will be removed.
 * @param {string} params.userId - The ID of the user to be removed from the thread.
 * @param {string} params.reason - The reason for removing the user from the thread.
 */

async function removeThreadMember({ threadId, userId, reason }) {
  const thread = await dcbot.channels.fetch(threadId);
  if (!thread || !thread.isThread()) {
    throw new Error('Invalid thread ID or the channel is not a thread.');
  }

  const user = await dcbot.users.fetch(userId);
  if (!user) {
    throw new Error('Invalid user ID.');
  }

  await thread.send(`User <@${user.id}> has been removed from the thread.`);
  await thread.members.remove(user.id, reason);
}

/**
 * Sends a payment confirmation message with approval buttons in an existing private thread.
 * @param {Object} params - The parameters for creating the payment confirmation message.
 * @param {string} params.threadId - The ID of the thread where the confirmation message will be sent.
 * @param {string} params.approvalMessage - The message to be sent in the thread with approval buttons.
 * @param {Object} params.user - The user who should see the confirmation buttons.
 */
const createPaymentConfirmation = async ({ threadId, approvalMessage, user }) => {
  const thread = await dcbot.channels.fetch(threadId);
  if (!thread || !thread.isThread()) {
    throw new Error('Invalid thread ID or the channel is not a thread.');
  }

  const member = await thread.members.fetch(user.id);
  if (!member) {
    throw new Error('User is not a member of the thread.');
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('approve').setLabel('Approve').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('reject').setLabel('Reject').setStyle(ButtonStyle.Danger)
  );

  await thread.send({
    content: `<@${user.id}> ${approvalMessage}`,
    components: [row],
    ephemeral: true,
  });
};

/**
 * Send a message to a thread
 * @param {Object} params - The parameters for sending a message to a thread.
 * @param {string} params.threadId - The ID of the thread where the message will be sent.
 * @param {string} params.message - The message to be sent in the thread.
 */
const sendThreadMessage = async ({ threadId, message, components }) => {
  const thread = await dcbot.channels.fetch(threadId);
  if (!thread || !thread.isThread()) {
    throw new Error('Invalid thread ID or the channel is not a thread.');
  }

  await thread.send({
    content: message,
    components,
  });
};

const tryAddThreadMember = async ({ user, issue }) => {
  logger.info(
    `Trying to add user ${user.github.username} ${user.discord.id} to thread for issue ${
      issue.node_id || issue.issueId || issue.id
    }`
  );

  if (user && user.discord && user.discord.id !== null) {
    const discordId = user.discord.id;
    const userDB = await getIssue(issue.node_id || issue.issueId || issue.id);
    if (userDB && userDB.thread && userDB.thread.id) {
      await addThreadMember({ threadId: userDB.thread.id, userId: discordId });
    }
  }
};

const recoverUsersThreads = async (id) => {
  const user = await getUserById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const issues = await Issue.find({ 'assignees.login': user.github.username });
  issues
    .filter((issue) => issue.thread.id)
    .forEach((issue) => {
      addThreadMember({ threadId: issue.thread.id, userId: user.discord.id });
    });
};

const getOrCreateThread = async ({ issue, price, assignees }) => {
  let thread;

  if (issue && issue.thread && issue.thread.id) {
    thread = issue.thread;
    await sendThreadMessage({
      threadId: thread.id,
      message: `Price has been updated to $${price}`,
    });
  } else {
    thread = await createPrivateThread({
      channelId: config.discord.channelId,
      threadName: `Issue #${issue.number}`,
      initialMessage: `The issue #${issue.number} now marked as bounty with $${price} bounty. Assignees will be added to this thread when they are assigned to the issue.`,
      ids: assignees,
      reason: 'Issue marked as bounty',
    });
  }

  return thread;
};

module.exports = {
  addThreadMember,
  removeThreadMember,
  createPrivateThread,
  sendThreadMessage,
  createPaymentConfirmation,
  tryAddThreadMember,
  getOrCreateThread,
  recoverUsersThreads,
};
