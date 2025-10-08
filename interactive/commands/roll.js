import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons, currencyIcon } from "../../utils/data_handler.js";
import {
    GetCharacters,
    GetCharacter,
    GetBanner,
} from "../../utils/characterdata_handler.js";
import {
    AddCharacterToCollection,
    GetRarityValue,
    GetPlayerData,
    ReduceBalance,
} from "../../utils/userdata_handler.js";
import { toCodeBlock } from "../../utils/data_utils.js";

const COLOR_DEFAULT = "#6e6e6e";
const COST = 160;

export default {
    data: new SlashCommandBuilder().setName("roll").setDescription("Roll once"),
    name: "roll",
    aliases: ["r"],

    async execute(interaction) {
        await ReplyRoll(interaction);
    },

    async executeMessage(message) {
        await ReplyRoll(message);
    },
};

// =============================== MAIN ===============================

export async function ReplyRoll(target) {
    const user = getUser(target);
    const player = await getPlayerOrFail(target, user);
    if (!player) return;

    const characterValue = await RollCharacter();

    const replyMessage = await target.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle("🎲 Roringgu...")
                .setColor(rarityIcons[characterValue.rarity].color)
                .setAuthor({
                    name: user.username,
                    iconURL: user.displayAvatarURL(),
                }),
        ],
    });

    const character = await GetCharacter(characterValue.id);
    await wait(200);

    const collection = await AddCharacterToCollection(
        user,
        character.value,
        character.rarity
    );

    // Deduct cost only if successful
    await ReduceBalance(user, COST);

    const rarityValue = GetRarityValue(character.rarity);
    const titleStatus = collection.isFirstTime
        ? "🆕 New!"
        : collection.isLevelUp
        ? "⬆️ Level Up!"
        : "🔁 Duplicate";

    const finalEmbed = getCharacterEmbed(
        user,
        character,
        titleStatus,
        collection,
        rarityValue
    );

    await replyMessage.edit({ embeds: [finalEmbed] });
}

// =============================== PLAYER / CHECKS ===============================

async function getPlayerOrFail(target, user) {
    const player = await GetPlayerData(user);
    if (player.balance < COST) {
        await target.reply({ embeds: [failedEmbed(user, player, COST)] });
        return null;
    }
    return player;
}

// =============================== EMBEDS ===============================

function failedEmbed(user, player, cost) {
    return new EmbedBuilder()
        .setTitle(`Not enough ${currencyIcon.cube.emoji}`)
        .setColor("#ff0000")
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        .addFields([
            {
                name: "Balance",
                value: `You have **${player.balance} ${currencyIcon.cube.emoji}**, but need **${cost} ${currencyIcon.cube.emoji}**.`,
            },
        ]);
}

function getCharacterEmbed(user, character, status, collection, rarityValue) {
    const rarityIcon = rarityIcons[character.rarity];
    const fields = [
        { name: "Character", value: toCodeBlock(character.label) },
        { name: "Series", value: toCodeBlock(character.series) },
        { name: "Edition", value: toCodeBlock(character.edition) },
    ];

    if (!collection.isFirstTime) {
        if (collection.isLevelUp) {
            fields.push({
                name: "Level Up",
                value: `Lv.${collection.character.level - 1} → **Lv.${
                    collection.character.level
                }**`,
            });
        } else {
            fields.push({
                name: "Bonus",
                value: `+ \`${rarityValue.addValue}\` xp`,
            });
        }
    }

    return new EmbedBuilder()
        .setTitle(`Rolled | ${status}`)
        .setColor(rarityIcon.color)
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        .addFields(fields)
        .setImage(character.image)
        .setThumbnail(rarityIcon.image);
}

// =============================== ROLL ===============================
/**
 * @returns {string} return picked character value
 */
export async function RollCharacter() {
    const rarity = weightedPick({ ssr: 2, sr: 19, r: 79 });

    const candidates = await GetCharacters(null, null, null, rarity);
    const id = await weightedPickFromArray(candidates, rarity);

    return { id, rarity };
}

function weightedPick(weightMap) {
    const entries = Object.entries(weightMap);
    let roll = Math.random() * entries.reduce((sum, [, w]) => sum + w, 0);

    for (const [key, weight] of entries) {
        if (roll < weight) return key;
        roll -= weight;
    }
}
async function weightedPickFromArray(items) {
    if (!items || items.length === 0) return null;
    const roll = Math.floor(Math.random() * items.length);
    return items[roll];
}

// async function weightedPickFromBanner(items, rarity) {
//     const { current_characters } = await GetBanner();
//     const featured = items.filter((id) => current_characters.includes(id));
//     const nonFeatured = items.filter((id) => !current_characters.includes(id));

//     const weights = {};

//     if (rarity === "ssr") {
//         const featuredRate = 0.75;
//         featured.forEach((id) => (weights[id] = featuredRate));

//         const leftover = 3 - featuredRate * featured.length;
//         const perNonFeatured =
//             nonFeatured.length > 0 ? leftover / nonFeatured.length : 0;
//         nonFeatured.forEach((id) => (weights[id] = perNonFeatured));
//     } else if (rarity === "sr") {
//         const featuredRate = 3;
//         featured.forEach((id) => (weights[id] = featuredRate));

//         const leftover = 18 - featuredRate * featured.length;
//         const perNonFeatured =
//             nonFeatured.length > 0 ? leftover / nonFeatured.length : 0;
//         nonFeatured.forEach((id) => (weights[id] = perNonFeatured));
//     } else {
//         const perR = items.length > 0 ? 79 / items.length : 0;
//         items.forEach((id) => (weights[id] = perR));
//     }

//     return weightedPick(weights);
// }

// =============================== UTIL ===============================

const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const getUser = (target) => target.user || target.author;
