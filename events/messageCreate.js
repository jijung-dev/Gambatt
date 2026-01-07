import { getPrefix, isRestricted } from "#utils/data_handler.js";
import { ErrorMessage } from "#utils/errorembeds.js";
import { PermissionFlagsBits } from "discord.js";

export default {
    name: "messageCreate",
    async execute(client, message) {
        if (message.author.bot || !message.guild) return;

        const prefix = await getPrefix(message.guild.id);
        if (!prefix || !message.content.startsWith(prefix)) return;

        /* -------------------- Parse Command -------------------- */
        const [rawCommand, ...args] = message.content
            .slice(prefix.length)
            .trim()
            .split(/\s+/);

        const commandName = rawCommand?.toLowerCase();
        if (!commandName) return;

        /* -------------------- Fetch Command -------------------- */
        const command = client.commands.get(commandName);
        if (!command) {
            console.error(`❌ No command matching "${commandName}" was found.`);
            return;
        }

        if (
            (await isRestricted(message.guild.id, message.channel.id)) &&
            command.default?.type != "Mod"
        ) {
            return message.reply({
                content: "🚫 Commands are disabled in this channel.",
            });
        }

        const mainName = command.default?.name ?? command.name;

        /* -------------------- Disabled Command Check -------------------- */
        if (mainName && client.disabledCommands?.has(mainName)) {
            return message.reply(
                `❌ The command \`${mainName}\` is not allowed right now.`
            );
        }

        /* -------------------- Permission Check -------------------- */
        if (
            command.default?.type === "Mod" &&
            !message.member?.permissions.has(PermissionFlagsBits.ManageGuild)
        ) {
            return message.reply(
                "⛔ You don't have permission to use this command!"
            );
        }

        /* -------------------- Execute Message Command -------------------- */
        const handler =
            command.executeMessage ?? command.default?.executeMessage;

        if (!handler) return;

        try {
            await handler(message, args);
        } catch (err) {
            await message.reply(ErrorMessage);
        }
    },
};
