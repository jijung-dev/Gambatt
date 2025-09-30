const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
    GetCharacter,
    rarityIcons,
    GetCharacters,
} = require("../../utils/data_handler.js");

const { setPagination } = require("../../utils/PaginationStore.js");
const { GetPageButtons } = require("../../utils/PaginationButtons.js");

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

    if (chars.length > 1) {
        return SendMatchList(target, chars);
    } else if (chars.length == 0) {
        return target.reply({
            embeds: [GetFailedEmbed()],
        });
    } else {
        const embed = await GetCharacterEmbed(chars[0]);
        return target.reply({
            embeds: [embed],
        });
    }
}

function GetFailedEmbed() {
    return new EmbedBuilder()
        .setTitle("No Character Found")
        .setColor("#f50000");
}

async function SendMatchList(target, charactersMatch) {
    const embeds = await GetMatchListEmbeds(charactersMatch);
    let currentPage = 0;

    const reply = await target.reply({
        embeds: [embeds[currentPage]],
        components:
            embeds.length > 1
                ? [GetPageButtons(true, embeds.length === 1)]
                : [],
        fetchReply: true,
    });

    if (embeds.length > 1) {
        setPagination(reply.id, { currentPage, embeds });

        setTimeout(async () => {
            deletePagination(reply.id);

            try {
                await reply.edit({
                    components: [],
                });
            } catch (err) {}
        }, 120000);
    }
}

async function GetMatchListEmbeds(charactersMatch) {
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

    const pageSize = 10;
    const totalPages = Math.ceil(entries.length / pageSize);
    const pages = [];

    for (let i = 0; i < entries.length; i += pageSize) {
        const pageIndex = i / pageSize;
        pages.push(
            new EmbedBuilder()
                .setTitle("Matched Characters")
                .setDescription(entries.slice(i, i + pageSize).join("\n"))
                .setColor("#858585")
                .setFooter({ text: `Page ${pageIndex + 1} / ${totalPages}` })
        );
    }

    return pages;
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
            { name: "Edition", value: character.edition, inline: false }
        )
        .setImage(character.image)
        .setColor(character.rarity === "ssr" ? "#FFD700" : "#C0C0C0");
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
