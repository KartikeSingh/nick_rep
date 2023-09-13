module.exports = async ({ interaction, data, parseInput = (int) => int.values[0], filter = (int) => int.user.id === interaction.user.id, time = 60000, reply = 0, interactionFunction = "editReply", modal = false }) => new Promise(async resolve => {
    await interaction[interactionFunction](data);

    const collector = modal ? await interaction.awaitModalSubmit({ filter, time }).catch(() => null) : interaction.channel.createMessageComponentCollector({ filter, time });

    if (modal) {
        if (collector) return resolve([
            null,
            parseInput(collector)
        ]);

        await collector.reply({
            ephermal: true,
            content: "Response Collected"
        });

        resolve([
            null,
            null
        ])
    }

    collector.on("collect", int => {
        if (reply === 0) int.deferUpdate();
        else if (reply === 1) int.update({});

        collector.stop()
    });

    collector.on("end", (collected, reason) => {
        const interaction = collected.first ? collected.first() : collected;

        if (reason === "time") return resolve([
            interaction,
            null
        ]);

        resolve([
            interaction,
            parseInput(interaction)
        ]);
    })
});