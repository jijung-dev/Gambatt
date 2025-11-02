import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "#utils/data_handler.js";
import { getCharacters, getCharacter } from "#utils/characterdata_handler.js";
import { setPagination, deletePagination } from "#utils/PaginationStore.js";
import { getPageButtons } from "#utils/PaginationButtons.js";
import {
    checkNull,
    getUser,
    parseArgs,
    toCodeBlock,
} from "#utils/data_utils.js";
import { getEmbedCharacterNotFound } from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName("view")
        .setDescription("View character")
        .addStringOption((option) =>
            option
                .setName("charname")
                .setDescription("Character name (optional)")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("charvalue")
                .setDescription("Character value (optional)")
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
        )
        .addStringOption((option) =>
            option
                .setName("rarity")
                .setDescription("Character rarity (optional)")
                .setRequired(false)
        ),
    name: "view",
    aliases: ["v"],

    async execute(interaction) {
        const charname = interaction.options.getString("charname");
        const charvalue = interaction.options.getString("charvalue");
        const edition = interaction.options.getString("edition");
        const series = interaction.options.getString("series");
        const rarity = interaction.options.getString("rarity");

        await replyView(interaction, {
            charvalue,
            charname,
            edition,
            series,
            rarity,
        });
    },

    async executeMessage(message, args) {
        const { character } = parseArgs(args);

        const characterValue = {
            charvalue: character.charvalue,
            charname: character.charname,
            edition: character.edition,
            series: character.series,
            rarity: character.rarity,
        };
        await replyView(message, characterValue);
    },
    help: getFailedEmbed(),
    type: "Character",
};

// ------------------------------ MAIN ------------------------------

async function replyView(
    target,
    { charvalue, charname, edition, series, rarity }
) {
    if (!checkNull("or", { charvalue, charname, edition, series, rarity })) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }

    const chars = await getCharacters(
        charvalue,
        charname,
        edition,
        series,
        rarity
    );

    if (chars.length === 0) {
        return target.reply({ embeds: [getEmbedCharacterNotFound()] });
    } else {
        return sendMatchList(target, chars);
    }
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("view")
        .withDescription("View existing characters")
        .withAliase(["v", "view"])
        .withExampleUsage(
            "$view n:Ninomae Ina'nis c:ninomae_inanis s:Hololive r:sr e:Normal"
        )
        .withUsage(
            "**/view** `<c:[character_value]>` `<n:[Character Name]>` `<s:[Series]>` `<r:[rarity]>` `<e:[Edition]>`"
        )
        .build();
    return helpEmbed;
}

async function sendMatchList(target, charactersMatch) {
    const user = await getUser(target);
    if (!user) {
        return target.reply("⚠️ Invalid user ID.");
    }
    const embeds = await getMatchListEmbeds(charactersMatch);
    let currentPage = 0;

    const reply = await target.reply({
        embeds: [embeds[currentPage]],
        components:
            embeds.length > 1
                ? [getPageButtons(true, embeds.length === 1, user)]
                : [],
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

async function getMatchListEmbeds(charactersMatch) {
    const entries = await Promise.all(charactersMatch.map(getCharacter));
    return entries.map((character, i) =>
        getCharacterEmbed(character, i, entries.length)
    );
}

function getCharacterEmbed(character, pageIndex, totalPages) {
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setThumbnail(rarityIcon.image)
        .setTitle("Character Info")
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
        .setColor(rarityIcon.color)
        .setFooter({
            text: `${character.value} - Page ${pageIndex + 1} / ${totalPages}`,
        });
}
