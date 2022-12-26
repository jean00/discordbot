module.exports = {
    name: 'ping',
    description: ' sends ping',
    execute(message, args){
        message.channel.send('pong');
    }
}