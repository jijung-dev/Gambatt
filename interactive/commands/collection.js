import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "../../utils/data_handler.js";
import {
    setPagination,
    deletePagination,
} from "../../utils/PaginationStore.js";
import { GetCharacter } from "../../utils/characterdata_handler.js";
import { GetPageButtons } from "../../utils/PaginationButtons.js";
import { parseViewArgs } from "./view.js";
import {
    GetCharactersFromCollection,
    GetCharacterFromCollection,
} from "../../utils/userdata_handler.js";
import { toCodeBlock, renderXpBarEmoji, getUser } from "../../utils/data_utils.js";

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

        await ReplyCollection(interaction, {
            charvalue,
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

// -------------------- Helpers --------------------
async function ReplyCollection(
    target,
    { charvalue, charname, edition, series, rarity, mention }
) {
    const user = await getUser(target, mention);
    if (!user) {
        return message.reply("⚠️ Invalid user ID.");
    }

    const chars = await GetCharactersFromCollection(
        user,
        charvalue,
        charname,
        edition,
        series,
        rarity
    );

    if (chars.length === 0) {
        return target.reply({ embeds: [GetFailedEmbed(user)] });
    } else {
        return SendMatchList(target, chars, user);
    }
}

function GetFailedEmbed(user) {
    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username}'s collection`,
            iconURL: user.displayAvatarURL(),
        })
        .setDescription("Empty")
        .setColor("#858585");
}

async function SendMatchList(target, charactersMatch, mentionUser) {
    const user = mentionUser;
    const embeds = await GetMatchListEmbeds(charactersMatch, user);
    let currentPage = 0;

    const reply = await target.reply({
        embeds: [embeds[currentPage]],
        components:
            embeds.length > 1
                ? [
                      GetPageButtons(
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

async function GetMatchListEmbeds(charactersMatch, user) {
    const entries = await Promise.all(
        charactersMatch.map(async (id) => {
            const character = await GetCharacter(id);
            const level = await GetCharacterFromCollection(user, id);
            return { character, level };
        })
    );

    return entries.map((entry, i) =>
        GetCharacterEmbed(entry, user, i, entries.length)
    );
}

function GetCharacterEmbed(characterObject, user, pageIndex, totalPages) {
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
