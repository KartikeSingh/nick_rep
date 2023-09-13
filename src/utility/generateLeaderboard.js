const userModel = require("../models/userModel");

module.exports = async (user) => {
    const rawUsers = (await userModel.find({}).sort({ reputation: -1 }).lean()).map((v, i) => ({ ...v, rank: i + 1 }));

    if (user?.id && !rawUsers.find(v => v.id === user?.id)) {
        const newData = await userModel.create({ id: user.id });

        rawUsers.push({
            ...newData.toJSON(),
            rank: rawUsers.length + 1
        });
    }

    let users;

    if (user) {
        users = rawUsers.filter((v, i) => v.id === user?.id || [rawUsers[i + 1], rawUsers[i + 2], rawUsers[i - 1], rawUsers[i - 2]].some(v => v?.id && v?.id === user?.id))
    } else {
        users = rawUsers.slice(0, 50);
    }

    return {
        string: users.map(v => `${v.id === user?.id ? "__" : ""}${v.rank}| <@${v.id}>: | **${v.reputation} reps**${v.id === user?.id ? "__" : ""}`).join("\n"),
        rank: rawUsers.find(v => v.id === user?.id)?.rank,
    }
}