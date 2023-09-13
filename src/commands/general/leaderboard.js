const { EmbedBuilder } = require('discord.js');
const generateLeaderboard = require('../../utility/generateLeaderboard');
const guildModel = require('../../models/guildModel');

module.exports = {
    data: {
        name: "leaderboard",
        description: "The bot leaderboard",
        options: [{
            name: "display",
            type: 1,
            description: "Display the leaderboard",
        }, {
            name: "view",
            type: 1,
            description: "view a specific user's leaderboard",
            options: [{
                name: "user",
                type: 6,
                description: "User who's leaderboard you want to view",
            }]
        }],
    },
    timeout: 1000,

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const option = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user') || interaction.user;

        if (option === "display") {
            const leaderboards = await generateLeaderboard();

            const message = await interaction.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🏆 Reputation Leaderboard")
                        .setDescription(`Top ${leaderboards.string.split("\n").length} players based on rep count\n\n${leaderboards.string}`)
                ]
            });

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setTitle("✅ Leaderboard Sent")
                ]
            });

            await guildModel.findOneAndUpdate({ id: interaction.guildId }, { $push: { messages: { message: message.id, channel: message.channel.id } } }, { upsert: true });
        } else if (option === "view") {
            const leaderboards = await generateLeaderboard(user);

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🏆 Reputation Leaderboard")
                        .setDescription(`${user}'s position on the leadeboard is **${leaderboards.rank}**\n\n${leaderboards.string}`)
                ]
            });
        }
    }
}