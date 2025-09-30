const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
    GetCharacter,
    rarityIcons,
    GetCharacters,
} = require("../../utils/data_handler");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("view")
        .setDescription("View character")
        .addStringOption((option) =>
            option
                .setName("charname")
                .setDescription("Character name (required)")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("edition")
                .setDescription("Character edition (optional)")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("series")
                .setDescription("Character series (optional)")
                .setRequired(false)
        ),
    name: "view",
    aliases: ["v"],

    async execute(interaction) {
        const charname = interaction.options.getString("charname");
        const edition = interaction.options.getString("edition");
        const series = interaction.options.getString("series");

        await ReplyView(interaction, {
            charname,
            edition,
            series,
        });
    },

    async executeMessage(message, args) {
        const characterValue = parseViewArgs(args);
        await ReplyView(message, characterValue);
    },
};

async function ReplyView(target, { charname, edition, series }) {
    if (
        (!charname || charname.trim() === "") &&
        (!edition || edition.trim() === "") &&
        (!series || series.trim() === "")
    ) {
        return target.reply({
            content: "Use `.help view` for more info",
        });
    }

    const chars = await GetCharacters(charname, edition, series);
    let embed2;

    if (chars.length > 1) {
        embed2 = await GetMatchListEmbed(chars);
    } else if (chars.length == 0) {
        embed2 = GetFailedEmbed();
    } else {
        embed2 = await GetCharacterEmbed(chars[0]);
    }

    return target.reply({
        embeds: [embed2],
    });
}
function GetFailedEmbed() {
    return new EmbedBuilder()
        .setTitle("No Character Found")
        .setColor("#f50000");
}

async function GetMatchListEmbed(charactersMatch) {
    const entries = await Promise.all(
        charactersMatch.map(async (key) => {
            const entry = await GetCharacter(key);
            const name = entry?.label || key;
            const series = entry?.series || "Unknown Series";
            const rarityIcon = rarityIcons[entry?.rarity || "r"].emoji;
            const edition = entry?.edition || "Normal";
            return `${rarityIcon} **${name}** - \`${edition}\` - *${series}*`;
        })
    );

    return new EmbedBuilder()
        .setTitle("Matched Characters")
        .setDescription(entries.join("\n"))
        .setColor("#858585");
}

async function GetCharacterEmbed(characterValue) {
    const character = await GetCharacter(characterValue);
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setThumbnail(rarityIcon.image)
        .setTitle("Character Info")
        .addFields(
            { name: "Character", value: character.label, inline: false },
            { name: "Series", value: character.series, inline: false },
            {
                name: "Edition",
                value: character.edition,
                inline: false,
            }
        )
        .setImage(character.image)
        .setColor(character.rarity === "ssr" ? "#FFD700" : "#C0C0C0"); // ✅ Optional: gold for SSR, silver for SR
}

function parseViewArgs(args) {
    let charnameParts = [];
    let edition = null;
    let series = null;

    for (const part of args) {
        if (part.startsWith("e:")) {
            edition = part.slice(2);
        } else if (part.startsWith("s:")) {
            series = part.slice(2);
        } else {
            charnameParts.push(part);
        }
    }

    const charname = charnameParts.join(" ").trim() || null;
    return { charname, edition, series };
}
