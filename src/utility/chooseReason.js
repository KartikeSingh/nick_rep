const { ActionRowBuilder, ModalBuilder, TextInputBuilder } = require("discord.js")
const acceptInput = require("./acceptInput")

module.exports = async ({ interaction, guildData, category }) => await acceptInput({
    interaction,
    parseInput: (int) => int.fields.getTextInputValue("reason"),
    data: new ModalBuilder({
        customId: "modal",
        title: "Reputation Reason",
        components: [
            new ActionRowBuilder({
                components: [
                    new TextInputBuilder({
                        customId: "reason",
                        label: "Reason",
                        required: true,
                        style: 2,
                        placeholder: guildData.categories.find(v => v.label === category)?.placeholder || "Reason for giving this reputation"
                    })
                ]
            })
        ]
    }),
    reply: 0,
    interactionFunction: "showModal",
    collectorFunction: "awaitModalSubmit",
    modal: true
});