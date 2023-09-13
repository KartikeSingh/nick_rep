const userModel = require("../models/userModel");
const updateBoards = require("../utility/updateBoards");
const updateRoles = require("../utility/updateRoles");

module.exports = async (client) => {
    console.log(`${client.user.tag} is online!`);

    client.application.commands.set(client.commands.map(v => v.data));

    client.log = {
        admin: client.channels.cache.get(process.env.ADMIN_CHANNEL),
        public: client.channels.cache.get(process.env.PUBLIC_CHANNEL),
    }

    updateBoards(client);

    const users = await userModel.find();

    for (const user of users) {
        updateRoles({ client, userData: user });
    }
}
