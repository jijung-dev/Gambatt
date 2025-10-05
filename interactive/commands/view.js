import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "../../utils/data_handler.js";
import { GetCharacters, GetCharacter } from "../../utils/characterdata_handler.js";
import { setPagination, deletePagination } from "../../utils/PaginationStore.js";
import { GetPageButtons } from "../../utils/PaginationButtons.js";
import { toCodeBlock } from "../../utils/data_utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("view")
        .setDescription("View character")
        .addStringOption(option =>
            option.setName("charname").setDescription("Character name (optional)").setRequired(false)
        )
        .addStringOption(option =>
            option.setName("edition").setDescription("Character edition (optional)").setRequired(false)
        )
        .addStringOption(option =>
            option.setName("series").setDescription("Character series (optional)").setRequired(false)
        )
        .addStringOption(option =>
            option.setName("rarity").setDescription("Character rarity (optional)").setRequired(false)
        ),
    name: "view",
    aliases: ["v"],

    async execute(interaction) {
        const charname = interaction.options.getString("charname");
        const edition = interaction.options.getString("edition");
        const series = interaction.options.getString("series");
        const rarity = interaction.options.getString("rarity");

        await ReplyView(interaction, { charname, edition, series, rarity });
    },

    async executeMessage(message, args) {
        const characterValue = parseViewArgs(args);
        await ReplyView(message, characterValue);
    },
};

// ------------------------------ MAIN ------------------------------

async function ReplyView(target, { charname, edition, series, rarity }) {
    if (!charname && !edition && !series && !rarity) {
        return target.reply({ content: "Use `.help view` for more info" });
    }

    const chars = await GetCharacters(charname, edition, series, rarity);

    if (chars.length === 0) {
        return target.reply({ embeds: [GetFailedEmbed()] });
    } else {
        return SendMatchList(target, chars);
    }
}

function GetFailedEmbed() {
    return new EmbedBuilder().setTitle("No Character Found").setColor("#f50000");
}

async function SendMatchList(target, charactersMatch) {
    const user = target.user || target.author;
    const embeds = await GetMatchListEmbeds(charactersMatch, user);
    let currentPage = 0;

    const reply = await target.reply({
        embeds: [embeds[currentPage]],
        components: embeds.length > 1 ? [GetPageButtons(true, embeds.length === 1, user)] : [],
        fetchReply: true,
    });

    if (embeds.length > 1) {
        setPagination(reply.id, { currentPage, embeds });

        setTimeout(async () => {
            deletePagination(reply.id);
            try {
                await reply.edit({ components: [] });
            } catch {}
        }, 120000);
    }
}

async function GetMatchListEmbeds(charactersMatch, user) {
    const entries = await Promise.all(charactersMatch.map(GetCharacter));
    return entries.map((character, i) => GetCharacterEmbed(character, user, i, entries.length));
}

function GetCharacterEmbed(character, user, pageIndex, totalPages) {
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setThumbnail(rarityIcon.image)
        .setTitle("Character Info")
        .addFields(
            { name: "Character", value: toCodeBlock(character.label), inline: false },
            { name: "Series", value: toCodeBlock(character.series), inline: false },
            { name: "Edition", value: toCodeBlock(character.edition), inline: false }
        )
        .setImage(character.image)
        .setColor(rarityIcon.color)
        .setFooter({ text: `Page ${pageIndex + 1} / ${totalPages}` });
}

// ------------------------------ ARG PARSER ------------------------------

export function parseViewArgs(args) {
    let charnameParts = [];
    let edition = null;
    let series = null;
    let rarity = null;

    for (const part of args) {
        if (part.startsWith("e:")) edition = part.slice(2);
        else if (part.startsWith("s:")) series = part.slice(2);
        else if (part.startsWith("r:")) rarity = part.slice(2);
        else charnameParts.push(part);
    }

    const charname = charnameParts.join(" ").trim() || null;
    return { charname, edition, series, rarity };
}
