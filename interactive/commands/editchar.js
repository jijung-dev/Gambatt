import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "../../utils/data_handler.js";
import { EditCharacter, Character, GetCharacter } from "../../utils/characterdata_handler.js";
import { toCodeBlock } from "../../utils/data_utils.js";

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

        await ReplyEditChar(interaction, {
            charvalue,
            charname,
            edition,
            series,
            rarity,
            image_link,
        });
    },

    async executeMessage(message, args) {
        const characterValue = parseEditCharArgs(args);
        await ReplyEditChar(message, characterValue);
    },
};

// ------------------------------ MAIN ------------------------------

async function ReplyEditChar(
    target,
    { charvalue, charname, edition, series, rarity, image_link }
) {
    if (!charvalue) {
        return target.reply({ embeds: [GetFailedEmbed()] });
    }
    const oldChar = await GetCharacter(charvalue);

    const updates = {};
    if (charname) updates.label = charname;
    if (edition) updates.edition = edition;
    if (series) updates.series = series;
    if (rarity) updates.rarity = rarity;
    if (image_link) updates.image = image_link;

    EditCharacter(charvalue, updates);
    const updatedChar = new Character(
        charvalue,
        charname || oldChar.label,
        series || oldChar.series,
        rarity || oldChar.rarity,
        image_link || oldChar.image,
        edition || oldChar.edition
    );

    return target.reply({ embeds: [GetEditCharacterEmbed(updatedChar)] });
}

function GetFailedEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ Missing arguments")
        .setDescription(
            "$editchar c:ninomae_inanis <n:Ninomae Ina'nis> <s:Hololive> <r:sr> <e:Normal> <l:image link>```"
        )
        .setFooter("Anything in <> is optional")
        .setColor("#f50000");
}

function GetEditCharacterEmbed(character) {
    const rarityIcon = rarityIcons[character.rarity] || {
        image: "",
        color: "#ffffff",
    };

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
            },
            {
                name: "Rarity",
                value: toCodeBlock(character.rarity),
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

// ------------------------------ ARG PARSER ------------------------------

function parseEditCharArgs(args) {
    let charnameParts = [];
    let editionParts = [];
    let seriesParts = [];
    let rarity = null;
    let charValue = null;
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
            charValue = part.slice(2);
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

    return {
        charvalue: charValue,
        charname,
        edition,
        series,
        rarity,
        image_link,
    };
}
