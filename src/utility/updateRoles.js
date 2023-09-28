const userModel = require("../models/userModel");

const rewardRoles = require("./roles");
const roleList = Object.values(rewardRoles);
const roleEntries = Object.entries(rewardRoles);

module.exports = async ({ client, user, userData }) => {
    const member = await client.log.admin.guild.members
        .fetch((user || userData).id)
        .catch(() => null);

    if (!member) return;

    userData =
        userData ||
        (await userModel.findOne({ id: user.id })) ||
        (await userModel.create({ id: user.id }));

    const oldRoles = member.roles.cache.map((v) => v.id);
    const newRoles = oldRoles.filter((v) => !roleList.includes(v));
    const rewardRole = roleEntries
        .filter((v) => v[0] <= userData.reputation)
        .sort((a, b) => b[0] - a[0])[0]?.[1];

    if (rewardRole) newRoles.push(rewardRole);

    if (
        newRoles.some((v) => !oldRoles.includes(v)) ||
        oldRoles.some((v) => !newRoles.includes(v))
    )
        await member.roles.set(newRoles, "Reputation Reward");
};
