const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { rarityIcons } = require("../../utils/data_handler.js");

const {
    setPagination,
    deletePagination,
} = require("../../utils/PaginationStore.js");
const { GetCharacter } = require("../../utils/characterdata_handler.js");

const { GetPageButtons } = require("../../utils/PaginationButtons.js");
const { parseViewArgs } = require("./view.js");
const {
    GetCharactersFromCollection,
    GetCharacterFromCollection,
} = require("../../utils/userdata_handler.js");
const { toCodeBlock, renderXpBarEmoji } = require("../../utils/data_utils.js");

module.exports = {
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
        const edition = interaction.options.getString("edition");
        const series = interaction.options.getString("series");
        const rarity = interaction.options.getString("rarity");

        await ReplyCollection(interaction, {
            charname,
            edition,
            series,
            rarity,
        });
    },

    async executeMessage(message, args) {
        const characterValue = parseViewArgs(args);
        await ReplyCollection(message, characterValue);
    },
};

async function ReplyCollection(target, { charname, edition, series, rarity }) {
    const user = target.user || target.author;
    const chars = await GetCharactersFromCollection(
        user,
        charname,
        edition,
        series,
        rarity
    );

    if (chars.length == 0) {
        return target.reply({
            embeds: [GetFailedEmbed()],
        });
    } else {
        return SendMatchList(target, chars);
    }
}

function GetFailedEmbed() {
    return new EmbedBuilder()
        .setTitle("Collection")
        .setDescription("Empty")
        .setColor("#858585");
}

async function SendMatchList(target, charactersMatch) {
    const user = target.user || target.author;
    const embeds = await GetMatchListEmbeds(charactersMatch, user);
    let currentPage = 0;
    const reply = await target.reply({
        embeds: [embeds[currentPage]],
        components:
            embeds.length > 1
                ? [GetPageButtons(true, embeds.length === 1, user)]
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

async function GetMatchListEmbeds(charactersMatch, user) {
    const entries = await Promise.all(
        charactersMatch.map(async (id) => {
            const character = await GetCharacter(id);
            const level = await GetCharacterFromCollection(user, id);
            return { character, level };
        })
    );
    const pages = [];

    for (let i = 0; i < entries.length; i++) {
        pages.push(GetCharacterEmbed(entries[i], user, i, entries.length));
    }

    return pages;
}
function GetCharacterEmbed(characterObject, user, pageIndex, totalPages) {
    const character = characterObject.character;
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setThumbnail(rarityIcon.image)
        .setAuthor({
            name: `${user.username}\'s collection`,
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
        .setFooter({ text: `Page ${pageIndex + 1} / ${totalPages}` });
}
