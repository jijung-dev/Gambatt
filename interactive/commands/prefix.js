import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { SetPrefix } from "#utils/data_handler.js";

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
        if (
            !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
        ) {
            return interaction.reply(
                "⛔ You don't have permission to change the prefix!"
            );
        }

        const newPrefix = interaction.options.getString("prefix");
        SetPrefix(interaction.guild.id, newPrefix);

        await interaction.reply(`✅ Prefix changed to: \`${newPrefix}\``);
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has("ManageGuild")) {
            return message.reply(
                "⛔ You don't have permission to change the prefix!"
            );
        }

        const newPrefix = args?.[0];
        if (!newPrefix) return message.reply("❌ Please provide a new prefix!");

        SetPrefix(message.guild.id, newPrefix);
        await message.reply(`✅ Prefix changed to: \`${newPrefix}\``);
    },
    help: getHelpEmbed(),
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
