const { EmbedBuilder } = require("discord.js");
const guildModel = require("../models/guildModel");
const generateLeaderboard = require("./generateLeaderboard");

module.exports = async (client) => {
    const guildData = await guildModel.findOne({ id: client.log.admin.guild.id }) || await guildModel.create({ id: client.log.admin.guild.id });
    const leaderboards = await generateLeaderboard();

    for (let i = 0; i < guildData.messages.length; i++) {
        const message = await client.channels.cache.get(guildData.messages[i].channel)?.messages?.fetch(guildData.messages[i].message).catch(() => null);

        if (!message) continue;

        await message.edit({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🏆 Reputation Leaderboard")
                    .setDescription(`Top ${leaderboards.string.split("\n").length} players based on rep count\n\n${leaderboards.string}`)
            ]
        });
    }
}