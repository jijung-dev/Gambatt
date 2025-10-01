const { MessageFlags } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    async execute(client, interaction) {
        if (
            (interaction.isButton() || interaction.isStringSelectMenu()) &&
            interaction.message?.interaction
        ) {
            const originalUserId = interaction.message.interaction.user.id;
            if (interaction.user.id !== originalUserId) {
                return interaction.reply({
                    content: "⛔ This interaction is not for you.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        if (interaction.isStringSelectMenu()) {
            const selectHandler = client.selects?.get(interaction.customId);
            if (selectHandler) {
                return selectHandler.execute(interaction, client);
            }
        }

        if (interaction.isButton()) {
            const buttonHandler = client.buttons?.get(interaction.customId);
            if (buttonHandler) {
                return buttonHandler.execute(interaction, client);
            }
        }

        if (!interaction.isChatInputCommand()) return;
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`
            );
            return;
        }

        try {
            await command.execute(interaction);

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
