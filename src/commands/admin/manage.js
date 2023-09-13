const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { randomID } = require("create-random-id");
const guildModel = require("../../models/guildModel");
const reputationModel = require("../../models/reputationModel");
const userModel = require("../../models/userModel");
const userMincraftModel = require("../../models/userMincraftModel");
const updateReputation = require("../../utility/updateReputation");
const chooseCategory = require("../../utility/chooseCategory");

module.exports = {
    data: {
        name: "manage",
        description: "Manage the bot",
        options: [{
            name: "rep",
            type: 2,
            description: "Manage the rep system",
            options: [{
                name: "delete",
                type: 1,
                description: "Delete a reputation",
                options: [{
                    name: "id",
                    type: 3,
                    description: "Reputation ID",
                    required: true,
                }]
            }, {
                name: "wipe",
                type: 1,
                description: "Wipe reputations of a user",
                options: [{
                    name: "user",
                    type: 6,
                    description: "User who's reps you want to wipe",
                    required: true,
                }, {
                    name: "mode",
                    type: 4,
                    description: "Select the wipe mode",
                    choices: [{
                        name: "Invalidate",
                        value: 0
                    }, {
                        name: "Delete",
                        value: 1
                    }]
                }]
            }, {
                name: "renew",
                type: 1,
                description: "Renew reputations of a user",
                options: [{
                    name: "user",
                    type: 6,
                    description: "User who's reps you want to renew",
                    required: true,
                }]
            }, {
                name: "add",
                type: 1,
                description: "Add reputations to a user",
                options: [{
                    name: "user",
                    type: 6,
                    description: "User who's reps you want to increase",
                    required: true,
                }, {
                    name: "amount",
                    type: 4,
                    description: "Number of reps you want to add",
                    required: true,
                    minValue: 1
                }, {
                    name: "reason",
                    type: 3,
                    description: "Reason for adding the reps",
                }]
            }]
        }],
    },
    timeout: 1000,

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const group = interaction.options.getSubcommandGroup();
        const option = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || "Admin Add Command";
        const mode = interaction.options.getInteger('mode');
        const id = interaction.options.getString('id');

        if (group === "rep") {
            if (option === "delete") {
                const deleted = await reputationModel.findOneAndDelete({ id });

                if (!deleted) return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("❌ Reputation not found")
                            .setDescription(`The reputation with the ID \`${id}\` was not found.`)
                    ]
                });

                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setTitle("✅ Reputation deleted")
                            .setDescription(`The reputation with the ID \`${id}\` was deleted.`)
                    ]
                });
            } else if (option === "wipe") {
                if (mode) {
                    await reputationModel.deleteMany({ target: user.id });
                } else {
                    await reputationModel.updateMany({ target: user.id }, { isValid: false, invalidatedBy: interaction.user.id, "reason.remove": "Wipe Command" })
                }

                await userModel.findOneAndUpdate({ id: user.id }, { reputation: 0, staffReputation: 0 });

                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setTitle("✅ Reputations wiped")
                            .setDescription(`The reputation of \`${user.tag}\` was ${mode ? "deleted" : "wiped"}.`)
                    ]
                });
            } else if (option === "renew") {
                await reputationModel.updateMany({ target: user.id, isValid: false }, { isValid: true, revalidatedBy: interaction.user.id, "reason.remove": "Renew Command" })

                await userModel.findOneAndUpdate({ id: user.id }, { reputation: await reputationModel.countDocuments({ target: user.id, isValid: true }), staffReputation: await reputationModel.countDocuments({ target: user.id, isValid: true, staff: true }) });

                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setTitle("✅ Reputations renewed")
                            .setDescription(`The reputation of \`${user.tag}\` was renewed.`)
                    ]
                });
            } else if (option === "add") {
                const guildData = await guildModel.findOne({ id: interaction.guildId }) || await guildModel.create({ id: interaction.guildId });

                if (!guildData.categories.length) return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("❌ No Categories Avaiable")
                            .setDescription("Please add some reputation categories first!")
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

                const minecraftId = (await userMincraftModel.findOne({ id: user.id }, { uuid: 1 }))?.uuid;
                const senderData = await userModel.findOne({ id: interaction.user.id });
                const staff = interaction.member.roles.cache.has(process.env.STAFF_ROLE);

                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Yellow")
                            .setTitle("🟡 Sending Reputations")
                    ],
                    components: []
                });

                for (let i = 0; i < amount; i++) {
                    const repId = randomID(14, ["letter", "number"]);

                    const receiverData = await userModel.findOneAndUpdate({ id: user.id }, { $inc: { reputation: 1, staffReputation: staff ? 1 : 0 } });

                    const admin = await client.log.admin.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("⭐ New Reputation Added")
                                .setDescription(`💼 **Admin Command (${interaction.user.username}/${interaction.user.id})**`)
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
                                        customId: `lookup-${user.id}-`,
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
                }

                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setTitle("✅ Reputations Added")
                    ]
                });
            }

            updateReputation({ client, user });
        }
    }
}