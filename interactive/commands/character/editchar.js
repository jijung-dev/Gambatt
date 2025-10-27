import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "#utils/data_handler.js";
import {
    editCharacter,
    Character,
    getCharacter,
    hasCharacter,
} from "#utils/characterdata_handler.js";
import {
    checkNull,
    isAllowedImageDomain,
    parseArgs,
    toCodeBlock,
} from "#utils/data_utils.js";
import {
    getEmbedCharacterNotFound,
    getEmbedNotAllowedLink,
} from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName("editchar")
        .setDescription("Edit an existing character in the database.")
        .addStringOption((option) =>
            option
                .setName("charvalue")
                .setRequired(true)
                .setDescription("Character key (unique ID)")
        )
        .addStringOption((option) =>
            option
                .setName("charname")
                .setRequired(false)
                .setDescription("New display name (optional)")
        )
        .addStringOption((option) =>
            option
                .setName("edition")
                .setRequired(false)
                .setDescription("New edition (optional)")
        )
        .addStringOption((option) =>
            option
                .setName("series")
                .setRequired(false)
                .setDescription("New series (optional)")
        )
        .addStringOption((option) =>
            option
                .setName("rarity")
                .setRequired(false)
                .setDescription("New rarity (optional)")
        )
        .addStringOption((option) =>
            option
                .setName("image_link")
                .setRequired(false)
                .setDescription("New image link (optional)")
        ),

    name: "editchar",
    aliases: ["ec"],

    async execute(interaction) {
        const charvalue = interaction.options.getString("charvalue");
        const charname = interaction.options.getString("charname");
        const edition = interaction.options.getString("edition");
        const series = interaction.options.getString("series");
        const rarity = interaction.options.getString("rarity");
        const image_link = interaction.options.getString("image_link");

        await replyEditChar(interaction, {
            charvalue,
            charname,
            edition,
            series,
            rarity,
            image_link,
        });
    },

    async executeMessage(message, args) {
        const characterValue = parseArgs(args);
        await replyEditChar(message, characterValue);
    },
    help: getFailedEmbed(),
};

// ------------------------------ MAIN ------------------------------

async function replyEditChar(
    target,
    { charvalue, charname, edition, series, rarity, image_link }
) {
    if (
        !charvalue ||
        !checkNull("or", charname, edition, series, rarity, image_link)
    ) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }
    if (!(await hasCharacter(charvalue))) {
        return target.reply({ embeds: [getEmbedCharacterNotFound(charvalue)] });
    }
    if (image_link && !isAllowedImageDomain(image_link)) {
        return target.reply({ embeds: [getEmbedNotAllowedLink()] });
    }

    const updates = {};
    if (charname) updates.label = charname;
    if (edition) updates.edition = edition;
    if (series) updates.series = series;
    if (rarity) updates.rarity = rarity;
    if (image_link) updates.image = image_link;

    const character = await editCharacter(charvalue, updates);

    return target.reply({
        embeds: [getEditCharacterEmbed(character)],
    });
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("editchar")
        .withDescription("Edit an existing character")
        .withAliase(["ec", "editchar"])
        .withExampleUsage(
            "$editchar c:ninomae_inanis n:Ninomae Ina'nis s:Hololive r:sr e:Normal l:image link"
        )
        .withUsage(
            "**/editchar** `c:[Character Value]` `<n:[Character Name]>` `<s:[Series]>` `<r:[rarity]>` `<e:[Edition]>` `<l:[Image Link]>`"
        )
        .build();
    return helpEmbed;
}

function getEditCharacterEmbed(character) {
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setTitle("✅ Edited Character")
        .addFields(
            {
                name: "Character",
                value: toCodeBlock(character.label),
                inline: false,
            },
            {
                name: "Series",
                value: toCodeBlock(character.series),
                inline: false,
            },
            {
                name: "Edition",
                value: toCodeBlock(character.edition),
                inline: false,
            }
        )
        .setThumbnail(rarityIcon.image)
        .setImage(character.image)
        .setFooter({
            text: `${character.value}`,
        })
        .setColor(rarityIcon.color);
}
