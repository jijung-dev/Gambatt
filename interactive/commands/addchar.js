import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "../../utils/data_handler.js";
import { AddCharacter, Character } from "../../utils/characterdata_handler.js";
import { toCodeBlock } from "../../utils/data_utils.js";

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

        await ReplyAddChar(interaction, {
            charvalue,
            charname,
            edition,
            series,
            rarity,
            image_link,
        });
    },

    async executeMessage(message, args) {
        const characterValue = parseAddCharArgs(args);
        
        await ReplyAddChar(message, characterValue);
    },
};

// ------------------------------ MAIN ------------------------------

async function ReplyAddChar(
    target,
    { charvalue, charname, edition, series, rarity, image_link }
) {
    if (
        !charvalue ||
        !charname ||
        !edition ||
        !series ||
        !rarity ||
        !image_link
    ) {
        return target.reply({ embeds: [GetFailedEmbed()] });
    }

    const char = new Character(
        charvalue,
        charname,
        series,
        rarity,
        image_link,
        edition
    );

    AddCharacter({
        value: charvalue,
        label: charname,
        series: series,
        rarity: rarity,
        image: image_link,
        edition: edition,
    });

    return target.reply({ embeds: [GetCharacterEmbed(char)] });
}

function GetFailedEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ Missing arguments")
        .setDescription("\`\`\`$addchar c:ninomae_inanis n:Ninomae Ina'nis s:Hololive r:sr e:Normal l:image link\`\`\`")
        .setColor("#f50000");
}

function GetCharacterEmbed(character) {
    const rarityIcon = rarityIcons[character.rarity] || {
        image: "",
        color: "#ffffff",
    };

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
        .setColor(rarityIcon.color);
}

// ------------------------------ ARG PARSER ------------------------------

function parseAddCharArgs(args) {
    let charnameParts = [];
    let editionParts = [];
    let seriesParts = [];
    let rarity = null;
    let charvalue = null;
    let image_link = null;

    let mode = null;

    for (const part of args) {
        if (part.startsWith("e:")) {
            mode = "edition";
            editionParts.push(part.slice(2));
        } else if (part.startsWith("s:")) {
            mode = "series";
            seriesParts.push(part.slice(2));
        } else if (part.startsWith("n:")) {
            mode = "name";
            charnameParts.push(part.slice(2));
        } else if (part.startsWith("r:")) {
            mode = null;
            rarity = part.slice(2);
        } else if (part.startsWith("c:")) {
            mode = null;
            charvalue = part.slice(2);
        } else if (part.startsWith("l:")) {
            mode = null;
            image_link = part.slice(2);
        } else {
            if (mode === "edition") editionParts.push(part);
            else if (mode === "series") seriesParts.push(part);
            else if (mode === "name") charnameParts.push(part);
        }
    }

    const charname = charnameParts.join(" ").trim() || null;
    const edition = editionParts.join(" ").trim() || null;
    const series = seriesParts.join(" ").trim() || null;

    return { charvalue, charname, edition, series, rarity, image_link };
}
