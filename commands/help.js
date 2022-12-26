const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Provides information about the commands.'),
  execute: async ({ client, interaction }) => {
    const commands = [];
    // Grab all the command files from the commands directory
    const commandFiles = fs
      .readdirSync('./commands')
      .filter((file) => file.endsWith('.js'));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data
    for (const file of commandFiles) {
      const command = require(`./${file}`);
      commands.push(command.data.toJSON());
    }
    const files = commands
      .map((command) => `> **${command.name}:** ${command.description}\n`)
      .join('\n');
    await interaction.reply({
      embeds: [new EmbedBuilder().setDescription(`Commands:\n\n ${files}`)],
    });
  },
};
