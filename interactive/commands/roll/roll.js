import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons, currencyIcon } from "#utils/data_handler.js";
import { getCharacters, getCharacter } from "#utils/characterdata_handler.js";
import {
    addCharacterToCollection,
    getRarityValue,
    getPlayerData,
    reduceBalance,
} from "#utils/userdata_handler.js";
import { COSTPERROLL, getUser, toCodeBlock, wait } from "#utils/data_utils.js";
import { getEmbedNotEnoughBalance } from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { isRolling } from "#utils/RollingStore.js";

export default {
    data: new SlashCommandBuilder().setName("roll").setDescription("Roll once"),
    name: "roll",
    aliases: ["r"],

    async execute(interaction) {
        await replyRoll(interaction);
    },

    async executeMessage(message) {
        await replyRoll(message);
    },
    help: getHelpEmbed(),
    type: "Roll",
};

// =============================== MAIN ===============================

export async function replyRoll(target) {
    const user = await getUser(target);
    if (!user) {
        return target.reply("⚠️ Invalid user ID.");
    }

    const player = await getPlayerOrFail(target, user);
    if (!player) return;

    // 🚫 Prevent concurrent rolls
    if (isRolling(user.id)) {
        return target.reply({
            content:
                "⛔ You already have an active roll in progress. Please wait until it finishes.",
            ephemeral: true,
        });
    }

    startRoll(user.id);

    const characterValue = await rollCharacter();

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

    const character = await getCharacter(characterValue.id);
    await wait(200);

    const charStatus = await addCharacterToCollection(
        user,
        character.value,
        character.rarity
    );

    await reduceBalance(user, COSTPERROLL);

    const finalEmbed = getCharacterEmbed(user, character, charStatus);

    await replyMessage.edit({ embeds: [finalEmbed] });

    endRoll(user.id);
}

// =============================== PLAYER / CHECKS ===============================

async function getPlayerOrFail(target, user) {
    const player = await getPlayerData(user);
    if (player.balance < COSTPERROLL) {
        await target.reply({
            embeds: [getEmbedNotEnoughBalance(player.balance, COSTPERROLL)],
        });
        return null;
    }
    return player;
}

// =============================== EMBEDS ===============================

function getHelpEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("roll")
        .withDescription(
            `Roll once. Each roll cost \`${COSTPERROLL}\`${currencyIcon.cube.emoji}`
        )
        .withAliase(["r", "roll"])
        .build();
    return helpEmbed;
}

function getCharacterEmbed(user, character, charStatus) {
    const rarityIcon = rarityIcons[character.rarity];
    const fields = [
        { name: "Character", value: toCodeBlock(character.label) },
        { name: "Series", value: toCodeBlock(character.series) },
        { name: "Edition", value: toCodeBlock(character.edition) },
    ];
    const rarityValue = getRarityValue(character.rarity);
    const status = charStatus.isFirstTime
        ? "🆕 New!"
        : charStatus.isLevelUp
        ? "⬆️ Level Up!"
        : "🔁 Duplicate";

    if (!charStatus.isFirstTime) {
        if (charStatus.isLevelUp) {
            fields.push({
                name: "Level Up",
                value: `Lv.${charStatus.character.level - 1} → **Lv.${
                    charStatus.character.level
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
        .setFooter({
            text: `${character.value}`,
        })
        .setThumbnail(rarityIcon.image);
}

// =============================== ROLL ===============================
export async function rollCharacter() {
    const rarity = weightedPick({ ssr: 2, sr: 19, r: 79 });
    const id = await rollCharacterFromRarity(rarity);

    return { id, rarity };
}
export async function rollCharacterFromRarity(rarity) {
    const candidates = await getCharacters(null, null, null, null, rarity);
    const id = await weightedPickFromArray(candidates);

    return id;
}

export function weightedPick(weightMap) {
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
//     const { current_characters } = await getBanner();
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
