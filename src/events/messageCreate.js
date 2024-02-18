module.exports = async (client, message) => {
    const monitoredChannelId = '1081483006155440169';

    // Check if the message is in the specified channel and not sent by the bot
    if (message.channel.id === monitoredChannelId && !message.author.bot) {
        // Delete the message
        message.delete().catch(err => console.error(`Could not delete message: ${err}`));
    }
};
