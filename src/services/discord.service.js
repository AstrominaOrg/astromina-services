const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../config/logger');

/**
 * Creates a private thread with specified users and sends an initial message.
 * @param {Object} params - The parameters for creating the thread.
 * @param {string} params.channelId - The ID of the channel where the thread will be created.
 * @param {string} params.threadName - The name of the thread to be created.
 * @param {string} params.initialMessage - The initial message to be sent in the thread.
 * @param {Array} params.mentionedUsers - The users to be added to the thread.
 * @param {number} params.autoArchiveDuration - The duration in minutes after which the thread will be archived.
 * @param {string} params.reason - The reason for creating the thread.
 * @returns {Promise<ThreadChannel>} The created private thread.
 */
async function createPrivateThread({
  client,
  channelId,
  threadName,
  initialMessage,
  mentionedUsers,
  autoArchiveDuration,
  reason,
}) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel ID or the channel is not text-based.');
    }

    const thread = await channel.threads.create({
      name: threadName,
      autoArchiveDuration,
      type: 12, // GUILD_PRIVATE_THREAD
      reason,
    });

    // eslint-disable-next-line no-console
    console.log('mentionedUsers:', mentionedUsers);

    // eslint-disable-next-line no-restricted-syntax
    for (const user of mentionedUsers) {
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

module.exports = {
  createPrivateThread,
  createPaymentConfirmation,
};
