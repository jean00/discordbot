const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const { joinVoiceChannel } = require("@discordjs/voice");
const {
  StreamType,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");

let queue = new Map();

module.exports = {
  name: "play",
  description: "Joins and plays a video from youtube",
  aliases: ["skip", "leave"],

  async execute(message, args, cmd, client) {
    const voiceChannel = message.member.voice.channel;
    const server_queue = queue.get(message.guild.id);
    console.log(queue.get(message.guild.id));
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a channel to execute this command!"
      );
    const join = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT"))
      return message.channel.send("You dont have the correct permissions");
    if (!permissions.has("SPEAK"))
      return message.channel.send("You dont have the correct permissions");

    if (cmd === "play") {
      if (!args.length)
        return message.channel.send("You need to send the second argument!");

      let song = {};

      if (ytdl.validateURL(args[0])) {
        const song_info = await ytdl.getInfo(args[0]);
        song = {
          title: song_info.videoDetails.title,
          url: song_info.videoDetails.video_url,
        };
      } else {
        const video_finder = async (query) => {
          const video_result = await ytSearch(query);
          return video_result.videos.length > 1 ? video_result.videos[0] : null;
        };

        const video = await video_finder(args.join(" "));
        if (video) {
          song = { title: video.title, url: video.url };
        } else {
          message.channel.send("Error finding video.");
        }
      }
      if (!server_queue) {
        const queue_constructor = {
          voice_channel: voiceChannel,
          text_channel: message.channel,
          connection: null,
          songs: [],
        };

        queue.set(message.guild.id, queue_constructor);
        queue_constructor.songs.push(song);

        try {
          const connection = await join;
          queue_constructor.connection = connection;
          video_player(message.guild, queue_constructor.songs[0]);
        } catch (err) {
          queue.delete(message.guild.id);
          message.channel.send("There was an error connecting!");
          throw err;
        }
      } else {
        server_queue.songs.push(song);
        return message.channel.send(`👍 **${song.title}** added to queue!`);
      }
    } else if (cmd === "skip") skip(message, message.guild, server_queue);
    else if (cmd === "leave") stop(message, server_queue);
  },
};

const video_player = async (guild, song) => {
  const song_queue = queue.get(guild.id);
  const player = createAudioPlayer();

  if (!song) {
    song_queue.connection.destroy();
    queue.delete(guild.id);
    return;
  }
  const stream = ytdl(song.url, { filter: "audioonly" });
  const resource = createAudioResource(stream, {
    inputType: StreamType.Arbitrary,
  });

  player.play(resource, { seek: 0, volume: 1 });
  song_queue.connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    song_queue.songs.shift();
    video_player(guild, song_queue.songs[0]);
  });
  await song_queue.text_channel.send(`🎶 Now playing **${song.title}**`);
};

const skip = (message, guild, server_queue) => {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You need to be in a channel to execute this command!"
    );
  if (!server_queue)
    return message.channel.send(`There are no songs in queue 😔`);

  const song_queue = queue.get(guild.id);
  song_queue.songs.shift();
  video_player(guild, song_queue.songs[0]);
};

const stop = (message, server_queue) => {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You need to be in a channel to execute this command!"
    );
  queue = new Map();
  server_queue.connection.destroy();
};
