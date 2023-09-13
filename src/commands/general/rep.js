const { EmbedBuilder, CommandInteraction, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { randomID } = require("create-random-id");
const userModel = require("../../models/userModel");
const updateReputation = require("../../utility/updateReputation");
const reputationModel = require("../../models/reputationModel");
const guildModel = require("../../models/guildModel");
const chooseCategory = require("../../utility/chooseCategory");
const chooseReason = require("../../utility/chooseReason");
const userMincraftModel = require("../../models/userMincraftModel");

module.exports = {
    data: {
        name: "rep",
        description: "Give reputation to a user",
        options: [{
            name: "user",
            type: 6,
            description: "User whom you want to give reputation",
            required: true,
        }],
    },
    timeout: 1000,

    /**
     * 
     * @param {*} client 
     * @param {CommandInteraction} interaction 
     * @returns 
     */
    run: async (client, interaction) => {
        const newMemberTill = interaction.member.joinedTimestamp + (2 * 24 * 3600 * 1000);

        if (newMemberTill > Date.now()) return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("🍼 Too Young")
                    .setDescription(`You can give reputations <t:${Math.floor(newMemberTill / 1000)}:R>`)
            ],
            ephemeral: true
        });

        const user = interaction.options.getUser("user");

        if (user.id === interaction.user.id) return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Nope!")
                    .setDescription("You can't give reputation to yourself")
            ],
            ephemeral: true
        });

        if (user.bot) return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Nope!")
                    .setDescription("Bots can't recive reputation")
            ],
            ephemeral: true
        });

        await interaction.deferReply({ ephemeral: true });

        const senderData = await userModel.findOne({ id: interaction.user.id }) || await userModel.create({ id: interaction.user.id });

        if (senderData.banned) return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ You Are Not Allowed")
                    .setDescription("You are banned from giving reputation")
            ]
        });

        const globalTimeoutTill = senderData.timeouts.lastRep || 0;

        if (globalTimeoutTill > Date.now()) return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("⏰ Timeout")
                    .setDescription(`You can give next reputation again <t:${Math.floor(globalTimeoutTill / 1000)}:R>`)
            ]
        });

        const receiverData = await userModel.findOne({ id: user.id }) || await userModel.create({ id: user.id });
        const userTimeoutTill = senderData.timeouts[receiverData.id] || 0;

        if (userTimeoutTill > Date.now()) return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("⏰ Timeout")
                    .setDescription(`You can give reputation to ${user.toString()}, again <t:${Math.floor(userTimeoutTill / 1000)}:R>`)
            ]
        });

        const guildData = await guildModel.findOne({ id: interaction.guildId }) || await guildModel.create({ id: interaction.guildId });

        if (!guildData.categories.length) return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ No Categories Avaiable")
                    .setDescription("Please contact admins to add reputation categories")
            ]
        });

        const [newInteraction, category] = await chooseCategory({ interaction, guildData });

        if (!category) return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Error")
                    .setDescription("You took too long in selecting reputation category")
            ]
        });

        const [newInt2, reason] = await chooseReason({ interaction: newInteraction, guildData, category });

        if (!reason) return newInt2.update({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Error")
                    .setDescription("You took too long in selecting reputation category")
            ],
            ephemeral: true,
            components: [],
        });

        newInt2.update({
            embeds: [
                new EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle("📩 Saving Reputation")
            ],
            components: [],
            ephemeral: true
        });

        const staff = interaction.member.roles.cache.has(process.env.STAFF_ROLE);

        await userModel.updateOne({ id: interaction.user.id }, { [`timeouts.${receiverData.id}`]: Date.now() + 48 * 3600 * 1000, [`timeouts.lastRep`]: Date.now() + 600000 });
        await userModel.updateOne({ id: user.id }, { $inc: { reputation: 1, staffReputation: staff ? 1 : 0 } });

        const repId = randomID(14, ["letter", "number"]);
        const minecraftId = (await userMincraftModel.findOne({ id: user.id }, { uuid: 1 }))?.uuid;
        const likelyAbuse = (await reputationModel.countDocuments({ target: user.id, createdAt: { $gte: Date.now() - 1 * 3600 * 1000 }, isValid: true })) > 20;

        const admin = await client.log.admin.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("⭐ New Reputation Added")
                    .setDescription(likelyAbuse ? "🚨 **Likely Abuse/Spamming Case**" : "\u200b")
                    .addFields({
                        name: "Sender",
                        value: `${interaction.user.toString()} (${interaction.user.id}) **[${senderData.reputation} rep]**`,
                        inline: true
                    }, {
                        name: "Reciver",
                        value: `${user.toString()} (${user.id}) **[${receiverData.reputation + 1} rep]**`,
                        inline: true
                    }, {
                        name: "👷 Service",
                        value: `\`${category}\``,
                        inline: true
                    }, {
                        name: "🚦 Status",
                        value: `\`Valid\``,
                        inline: true
                    }, {
                        name: "🗨️ Reason",
                        value: `\`${reason}\``,
                        inline: true
                    })
                    .setFooter({
                        text: `Rep ID: ${repId}`,
                        iconURL: client.icons.right
                    })
                    .setThumbnail(`https://crafatar.com/renders/body/${minecraftId}`)
                    .setTimestamp()
            ],
            components: [
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            label: "Lookup Sender",
                            customId: `lookup-${interaction.user.id}`,
                            style: 1,
                        }),
                        new ButtonBuilder({
                            label: "Lookup Reciver",
                            customId: `lookup-${user.id}`,
                            style: 1,
                        }),
                        new ButtonBuilder({
                            label: "Reciver's Rep Count",
                            customId: `repCount-${user.id}`,
                            style: 1,
                        })
                    ]
                }),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            label: "Re-Validate Rep",
                            customId: `validate-${repId}`,
                            style: 3,
                        }),
                        new ButtonBuilder({
                            label: "Invalidate Rep",
                            customId: `invalidate-${repId}`,
                            style: 4,
                        }),
                    ]
                })
            ]
        });

        const public = await client.log.public.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("⭐ New Reputation")
                    .setDescription(`${interaction.user.toString()} has given ${user.toString()} a rep!\n${user.toString()} now has \`${receiverData.reputation + 1}\` reps!`)
                    .setColor("Green")
                    .addFields({
                        name: "👷 Service",
                        value: `\`${category}\``,
                        inline: true
                    }, {
                        name: "🚦 Status",
                        value: `\`Valid\``,
                        inline: true
                    }, {
                        name: "🗨️ Reason",
                        value: `\`${reason}\``,
                        inline: true
                    })
                    // .setFooter({
                    //     text: `Rep ID: ${repId}`,
                    //     iconURL: client.icons.right
                    // })
                    .setThumbnail(`https://crafatar.com/renders/body/${receiverData.minecraftId}`)
                    .setTimestamp()
            ]
        });

        const reputation = await reputationModel.create({
            id: repId,
            staff,
            sender: interaction.user.id,
            target: user.id,
            category,
            reason: {
                give: reason
            },
            messages: {
                public: public.id,
                admin: admin.id
            },
            isValid: true,
            createdAt: Date.now(),
        })

        updateReputation({ client, user });

       await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("✅ Reputation Saved")
            ],
            components: [],
            ephemeral: true
        });
    }
}