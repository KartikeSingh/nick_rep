const { EmbedBuilder } = require("discord.js");
const guildModel = require("../../models/guildModel");
const { getEmojiIdentifier, getEmojiString } = require("discord-emoji-utility");

module.exports = {
    data: {
        name: "categories",
        description: "manage the categories",
        options: [{
            name: "add",
            type: 1,
            description: "Add a new category",
            options: [{
                name: "label",
                type: 3,
                description: "The category label",
                required: true,
            }, {
                name: "placeholder",
                type: 3,
                description: "The category placeholder",
                required: true,
            }, {
                name: "description",
                type: 3,
                description: "The category description",
            }, {
                name: "emoji",
                type: 3,
                description: "The category emoji",
            }]
        }, {
            name: "remove",
            type: 1,
            description: "Remove a category",
            options: [{
                name: "index",
                type: 4,
                description: "Index of the category to remove",
                required: true,
                minValue: 1
            }]
        }, {
            name: "list",
            type: 1,
            description: "List all categories",
        }],
    },
    timeout: 1000,

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const option = interaction.options.getSubcommand();
        const label = interaction.options.getString("label");
        const description = interaction.options.getString("description");
        const placeholder = interaction.options.getString("placeholder");
        const emoji = getEmojiIdentifier(client, interaction.options.getString("emoji") || "");
        const index = interaction.options.getInteger("index");

        const guildData = await guildModel.findOne({ id: interaction.guildId }) || await guildModel.create({ id: interaction.guildId });

        if (option === "remove") {
            if (!guildData.categories[index]) return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Invalid Index")
                ]
            });

            const category = guildData.categories.find((v, i) => i === index);

            await guildModel.findOneAndUpdate({ id: interaction.guildId }, { categories: guildData.categories.filter((v, i) => i !== index) });

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`✅ Removed Category #${index}`)
                        .addFields(
                            {
                                name: "Label",
                                value: `\`${category.label}\``,
                                inline: true
                            },
                            {
                                name: "placeholder",
                                value: `\`${category.placeholder}\``,
                                inline: true
                            },
                            {
                                name: "description",
                                value: `\`${category.description || "No Description"}\``,
                                inline: true
                            },
                            {
                                name: "emoji",
                                value: `${getEmojiString(client, category.emoji || "") || "`No Emoji`"}`,
                                inline: true
                            }
                        )
                ]
            });
        } else if (option === "add") {
            const category = {
                label,
                description,
                placeholder,
                emoji
            };

            await guildModel.findOneAndUpdate({ id: interaction.guildId }, {
                $push: {
                    categories: category
                }
            });

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`✅ Added Category`)
                        .addFields(
                            {
                                name: "Label",
                                value: `\`${category.label}\``,
                                inline: true
                            },
                            {
                                name: "placeholder",
                                value: `\`${category.placeholder}\``,
                                inline: true
                            },
                            {
                                name: "description",
                                value: `\`${category.description || "No Description"}\``,
                                inline: true
                            },
                            {
                                name: "emoji",
                                value: `${getEmojiString(client, category.emoji || "") || "`No Emoji`"}`,
                                inline: true
                            }
                        )
                ]
            });
        } else if (option === "list") {
            if (!guildData.categories.length) return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ No Categories")
                ]
            });

            const categories = guildData.categories.map((v, i) => `${i + 1}. ${getEmojiString(client, v.emoji || "") || "\u200b"} **${v.label}**${v.description ? `\n> \`${v.description}\`` : ""}`);
            const embeds = [
                new EmbedBuilder()
                    .setTitle("📜 Category List")
                    .setColor("DarkGold")
                    .setDescription("\u200b")
            ];

            let page = 0;

            for (let i = 0; i < categories.length; i++) {
                if (embeds[page].data.description.length  + categories[i].length > 4000) page++;

                embeds[page] = embeds[page] || new EmbedBuilder().setColor("Gold");

                embeds[page].data.description = (embeds[page].data.description || "") + categories[i] + "\n\n";
            }

            interaction.editReply({
                embeds
            })
        }
    }
}