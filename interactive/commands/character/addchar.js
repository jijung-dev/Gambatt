import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "#utils/data_handler.js";
import { addCharacter, hasCharacter } from "#utils/characterdata_handler.js";
import {
    checkNull,
    isAllowedImageDomain,
    parseArgs,
    toCodeBlock,
} from "#utils/data_utils.js";
import {
    getEmbedCharacterAlreadyExist,
    getEmbedNotAllowedLink,
} from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName("addchar")
        .setDescription("Add a new character to the database.")
        .addStringOption((option) =>
            option
                .setName("charvalue")
                .setRequired(true)
                .setDescription("Character key (unique ID)")
        )
        .addStringOption((option) =>
            option
                .setName("charname")
                .setRequired(true)
                .setDescription("Character display name")
        )
        .addStringOption((option) =>
            option
                .setName("edition")
                .setRequired(true)
                .setDescription("Edition (e.g. Summer, Normal, Bunny)")
        )
        .addStringOption((option) =>
            option
                .setName("series")
                .setRequired(true)
                .setDescription("Series or franchise name")
        )
        .addStringOption((option) =>
            option
                .setName("rarity")
                .setRequired(true)
                .setDescription("Rarity (r, sr, ssr, etc.)")
        )
        .addStringOption((option) =>
            option
                .setName("image_link")
                .setRequired(true)
                .setDescription("Direct image link")
        ),

    name: "addchar",
    aliases: ["ac"],

    async execute(interaction) {
        const charvalue = interaction.options.getString("charvalue");
        const charname = interaction.options.getString("charname");
        const edition = interaction.options.getString("edition");
        const series = interaction.options.getString("series");
        const rarity = interaction.options.getString("rarity");
        const image_link = interaction.options.getString("image_link");

        await replyAddChar(interaction, {
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

        await replyAddChar(message, characterValue);
    },
    help: getFailedEmbed(),
};

// ------------------------------ MAIN ------------------------------

async function replyAddChar(
    target,
    { charvalue, charname, edition, series, rarity, image_link }
) {
    if (
        !checkNull("all", {
            charvalue,
            charname,
            edition,
            series,
            rarity,
            image_link,
        })
    ) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }

    if (await hasCharacter(charvalue)) {
        return target.reply({
            embeds: [getEmbedCharacterAlreadyExist(charvalue)],
        });
    }

    if (!isAllowedImageDomain(image_link)) {
        return target.reply({
            embeds: [getEmbedNotAllowedLink()],
        });
    }

    const character = await addCharacter({
        value: charvalue,
        label: charname,
        series: series,
        rarity: rarity,
        image: image_link,
        edition: edition,
    });

    return target.reply({
        embeds: [getCharacterEmbed(character)],
    });
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("addchar")
        .withDescription("Create a new character with provided properties.")
        .withAliase(["ac", "addchar"])
        .withExampleUsage(
            "$addchar c:ninomae_inanis n:Ninomae Ina'nis s:Hololive r:sr e:Normal l:image link"
        )
        .withUsage(
            "**/addchar** `c:[Character Value]` `n:[Character Name]` `s:[Series]` `r:[rarity]` `e:[Edition]` `l:[Image Link]`"
        )
        .build();
    return helpEmbed;
}

function getCharacterEmbed(character) {
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setThumbnail(rarityIcon.image)
        .setTitle("✅ Added Character")
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
        .setImage(character.image)
        .setFooter({
            text: `${character.value}`,
        })
        .setColor(rarityIcon.color);
}
