const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'leave',
    description: 'stop the bot and leave the channel',
    async execute(message, args) {
        const voiceChannel = message.member.voice.channel;
        const connection = getVoiceConnection(voiceChannel.guild.id)
        if(!voiceChannel) return message.channel.send("You need to be in a voice channel to stop the music!");
        await connection.destroy();
        await message.channel.send('Leaving channel :smiling_face_with_tear: bye...')
    }
}