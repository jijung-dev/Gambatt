import { MessageFlags } from "discord.js";

export default {
    name: "interactionCreate",
    async execute(client, interaction) {
        try {
            // block interaction theft
            if (interaction.isButton() || interaction.isStringSelectMenu()) {
                const [, originalUserId] = interaction.customId.split("|");

                if (interaction.user.id !== originalUserId) {
                    return interaction.reply({
                        content: "⛔ this interaction is not for you.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }

            // selects
            if (interaction.isStringSelectMenu()) {
                let handler = client.selects?.get(interaction.customId);
                if (!handler) {
                    const prefix = interaction.customId.split("|")[0];
                    handler = client.selects?.get(prefix);
                }
                if (handler?.default?.execute) {
                    return handler.default.execute(interaction, client);
                }
            }

            // buttons
            if (interaction.isButton()) {
                let handler = client.buttons?.get(interaction.customId);
                if (!handler) {
                    const prefix = interaction.customId.split("|")[0];
                    handler = client.buttons?.get(prefix);
                }
                if (handler?.default?.execute) {
                    return handler.default.execute(interaction, client);
                }
            }

            // slash commands
            if (!interaction.isChatInputCommand()) return;

            const commandName = interaction.commandName;

            // ✅ Disabled command check
            if (client.disabledCommands?.has(commandName)) {
                return interaction.reply({
                    content: `❌ The command \`${commandName}\` is not allowed right now.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            const command = client.commands.get(commandName);
            if (!command) {
                console.error(`No command matching ${commandName} was found.`);
                return;
            }
            await command.default.execute(interaction);

            // timeout disable
            setTimeout(async () => {
                try {
                    const msg = await interaction.fetchReply();
                    if (!msg || !msg.components.length) return;

                    const disabledComponents = msg.components.map((row) => {
                        row.components.forEach((c) => c.setDisabled(true));
                        return row;
                    });

                    await msg.edit({ components: disabledComponents });
                } catch (err) {
                    console.error(
                        "Failed to disable interaction components:",
                        err
                    );
                }
            }, 120000);
        } catch (error) {
            console.error(error);
            const replyPayload = {
                content: "There was an error while executing this command!",
                flags: MessageFlags.Ephemeral,
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(replyPayload);
            } else {
                await interaction.reply(replyPayload);
            }
        }
    },
};
