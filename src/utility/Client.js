// Imports
const { join } = require('path');
const { readdirSync } = require('fs');

const Discord = require('discord.js');

module.exports = class Client extends Discord.Client {
    events = readdirSync(join(__dirname, "../events"));
    categories = readdirSync(join(__dirname, "../commands"));

    owners = ["723049421021118535"];
    
    commands = new Discord.Collection();
    timeouts = new Discord.Collection();

    icons = {
        right:"https://cdn.discordapp.com/attachments/723104565708324915/1145337527025278976/800px-Eo_circle_green_checkmark.png",
        wrong:"https://cdn.discordapp.com/attachments/723104565708324915/1145337577516318761/round-cross-mark-symbol-with-transparent-background-free-png.png"
    }

    constructor(options) {
        super(options);

        for (let i = 0; i < this.categories.length; i++) {
            const commands = readdirSync(join(__dirname, `../commands/${this.categories[i]}`));

            for (let j = 0; j < commands.length; j++) {
                const command = require(`../commands/${this.categories[i]}/${commands[j]}`);

                if (!command || !command.run || !command.data) continue;

                command.category = this.categories[i]

                this.commands.set(command.data.name, command);
            }
        }

        for (let i = 0; i < this.events.length; i++) {
            const event = require(`../events/${this.events[i]}`);

            if (typeof event !== "function") continue;

            this.on(this.events[i].split(".")[0], (...args) => event(this, ...args));
        }
    }
}