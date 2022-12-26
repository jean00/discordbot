const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType,
} = require('discord.js');
const { Player } = require('discord-player');
const token = process.env['token'];
const clientId = process.env['clientId'];
const fs = require('fs');
const path = require('path');
const keepAlive = require('./server');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// List of all commands
const commands = [];
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

// Add the player on the client
client.player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25,
  },
});

client.on('ready', () => {
  // Get all ids of the servers
  const guild_ids = client.guilds.cache.map((guild) => guild.id);

  const rest = new REST({ version: '9' }).setToken(token);
  for (const guildId of guild_ids) {
    rest
      .put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      })
      .then(() =>
        console.log('Successfully updated commands for guild ' + guildId)
      )
      .catch(console.error);
  }
  // Set activity status
  client.user.setPresence({
    activities: [{ name: 'Music', type: ActivityType.Streaming }],
    status: 'online',
  });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute({ client, interaction });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error executing this command',
    });
  }
});

keepAlive();
client.login(token);
