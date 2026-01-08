import { SlashCommandBuilder } from "discord.js";
import { setPrefix } from "#utils/data_handler.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { ErrorMessage } from "#utils/errorembeds.js";

export default {
    data: new SlashCommandBuilder()
        .setName("prefix")
        .setDescription("Change the bot prefix")
        .addStringOption((option) =>
            option
                .setName("prefix")
                .setDescription("New prefix")
                .setRequired(true)
        ),

    name: "prefix",
    aliases: [],

    async execute(interaction) {
        const newPrefix = interaction.options.getString("prefix");
        if (!setPrefix(interaction.guild.id, newPrefix)) {
            console.log("[prefix]" + ErrorMessage);
            await interaction.reply(ErrorMessage);
        }

        await interaction.reply(`Prefix changed to: \`${newPrefix}\``);
    },

    async executeMessage(message, args) {
        const newPrefix = args?.[0];
        if (!newPrefix) return message.reply("❌ Please provide a new prefix!");

        if (!setPrefix(message.guild.id, newPrefix)) {
            console.log("[prefix]" + ErrorMessage);
            await interaction.reply(ErrorMessage);
        }
        await message.reply(`Prefix changed to: \`${newPrefix}\``);
    },
    help: getHelpEmbed(),
    type: "Mod",
};

function getHelpEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("prefix")
        .withDescription("Change server prefix")
        .withAliase(["prefix"])
        .withExampleUsage("$prefix .")
        .withUsage("**/prefix** `[Prefix]`")
        .build();
    return helpEmbed;
}
