const { MessageFlags } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    async execute(client, interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const replyPayload = { content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(replyPayload);
            } else {
                await interaction.reply(replyPayload);
            }
        }
    },
};
