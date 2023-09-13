const updateBoards = require("./updateBoards");
const updateRoles = require("./updateRoles");

let timer = null;

module.exports = async ({ client, user }) => {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => main({ client, user }), 3000);
}

async function main({ client, user }) {
    lastUpdate = Date.now();

    // Update leaderboard
    updateBoards(client);

    // Update rep roles
    if (user) await updateRoles({client,user})
}
