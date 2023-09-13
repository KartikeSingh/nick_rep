const guildModel = require("../../models/guildModel");
const reputationModel = require("../../models/reputationModel");
const userModel = require("../../models/userModel");
const userRepEmbed = require("../../utility/userRepEmbed");

module.exports = {
    data: {
        name: "reps",
        description: "View reps of a user",
        options: [{
            name: "user",
            type: 6,
            description: "User who's reps you want to view",
        }],
    },
    timeout: 1000,

    run: async (client, interaction) => {
        await interaction.deferReply({ });

        const user = interaction.options.getUser("user") || interaction.user;
        const userData = await userModel.findOne({ id: user.id });

        if (!userData) return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Data Not Found")
            ]
        });

        interaction.editReply({
            embeds: [
                userRepEmbed({
                    userData,
                    guildData: await guildModel.findOne({ id: interaction.guildId }),
                    rank: await userModel.countDocuments({ reputation: { $gt: userData.reputation } }),
                    reps: await reputationModel.find({ target: user.id, isValid: true }, { category: 1 }).lean(),
                    viewer: interaction.user
                })
            ]
        }); 
    }
}