import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "#utils/data_handler.js";
import { setPagination, deletePagination } from "#utils/PaginationStore.js";
import { getCharacter } from "#utils/characterdata_handler.js";
import { getPageButtons } from "#utils/PaginationButtons.js";
import {
    getCharactersFromCollection,
    getCharacterFromCollection,
} from "#utils/userdata_handler.js";
import {
    toCodeBlock,
    renderXpBarEmoji,
    getUser,
    parseArgs,
} from "#utils/data_utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("collection")
        .setDescription("View characters that you owned")
        .addStringOption((option) =>
            option
                .setName("charname")
                .setDescription("Character name (required)")
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
    name: "collection",
    aliases: ["c"],

    async execute(interaction) {
        const charname = interaction.options.getString("charname");
        const charvalue = interaction.options.getString("charvalue");
        const edition = interaction.options.getString("edition");
        const series = interaction.options.getString("series");
        const rarity = interaction.options.getString("rarity");

        await replyCollection(interaction, {
            charvalue,
            charname,
            edition,
            series,
            rarity,
        });
    },

    async executeMessage(message, args) {
        const characterValue = parseArgs(args);
        await replyCollection(message, characterValue);
    },
    help: getHelpEmbed(),
};

// ------------------------------ MAIN ------------------------------

async function replyCollection(
    target,
    { charvalue, charname, edition, series, rarity, mention }
) {
    const user = await getUser(target, mention);
    if (!user) {
        return message.reply("⚠️ Invalid user ID.");
    }

    const chars = await getCharactersFromCollection(
        user,
        charvalue,
        charname,
        edition,
        series,
        rarity
    );

    if (chars.length === 0) {
        return target.reply({ embeds: [getFailedEmbed(user)] });
    } else {
        return sendMatchList(target, chars, user);
    }
}
// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed(user) {
    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username}'s collection`,
            iconURL: user.displayAvatarURL(),
        })
        .setDescription("Empty")
        .setColor("#858585");
}

function getHelpEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("collection")
        .withDescription("View your collection")
        .withAliase(["c", "collection"])
        .withExampleUsage(
            "$collection @JiJung n:Ninomae Ina'nis c:ninomae_inanis s:Hololive r:sr e:Normal"
        )
        .withUsage(
            "**/collection** `<@user | u:[user_id]>` `<c:[Character Value]>` `<n:[Character Name]>` `<s:[Series]>` `<r:[rarity]>` `<e:[Edition]>`"
        )
        .build();
    return helpEmbed;
}

async function sendMatchList(target, charactersMatch, mentionUser) {
    const user = mentionUser;
    const embeds = await getMatchListEmbeds(charactersMatch, user);
    let currentPage = 0;

    const reply = await target.reply({
        embeds: [embeds[currentPage]],
        components:
            embeds.length > 1
                ? [
                      getPageButtons(
                          true,
                          embeds.length === 1,
                          target.user || target.author
                      ),
                  ]
                : [],
        fetchReply: true,
    });

    if (embeds.length > 1) {
        setPagination(reply.id, { currentPage, embeds });

        setTimeout(async () => {
            deletePagination(reply.id);
            try {
                await reply.edit({ components: [] });
            } catch (err) {}
        }, 120000);
    }
}

async function getMatchListEmbeds(charactersMatch, user) {
    const entries = await Promise.all(
        charactersMatch.map(async (id) => {
            const character = await getCharacter(id);
            const level = await getCharacterFromCollection(user, id);
            return { character, level };
        })
    );

    return entries.map((entry, i) =>
        getCharacterEmbed(entry, user, i, entries.length)
    );
}

function getCharacterEmbed(characterObject, user, pageIndex, totalPages) {
    const character = characterObject.character;
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setThumbnail(rarityIcon.image)
        .setAuthor({
            name: `${user.username}'s collection`,
            iconURL: user.displayAvatarURL(),
        })
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
                name: `**Level ${characterObject.level.level}** : ${characterObject.level.xp_now}/${characterObject.level.xp_max}`,
                value: renderXpBarEmoji(
                    characterObject.level.xp_now,
                    characterObject.level.xp_max,
                    { width: 8, filled: "⬜", empty: "⬛", showNumbers: true }
                ),
                inline: false,
            }
        )
        .setImage(character.image)
        .setColor(rarityIcon.color)
        .setFooter({
            text: `${character.value} - Page ${pageIndex + 1} / ${totalPages}`,
        });
}
