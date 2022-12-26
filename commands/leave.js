const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leaves the channel'),
  execute: async ({ client, interaction }) => {
    const queue = client.player.getQueue(interaction.guild);
    if (!queue) {
      await interaction.reply('There is no song playing');
      return;
    }

    queue.destroy();

    await interaction.reply('Ciao.');
  },
};
