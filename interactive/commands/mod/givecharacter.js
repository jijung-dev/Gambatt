import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
    addCharacterToCollection,
    getRarityValue,
} from "#utils/userdata_handler.js";
import { getUser, toCodeBlock } from "#utils/data_utils.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { getCharacter, hasCharacter } from "#utils/characterdata_handler.js";
import { getEmbedCharacterNotFound } from "#utils/errorembeds.js";
import { rarityIcons } from "#utils/data_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("givecharacter")
        .setDescription("Give a character to an user")
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
    name: "givecharacter",
    aliases: [],

    async execute(interaction) {
        const user = interaction.options.getUser("user_id") || interaction.user;
        const charvalue = interaction.options.getString("charvalue");
        await replyGiveCharacter(interaction, user, charvalue);
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
        await replyGiveCharacter(message, user, charvalue);
    },
    help: getHelpEmbed(),
    type: "Mod",
};

async function replyGiveCharacter(target, user, charvalue) {
    if (!user) {
        return target.reply("⚠️ Invalid user ID.");
    }
    if (!charvalue) {
        return target.reply({ embeds: [getHelpEmbed()] });
    }
    if (!(await hasCharacter(charvalue))) {
        return target.reply({ embeds: [getEmbedCharacterNotFound(charvalue)] });
    }
    const character = await getCharacter(charvalue);

    const charStatus = await addCharacterToCollection(
        user,
        charvalue,
        character.rarity
    );

    const finalEmbed = getGiveCharacterEmbed(user, character, charStatus);
    return target.reply({
        embeds: [finalEmbed],
    });
}

function getGiveCharacterEmbed(user, character, charStatus) {
    const rarityIcon = rarityIcons[character.rarity];
    const fields = [
        { name: "Character", value: toCodeBlock(character.label) },
        { name: "Series", value: toCodeBlock(character.series) },
        { name: "Edition", value: toCodeBlock(character.edition) },
    ];
    const rarityValue = getRarityValue(character.rarity);
    const status = charStatus.isFirstTime
        ? "🆕 New!"
        : charStatus.isLevelUp
        ? "⬆️ Level Up!"
        : "🔁 Duplicate";

    if (!charStatus.isFirstTime) {
        if (charStatus.isLevelUp) {
            fields.push({
                name: "Level Up",
                value: `Lv.${charStatus.character.level - 1} → **Lv.${
                    charStatus.character.level
                }**`,
            });
        } else {
            fields.push({
                name: "Bonus",
                value: `+ \`${rarityValue.addValue}\` xp`,
            });
        }
    }

    return new EmbedBuilder()
        .setTitle(`Given | ${status}`)
        .setColor(rarityIcon.color)
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        .addFields(fields)
        .setImage(character.image)
        .setFooter({
            text: `${character.value}`,
        })
        .setThumbnail(rarityIcon.image);
}

function getHelpEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("givecharacter")
        .withDescription("Give a character to an user")
        .withAliase(["givecharacter"])
        .withExampleUsage("$givecharacter @JiJung ninomae_inanis")
        .withUsage("**/givecharacter** `@user | [user_id]` `[character_value]`")
        .build();
    return helpEmbed;
}
