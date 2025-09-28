const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with haha!"),

    name: "ping", 
    aliases: ["pong", "p"],

    async execute(interaction) {
        await interaction.reply("haha!");
    },

    async executeMessage(message, args) {
        await message.reply("haha!");
    },
};
