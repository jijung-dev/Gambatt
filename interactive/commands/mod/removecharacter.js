import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
    addCharacterToCollection,
    hasCharacterInCollection,
    removeCharacterFromCollection,
} from "#utils/userdata_handler.js";
import { getUser } from "#utils/data_utils.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import {
    getEmbedCharacterNotFound,
    getEmbedCharacterNotOwned,
} from "#utils/errorembeds.js";
import { hasCharacter } from "#utils/characterdata_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("removecharacter")
        .setDescription("Remove a character from an user")
        .addUserOption((option) =>
            option
                .setName("user_id")
                .setDescription("user_id")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("charvalue")
                .setDescription("charvalue")
                .setRequired(true)
        ),
    name: "removecharacter",
    aliases: [],

    async execute(interaction) {
        const user = interaction.options.getUser("user_id") || interaction.user;
        const charvalue = interaction.options.getString("charvalue");
        await replyRemoveCharacter(interaction, user, charvalue);
    },

    async executeMessage(message, args) {
        let user;
        let charvalue;

        if (args?.[0]) {
            user = await getUser(message, args[0]);
        }
        if (args?.[1]) {
            charvalue = args[1];
        }
        await replyRemoveCharacter(message, user, charvalue);
    },
    help: getHelpEmbed(),
    type: "Mod",
};

async function replyRemoveCharacter(target, user, charvalue) {
    if (!user) {
        return target.reply("⚠️ Invalid user ID.");
    }
    if (!charvalue) {
        return target.reply({ embeds: [getHelpEmbed()] });
    }
    if (!(await hasCharacter(charvalue))) {
        return target.reply({ embeds: [getEmbedCharacterNotFound(charvalue)] });
    }
    if (!(await hasCharacterInCollection(user, charvalue))) {
        return target.reply({ embeds: [getEmbedCharacterNotOwned(charvalue)] });
    }

    await removeCharacterFromCollection(user, charvalue);

    const finalEmbed = getRemoveCharacterEmbed(user, charvalue);
    return target.reply({
        embeds: [finalEmbed],
    });
}

function getRemoveCharacterEmbed(user, charValue) {
    return new EmbedBuilder()
        .setTitle(`✅ Removed Character from ${user.username}\'s collection`)
        .setDescription(`\`${charValue}\``)
        .setColor("#f50000");
}

function getHelpEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("removecharacter")
        .withDescription("Give a character to an user")
        .withAliase(["removecharacter"])
        .withExampleUsage("$removecharacter @JiJung ninomae_inanis")
        .withUsage(
            "**/removecharacter** `@user | u:[user_id]` `[character_value]`"
        )
        .build();
    return helpEmbed;
}
