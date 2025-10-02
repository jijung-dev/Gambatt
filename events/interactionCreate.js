const { MessageFlags } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    async execute(client, interaction) {
        try {
            // 1. block interaction theft
            if (interaction.isButton() || interaction.isStringSelectMenu()) {
                const [, originalUserId] = interaction.customId.split("|");

                if (interaction.user.id !== originalUserId) {
                    return interaction.reply({
                        content: "⛔ this interaction is not for you.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }

            // 2. ensure player
            if (!interaction.user?.bot) {
                // let player = await GetPlayerData(interaction.user.id);
                // if (!player) {
                //     player = await StartPlayer(interaction.user.id);
                // }
            }

            // 3. selects
            if (interaction.isStringSelectMenu()) {
                let handler = client.selects?.get(interaction.customId);
                if (!handler) {
                    // fallback: match by prefix before "_"
                    const prefix = interaction.customId.split("|")[0];
                    handler = client.selects?.get(prefix);
                }
                if (handler) return handler.execute(interaction, client);
            }

            // 4. buttons
            if (interaction.isButton()) {
                let handler = client.buttons?.get(interaction.customId);
                if (!handler) {
                    const prefix = interaction.customId.split("|")[0];
                    handler = client.buttons?.get(prefix);
                }
                if (handler) return handler.execute(interaction, client);
            }

            // 5. slash commands
            if (!interaction.isChatInputCommand()) return;

            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(
                    `No command matching ${interaction.commandName} was found.`
                );
                return;
            }

            await command.execute(interaction);

            // 6. timeout disable
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

            // 7. error response
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
