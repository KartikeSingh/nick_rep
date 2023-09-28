const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const userMincraftModel = require("../models/userMincraftModel");
const userModel = require("../models/userModel");
const userRepEmbed = require("../utility/userRepEmbed");
const guildModel = require("../models/guildModel");
const reputationModel = require("../models/reputationModel");
const updateReputation = require("../utility/updateReputation");
const updateMessages = require("../utility/updateMessages");
const chooseRepReason = require("../utility/chooseRepReason");

module.exports = async (client, interaction) => {
    if (!interaction.customId) return;

    const member = await interaction.guild.members
        .fetch(interaction.user.id)
        .catch(() => null);

    const [type, id] = interaction.customId.split("-");

    if (type === "lookup") {
        if (
            !member.permissions.has("ManageGuild") &&
            !client.owners.includes(interaction.user.id) &&
            !member.roles.cache.has("1081482836470673428")
        )
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: "❌ Not Allowed",
                        description:
                            "You do not have enough permissions to use this command",
                    }).setColor("Red"),
                ],
            });

        await interaction.deferReply({ ephemeral: true });

        const u = client.users.cache.get(id);

        if (!u)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ User Not Found"),
                ],
            });

        const userData = await userMincraftModel.findOne({ id: u?.id || u });

        if (!userData)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Data Not Found"),
                ],
            });

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("ℹ️ User Found")
            .addFields(
                {
                    name: "Discord",
                    value: `<@${userData.id}>`,
                    inline: true,
                },
                {
                    name: "Minecraft UUID",
                    value: `\`\`\`\n${userData.uuid}\n\`\`\``,
                    inline: true,
                },
                {
                    name: "Minecraft Name",
                    value: `\`\`\`\n${userData.name}\n\`\`\``,
                    inline: true,
                },
                {
                    name: "IP",
                    value: `\`\`\`\n${userData.ip}\n\`\`\``,
                    inline: true,
                },
                {
                    name: "Code",
                    value: `\`\`\`\n${userData.code}\n\`\`\``,
                    inline: true,
                },
                {
                    name: "Time Verified",
                    value: `<t:${userData.epoch}>`,
                    inline: true,
                },
                {
                    name: "Last Updated",
                    value: userData.lastUpdated
                        ? `<t:${Math.floor(userData.lastUpdated / 1000)}:R>`
                        : "`Never`",
                    inline: true,
                }
            );

        interaction.editReply({
            embeds: [embed],
            components: [
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            customId: `logout-${userData.id}`,
                            label: "Disconnect",
                            style: 4,
                        }),
                        new ButtonBuilder({
                            customId: `update-${userData.id}`,
                            label: "Force Update",
                            style: 1,
                        }),
                    ],
                }),
            ],
        });
    } else if (type === "repCount") {
        if (
            !member.permissions.has("ManageGuild") &&
            !client.owners.includes(interaction.user.id) &&
            !member.roles.cache.has("1081482836470673428")
        )
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: "❌ Not Allowed",
                        description:
                            "You do not have enough permissions to use this command",
                    }).setColor("Red"),
                ],
            });

        await interaction.deferReply({ ephemeral: true });

        const userData =
            (await userModel.findOne({ id: id })) ||
            (await userModel.create({ id: id }));

        if (!userData)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Data Not Found"),
                ],
            });

        interaction.editReply({
            embeds: [
                userRepEmbed({
                    userData,
                    guildData: await guildModel.findOne({
                        id: interaction.guildId,
                    }),
                    rank: await userModel.countDocuments({
                        reputation: { $gt: userData.reputation },
                    }),
                    reps: await reputationModel
                        .find({ target: id, isValid: true }, { category: 1 })
                        .lean(),
                    viewer: interaction.user,
                }),
            ],
        });
    } else if (type === "validate") {
        if (!member.roles.cache.has(process.env.STAFF_ROLE))
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: "❌ Not Allowed",
                        description: "You are not allowed to use this command",
                    }).setColor("Red"),
                ],
            });

        await interaction.deferReply({ ephemeral: true });

        const data = await reputationModel.findOne({ id });

        if (data.isValid)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Already Validated"),
                ],
            });

        const userData = await userModel.findOneAndUpdate(
            { id: data.target },
            { $inc: { reputation: 1, staffReputation: data.staff ? 1 : 0 } },
            { new: true, upsert: true }
        );
        const repData = await reputationModel.findOneAndUpdate(
            { id },
            {
                isValid: true,
                revalidatedBy: interaction.user.id,
                updatedAt: Date.now(),
            },
            { new: true }
        );

        await updateMessages({ client, data: repData, userData });

        await updateReputation({ client, userData });

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("✅ Reputation Revalidated"),
            ],
        });
    } else if (type === "invalidate") {
        if (!member.roles.cache.has(process.env.STAFF_ROLE))
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: "❌ Not Allowed",
                        description: "You are not allowed to use this command",
                    }).setColor("Red"),
                ],
            });

        // const [____, reason] = await chooseRepReason({ interaction });
        const reason = "Not Valid";

        const data = await reputationModel.findOne({ id });

        if (!data.isValid)
            return interaction.reply({
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Already Invalidated"),
                ],
            });

        await interaction.deferReply({ ephemeral: true });

        const userData = await userModel.findOneAndUpdate(
            { id: data.target },
            { $inc: { reputation: -1, staffReputation: data.staff ? -1 : 0 } },
            { new: true, upsert: true }
        );
        const repData = await reputationModel.findOneAndUpdate(
            { id },
            {
                isValid: false,
                invalidatedBy: interaction.user.id,
                updatedAt: Date.now(),
                "reason.remove": reason,
            },
            { new: true }
        );

        await updateMessages({ client, data: repData, userData });

        await updateReputation({ client, userData });

        interaction.followUp({
            ephemeral: true,
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("✅ Reputation Invalidated"),
            ],
        });
    }
};
