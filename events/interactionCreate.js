import { isRestricted } from "#utils/data_handler.js";
import { ErrorMessage } from "#utils/errorembeds.js";
import { MessageFlags, PermissionFlagsBits } from "discord.js";

function getHandler(map, customId) {
    return map?.get(customId) ?? map?.get(customId.split("|")[0]);
}

export default {
    name: "interactionCreate",
    async execute(client, interaction) {
        try {
            /* -------------------- Block Interaction Theft -------------------- */
            if (interaction.isButton() || interaction.isStringSelectMenu()) {
                const [, originalUserId] = interaction.customId.split("|");

                if (originalUserId && interaction.user.id !== originalUserId) {
                    return interaction.reply({
                        content: "⛔ This interaction is not for you.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }

            /* -------------------- Select Menu Handler -------------------- */
            if (interaction.isStringSelectMenu()) {
                const handler = getHandler(
                    client.selects,
                    interaction.customId
                );
                return handler?.default?.execute?.(interaction, client);
            }

            /* -------------------- Button Handler -------------------- */
            if (interaction.isButton()) {
                const handler = getHandler(
                    client.buttons,
                    interaction.customId
                );
                return handler?.default?.execute?.(interaction, client);
            }

            /* -------------------- Slash Command Handler -------------------- */
            if (!interaction.isChatInputCommand()) return;
            const { commandName, memberPermissions } = interaction;

            const command = client.commands.get(commandName);
            if (!command) {
                console.error(
                    `❌ No command matching "${commandName}" was found.`
                );
                return;
            }

            if (
                await isRestricted(interaction.guild.id, interaction.channel.id) && commandName != "channel"
            ) {
                return interaction.reply({
                    content: "🚫 Commands are disabled in this channel.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (client.disabledCommands?.has(commandName)) {
                return interaction.reply({
                    content: `❌ The command \`${commandName}\` is not allowed right now.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (
                command.default?.type === "Mod" &&
                !memberPermissions?.has(PermissionFlagsBits.ManageGuild)
            ) {
                return interaction.reply({
                    content:
                        "⛔ You don't have permission to use this command!",
                    flags: MessageFlags.Ephemeral,
                });
            }

            await command.default.execute(interaction);

            /* -------------------- Auto-disable Components -------------------- */
            setTimeout(async () => {
                try {
                    const msg = await interaction.fetchReply();
                    if (!msg?.components?.length) return;

                    msg.components.forEach((row) =>
                        row.components.forEach((c) => c.setDisabled(true))
                    );

                    await msg.edit({ components: msg.components });
                } catch (err) {
                    console.error(
                        "Failed to disable interaction components:",
                        err
                    );
                }
            }, 120_000);
        } catch (error) {
            console.error(error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(ErrorMessage);
            } else {
                await interaction.reply(ErrorMessage);
            }
        }
    },
};
