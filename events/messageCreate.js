import { GetPrefix } from "#utils/data_handler.js";

export default {
    name: "messageCreate",
    async execute(client, message) {
        if (message.author.bot) return;

        const prefix = await GetPrefix(message.guild.id);
        if (!message.content.startsWith(prefix)) return;

        /* -------------------- Command Parse -------------------- */
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) return;

        /* -------------------- Command Fetch -------------------- */
        const command = client.commands.get(commandName);

        //disable command checks
        const mainCommandName = command?.default?.name || command?.name;
        if (mainCommandName && client.disabledCommands?.has(mainCommandName)) {
            return message.reply(
                `❌ The command \`${mainCommandName}\` is not allowed right now.`
            );
        }

        //mod-only command checks
        if (
            !message.member.permissions.has("ManageGuild") &&
            command?.default?.type == "Mod"
        ) {
            return message.reply(
                "⛔ You don't have permission to use this command!"
            );
        }

        /* -------------------- Message Command Handler -------------------- */
        const handler =
            command?.executeMessage || // normal
            command?.default?.executeMessage || // wrapped under `.default`
            null;

        if (!handler) return;

        try {
            await handler(message, args);
        } catch (error) {
            console.error(error);
            await message.reply("❌ Error executing prefix command.");
        }
    },
};
