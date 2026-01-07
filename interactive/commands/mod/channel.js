import { SlashCommandBuilder } from "discord.js";
import { setRestrict } from "#utils/data_handler.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { ErrorMessage } from "#utils/errorembeds.js";
import { parseArgs } from "#utils/input_parser.js";

export default {
    data: new SlashCommandBuilder()
        .setName("channel")
        .setDescription("Channel config")
        .addBooleanOption((option) =>
            option
                .setName("mode")
                .setDescription("Enable or disable bot usage in this channel")
                .setRequired(true)
        ),

    name: "channel",
    aliases: [],

    async execute(interaction) {
        const enabled = interaction.options.getBoolean("enabled");

        const success = await setRestrict(
            interaction.guild.id,
            interaction.channel.id,
            !enabled
        );

        if (!success) {
            return interaction.reply(ErrorMessage);
        }

        return interaction.reply({
            content: enabled
                ? `Bot commands are now **enabled** in ${interaction.channel}`
                : `Bot commands are now **disabled** in ${interaction.channel}`,
        });
    },

    async executeMessage(message, arg) {
        const { channel } = parseArgs(arg);
        const enabled = channel.mode;

        const success = await setRestrict(
            message.guild.id,
            message.channel.id,
            !enabled
        );

        if (!success) {
            return message.reply(ErrorMessage);
        }

        return message.reply({
            content: enabled
                ? `Bot commands are now **enabled** in ${message.channel}`
                : `Bot commands are now **disabled** in ${message.channel}`,
        });
    },

    help: getHelpEmbed(),
    type: "Mod",
};

function getHelpEmbed() {
    return new HelpEmbedBuilder()
        .withName("channel")
        .withDescription("Channel config")
        .withAliase(["channel"])
        .withExampleUsage("$channel mode:true")
        .withUsage("**/channel** `<mode:[true/false]>`")
        .build();
}
