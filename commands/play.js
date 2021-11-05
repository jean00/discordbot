const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const { joinVoiceChannel } = require('@discordjs/voice');
const {
	StreamType,
	createAudioPlayer,
	createAudioResource,
} = require('@discordjs/voice');
 
module.exports = {
    name: 'play',
    description: 'Joins and plays a video from youtube',
    async execute(message, args) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.channel.send('You need to be in a channel to execute this command!');
        const join = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        const player = createAudioPlayer();
 
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT')) return message.channel.send('You dont have the correct permissions');
        if (!permissions.has('SPEAK')) return message.channel.send('You dont have the correct permissions');
        if (!args.length) return message.channel.send('You need to send the second argument!');
         
        const  connection = await join;

        const validURL = (str) =>{
            var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
            if(!regex.test(str)){
                return false;
            } else {
                return true;
            }
        }
 
        if(validURL(args[0])){
 
            //const  connection = await join;
            const stream  = ytdl(args[0], {filter: 'audioonly'});
            const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
            player.play(resource, {seek: 0, volume: 1})
            connection.subscribe(player);
            await message.reply(`:thumbsup: Now Playing ***Your Link!***`)
 
            return
        }
        
        const videoFinder = async (query) => {
            const videoResult = await ytSearch(query);
 
            return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
 
        }
 
        const video = await videoFinder(args.join(' '));
 
        if(video){
            const stream  = ytdl(video.url, {filter: 'audioonly'});
            const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
            player.play(resource, {seek: 0, volume: 1});
            connection.subscribe(player);
            await message.reply(`:thumbsup: Now Playing ***${video.title}***`)
        } else {
            message.channel.send('No video results found');
        }
    }
}
 