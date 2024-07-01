const { Client, GatewayIntentBits, Partials } = require('discord.js');
// eslint-disable-next-line import/no-unresolved
const { REST } = require('@discordjs/rest');
// eslint-disable-next-line import/no-extraneous-dependencies
const { Routes } = require('discord-api-types/v9');
const config = require('./config/config');
const logger = require('./config/logger');

const dcbot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

dcbot.once('ready', async () => {
  logger.info(`Logged in as ${dcbot.user.tag}`);

  const commands = [
    {
      name: 'create-thread',
      description: 'Creates a private thread with mentioned users',
      options: [
        {
          name: 'message',
          type: 3,
          description: 'The message to send in the thread',
          required: true,
        },
      ],
    },
    {
      name: 'request',
      description: 'Presents a yes/no choice',
      options: [
        {
          name: 'message',
          type: 3,
          description: 'The message to send with the confirmation buttons',
          required: true,
        },
        {
          name: 'username',
          type: 6,
          description: 'The user to send the confirmation message to',
          required: true,
        },
      ],
    },
  ];

  const rest = new REST({ version: '9' }).setToken(config.discord.token);

  try {
    await rest.put(Routes.applicationCommands(dcbot.user.id), { body: commands });
    logger.info('Successfully registered application commands.');
  } catch (error) {
    logger.error('Error registering application commands:', error);
  }
});

// dcbot.on('interactionCreate', async (interaction) => {
//   if (!interaction.isCommand()) return;

//   const { commandName } = interaction;

//   if (commandName === 'create-thread') {
//     const message = interaction.options.getString('message');
//     const mentionedUsers = interaction.options.resolved.users;

//     if (!mentionedUsers.size) {
//       return interaction.reply({ content: 'You need to mention at least one user.', ephemeral: true });
//     }

//     try {
//       const thread = await createPrivateThread({
//         client: dcbot,
//         channelId: interaction.channelId,
//         threadName: `Private Thread with ${mentionedUsers.map((user) => user.username).join(', ')}`,
//         initialMessage: `${interaction.user} created this thread. Message: ${message}`,
//         mentionedUsers: Array.from(mentionedUsers.values()),
//         reason: 'Thread requested by user',
//       });

//       await interaction.reply({ content: `Private thread created: <#${thread.id}>`, ephemeral: true });
//     } catch (error) {
//       logger.error('Error creating thread:', error);
//       await interaction.reply({ content: 'There was an error creating the thread.', ephemeral: true });
//     }
//   } else if (commandName === 'request') {
//     const message = interaction.options.getString('message');
//     const user = interaction.options.getUser('username');

//     try {
//       await createPaymentConfirmation({
//         client: dcbot,
//         threadId: interaction.channelId,
//         approvalMessage: message,
//         user,
//       });

//       await interaction.reply({ content: 'Payment confirmation sent.', ephemeral: true });
//     } catch (error) {
//       logger.error('Error sending payment confirmation:', error);
//       await interaction.reply({ content: 'There was an error sending the payment confirmation.', ephemeral: true });
//     }
//   }
// });

dcbot.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith('received_reward_')) {
    const issueId = interaction.customId.split('received_reward_')[1];
    await interaction.reply(`Button clicked by ${interaction.user.username} for issue ${issueId}`);
  }
});

dcbot.login(config.discord.token).catch((error) => {
  logger.error('Error logging in to Discord:', error);
});

module.exports = dcbot;
