import { GetPrefix } from "../utils/data_handler.js";

export default {
    name: "messageCreate",
    async execute(client, message) {
        // ignore bots
        if (message.author.bot) return;

        const prefix = await GetPrefix(message.guild.id);

        // ignore if it doesn’t start with prefix
        if (!message.content.startsWith(prefix)) return;

        // parse command + args
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) return;

        // Fetch the command
        const command = client.commands.get(commandName);

        // ✅ Auto-detect handler: supports wrapped or unwrapped
        const handler =
            command?.executeMessage ||          // normal
            command?.default?.executeMessage || // wrapped under `.default`
            null;

        if (!handler) return; // no prefix command found

        try {
            await handler(message, args);
        } catch (error) {
            console.error(error);
            await message.reply("❌ Error executing prefix command.");
        }
    },
};
