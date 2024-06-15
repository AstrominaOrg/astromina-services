const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../config/logger');

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
async function createPrivateThread({ client, channelId, threadName, initialMessage, ids, autoArchiveDuration, reason }) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel ID or the channel is not text-based.');
    }

    const users = await Promise.all(ids.map((id) => client.users.cache.get(id)));

    const thread = await channel.threads.create({
      name: threadName,
      autoArchiveDuration,
      type: 12, // GUILD_PRIVATE_THREAD
      reason,
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
async function addThreadMember({ client, threadId, userId }) {
  const thread = await client.channels.fetch(threadId);
  if (!thread || !thread.isThread()) {
    throw new Error('Invalid thread ID or the channel is not a thread.');
  }

  const user = await client.users.fetch(userId);
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

async function removeThreadMember({ client, threadId, userId, reason }) {
  const thread = await client.channels.fetch(threadId);
  if (!thread || !thread.isThread()) {
    throw new Error('Invalid thread ID or the channel is not a thread.');
  }

  const user = await client.users.fetch(userId);
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
const createPaymentConfirmation = async ({ client, threadId, approvalMessage, user }) => {
  const thread = await client.channels.fetch(threadId);
  if (!thread || !thread.isThread()) {
    throw new Error('Invalid thread ID or the channel is not a thread.');
  }

  // Check if the user is a member of the thread before sending the message
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
const sendThreadMessage = async ({ client, threadId, message }) => {
  const thread = await client.channels.fetch(threadId);
  if (!thread || !thread.isThread()) {
    throw new Error('Invalid thread ID or the channel is not a thread.');
  }

  await thread.send({
    content: message,
  });
};

module.exports = {
  addThreadMember,
  removeThreadMember,
  createPrivateThread,
  sendThreadMessage,
  createPaymentConfirmation,
};
