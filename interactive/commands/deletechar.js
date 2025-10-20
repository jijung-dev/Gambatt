import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
    RemoveCharacter,
    HasCharacter,
} from "../../utils/characterdata_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("removechar")
        .setDescription("Edit an existing character in the database.")
        .addStringOption((option) =>
            option
                .setName("charvalue")
                .setRequired(true)
                .setDescription("Character key (unique ID)")
        ),

    name: "removechar",
    aliases: ["rc"],

    async execute(interaction) {
        const charvalue = interaction.options.getString("charvalue");

        await ReplyRemoveChar(interaction, charvalue);
    },

    async executeMessage(message, args) {
        const characterValue = args?.[0];
        await ReplyRemoveChar(message, characterValue);
    },
};

// ------------------------------ MAIN ------------------------------

async function ReplyRemoveChar(target, charvalue) {
    if (!charvalue || !(await HasCharacter(charvalue))) {
        return target.reply({ embeds: [GetFailedEmbed()] });
    }

    await RemoveCharacter(charvalue);

    return target.reply({ embeds: [GetRemoveCharacterEmbed(charvalue)] });
}

function GetFailedEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ Missing arguments")
        .setDescription("$removechar ninomae_inanis```")
        .setColor("#f50000");
}

function GetRemoveCharacterEmbed(character) {
    return new EmbedBuilder()
        .setTitle("✅ Removed Character")
        .setDescription(`\`\`\`${character}\`\`\``)
        .setColor("#f50000");
}
