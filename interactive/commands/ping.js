import { SlashCommandBuilder } from "discord.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

export default {
    data: new SlashCommandBuilder().setName("ping").setDescription("Pong"),

    name: "ping",
    aliases: [],

    async execute(interaction) {
        await interaction.reply("Pong");
    },

    async executeMessage(message, args) {
        await message.reply("Pong");
    },
    help: getHelpEmbed(),
    type: "Test",
};

function getHelpEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("pong")
        .withDescription("Ping Pong")
        .withAliase(["ping"])
        .withExampleUsage("$ping")
        .withUsage("**/ping**")
        .build();
    return helpEmbed;
}
