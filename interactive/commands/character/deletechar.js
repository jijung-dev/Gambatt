import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { removeCharacter, hasCharacter } from "#utils/characterdata_handler.js";
import { getEmbedCharacterNotFound } from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName("deletechar")
        .setDescription("Remove an existing character in the database.")
        .addStringOption((option) =>
            option
                .setName("charvalue")
                .setRequired(true)
                .setDescription("Character key (unique ID)")
        ),

    name: "deletechar",
    aliases: ["dc"],

    async execute(interaction) {
        const charvalue = interaction.options.getString("charvalue");

        await replyDeleteChar(interaction, charvalue);
    },

    async executeMessage(message, args) {
        const characterValue = args?.[0];
        await replyDeleteChar(message, characterValue);
    },
    help: getFailedEmbed(),
    type: "Character",
};

// ------------------------------ MAIN ------------------------------

async function replyDeleteChar(target, charvalue) {
    if (!charvalue) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }
    if (!(await hasCharacter(charvalue))) {
        return target.reply({ embeds: [getEmbedCharacterNotFound(charvalue)] });
    }

    await removeCharacter(charvalue);

    return target.reply({ embeds: [getDeleteCharacterEmbed(charvalue)] });
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("deletechar")
        .withDescription(
            "Delete an existing character. **DELETION CAN'T BE UNDONE**"
        )
        .withAliase(["dc", "deletechar"])
        .withExampleUsage("$deletechar ninomae_inanis")
        .withUsage("**/deletechar** `[character_value]`")
        .build();
    return helpEmbed;
}

function getDeleteCharacterEmbed(character) {
    return new EmbedBuilder()
        .setTitle("✅ Removed Character")
        .setDescription(`\`${character}\``)
        .setColor("#f50000");
}
