const { GetPrefix } = require("../utils/data_handler");

module.exports = {
    name: "messageCreate",
    async execute(client, message) {
        const prefix = await GetPrefix(message.guild.id);

        if (message.author.bot) return;
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);

        if (command?.executeMessage) {
            try {
                await command.executeMessage(message, args);
            } catch (error) {
                console.error(error);
                message.reply("❌ Error executing prefix command.");
            }
        }
    },
};
