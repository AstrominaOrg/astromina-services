const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config/config');
const logger = require('./config/logger');
const { markUserAsRewarded } = require('./services/user.service');

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
});

dcbot.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith('received_reward_')) {
    const issueId = interaction.customId.split('received_reward_')[1];
    markUserAsRewarded(interaction.user.id, issueId);
    await interaction.reply(`Button clicked by ${interaction.user.username} for issue ${issueId}`);
  }
});

dcbot.login(config.discord.token).catch((error) => {
  logger.error('Error logging in to Discord:', error);
});

module.exports = dcbot;
