const { EmbedBuilder } = require("discord.js");

module.exports = ({ userData, reps, guildData, rank, viewer }) => new EmbedBuilder()
    .setTitle("Rep Stats")
    .setDescription(`<@${userData.id}> have \`${userData.reputation}\` reps!`)
    .addFields({
        name: "👤 Total Reps",
        value: `\`${userData.reputation}\``,
    }, {
        name: "🕵️ Staff Reps",
        value: `\`${userData.staffReputation}\``,
    }, {
        name: "👷 Reps by Category",
        value: guildData.categories.map(c => `- **${c.label}:** \`${reps.filter(v => v.category === c.label).length}\``).join("\n") || "`No Categories`",
    }, {
        name: `${["🥇", "🥈", "🥉"][rank] || "🎖️"} Leaderboard`,
        value: `Rank **#${rank + 1}** in the server`,
    })
    .setFooter({
        text: `Checked By @${viewer.username}`
    })
    .setTimestamp()