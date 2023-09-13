const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js")
const acceptInput = require("./acceptInput")

module.exports = async ({ interaction, guildData }) => await acceptInput({
    interaction,
    data: {
        embeds: [
            new EmbedBuilder()
                .setColor("Yellow")
                .setTitle("📊 Reputation Category")
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("selectCategory")
                        .setOptions(
                            guildData.categories.map(category => ({
                                ...category.toJSON(),
                                value: category.label,
                                description: category.description||"\u200b",
                            })
                            )
                        )
                )
        ]
    },
    reply: 2
});