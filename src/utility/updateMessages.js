const { EmbedBuilder } = require("discord.js");

module.exports = async ({ client, data, userData }) => {
    const adminMessage = await client.log.admin.messages.fetch(data.messages.admin).catch(() => null);

    if (adminMessage) {
        adminMessage?.edit({
            embeds: [
                new EmbedBuilder()
                    .setTitle("⭐ New Reputation Added")
                    .setDescription(adminMessage.embeds[0].description)
                    .addFields(adminMessage.embeds[0].fields.map((v, i) => i === 3 ? ({
                        name: "🚦 Status",
                        value: `\`${data.isValid ? "V" : "Inv"}alid\``,
                        inline: true
                    }) : v))
                    .setFooter({
                        text: `Rep ID: ${data.id}`,
                        iconURL: client.icons[data.isValid ? "right" : "wrong"]
                    })
                    .setThumbnail(adminMessage.embeds[0].thumbnail?.url)
                    .setTimestamp(new Date(adminMessage.embeds[0].timestamp).getTime()),
                new EmbedBuilder()
                    .setTitle("🔔 Latest Update")
                    .addFields({
                        name: "Updated By",
                        value: `<@${data[data.isValid ? "revalidatedBy" : "invalidatedBy"]}>`,
                        inline: true
                    }, {
                        name: "Updated",
                        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                        inline: true
                    }, {
                        name: data.isValid ? "\u200b" : "Reason",
                        value: data.isValid ? "\u200b" : data.reason.remove,
                        inline: true
                    })
            ],
        });
    }


    const publicMessage = await client.log.public.messages.fetch(data.messages.public).catch(() => null);;

    if (publicMessage) {
        await publicMessage.edit({
            embeds: [
                new EmbedBuilder()
                    .setTitle("⭐ New Reputation")
                    .setDescription(publicMessage.embeds[0].description.replace(/\`\d+\`/, `\`${userData.reputation}\``))
                    .setColor(data.isValid ? "Green" : "Red")
                    .addFields(adminMessage.embeds[0].fields.map((v, i) => i === 1 ? ({
                        name: "🚦 Status",
                        value: `\`${data.isValid ? "V" : "Inv"}alid\``,
                        inline: true
                    }) : v))
                    // .setFooter({
                    //     text: `Rep ID: ${repId}`,
                    //     iconURL: client.icons.right
                    // })
                    .setThumbnail(publicMessage.embeds[0].thumbnail?.url)
                    .setTimestamp()
            ]
        });
    }
}