const { EmbedBuilder } = require("discord.js");
const reputationModel = require("../../models/reputationModel");

module.exports = {
    data: {
        name: "rep-lookup",
        description: "Lookup a reputation",
        options: [{
            name: "id",
            type: 3,
            description: "ID of the reputation",
            required: true,
        }],
    },
    timeout: 1000,

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const id = interaction.options.getString("id");
        const data = await reputationModel.findOne({ id });

        if (!data) return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Reputation not found")
            ]
        });

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Random")
                    .setTitle(`Rep Lookup: ${data.id}`)
                    .addFields({
                        name: "Sender",
                        value: `<@${data.sender}> (${data.sender})`,
                        inline: true
                    }, {
                        name: "Reciver",
                        value: `<@${data.target}> (${data.target})`,
                        inline: true
                    }, {
                        name: "Staff",
                        value: `${data.staff}`,
                        inline: true
                    }, {
                        name: "👷 Service",
                        value: `\`${data.category}\``,
                        inline: true
                    }, {
                        name: "🚦 Status",
                        value: `\`${data.isValid ? "V" : "Inv"}alid\``,
                        inline: true
                    }, {
                        name: "🗨️ Reason",
                        value: `\`${data.reason.give}\``,
                        inline: true
                    }, {
                        name: "❌ Invalidate By",
                        value: data.invalidatedBy ? `<@${data.invalidatedBy}> ${data.reason.remove || ""}` : "No One",
                        inline: true
                    }, {
                        name: "✅ Revalidated By",
                        value: data.revalidatedBy ? `<@${data.revalidatedBy}>` : "No One",
                        inline: true
                    }, {
                        name: "⏲️ Last Updated",
                        value: data.updatedAt ? `<t:${Math.floor(data.updatedAt / 1000)}:R>` : "`Not Updated`",
                        inline: true
                    }, {
                        name: "🗨️ Reason",
                        value: `\`${data.reason.give}\``,
                        inline: true
                    }, {
                        name: "💬 Messages",
                        value: `[Admin](https://discord.com/channels/${client.log.admin.guild.id}/${client.log.admin.id}/${data.messages.admin})\n[Public](https://discord.com/channels/${client.log.public.guild.id}/${client.log.public.id}/${data.messages.public})`,
                        inline: true
                    })
                    .setTimestamp(data.createdAt)
            ]
        })
    }
}