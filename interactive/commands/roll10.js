import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons, currencyIcon } from "../../utils/data_handler.js";
import { RollCharacter } from "./roll.js";
import {
    AddCharacterToCollection,
    GetPlayerData,
    GetRarityValue,
    ReduceBalance,
} from "../../utils/userdata_handler.js";
import { GetCharacter } from "../../utils/characterdata_handler.js";
import {
    setPagination,
    deletePagination,
} from "../../utils/PaginationStore.js";
import { GetPageButtons } from "../../utils/PaginationButtons.js";
import { toCodeBlock } from "../../utils/data_utils.js";
import { startRoll, endRoll, isRolling } from "../../utils/RollingStore.js";

// =============================== COMMAND ===============================

export default {
    data: new SlashCommandBuilder()
        .setName("roll10")
        .setDescription("Roll 10 times"),
    name: "roll10",
    aliases: ["r10"],

    async execute(interaction) {
        await ReplyRoll10(interaction);
    },

    async executeMessage(message) {
        await ReplyRoll10(message);
    },
};

// =============================== MAIN ===============================

export async function ReplyRoll10(target) {
    const user = getUser(target);

    // 🚫 Prevent concurrent rolls
    if (isRolling(user.id)) {
        return target.reply({
            content:
                "⛔ You already have an active roll in progress. Please wait until it finishes.",
            ephemeral: true,
        });
    }

    startRoll(user.id);

    try {
        // 1. Balance check
        const player = await GetPlayerData(user);
        const totalCost = 160 * 10;
        await checkBalanceAndPay(target, user, player, totalCost);

        // 2. Perform rolls
        const generatedObj = await performRolls();
        const generated = generatedObj.generated;

        // 1. Initial message
        const replyMessage = await target.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🎲 Roringgu...")
                    .setColor(rarityIcons[generatedObj.highestRarity].color)
                    .setAuthor({
                        name: user.username,
                        iconURL: user.displayAvatarURL(),
                    }),
            ],
            fetchReply: true,
        });
        await wait(500);

        // 4. Animate rolls
        await animateRolls(replyMessage, generated, user);

        await wait(200);

        // 5. Process results
        const results = await processResults(user, generated);

        // 6. Build pagination
        await buildPagination(replyMessage, user, results);
    } catch (err) {
        console.error("Roll10 error:", err);
        await safeReply(target, {
            content: "❌ Something went wrong!",
            ephemeral: true,
        });
    } finally {
        endRoll(user.id); // always unlock
    }
}

// =============================== HELPERS ===============================

async function checkBalanceAndPay(target, user, player, totalCost) {
    if (player.balance < totalCost) {
        throw await target.reply({
            embeds: [failedEmbed(user, player.balance, totalCost)],
        });
    }
    await ReduceBalance(user, totalCost);
}

async function performRolls() {
    const generated = [];
    const rarityRank = { r: 1, sr: 2, ssr: 3 };
    let highestRarity = "r";

    for (let i = 0; i < 10; i++) {
        const charRolled = await RollCharacter();
        generated.push(charRolled);

        if (rarityRank[charRolled.rarity] > rarityRank[highestRarity]) {
            highestRarity = charRolled.rarity;
        }
    }

    // Pity check: ensure SR/SSR
    const hasSR = generated.some(
        (c) => c.rarity === "sr" || c.rarity === "ssr"
    );
    if (!hasSR) {
        const rIndex = generated.findIndex((c) => c.rarity === "r");
        const forced = await RollCharacterForcedToSR();
        generated[rIndex !== -1 ? rIndex : 0] = forced;
    }

    return { generated, highestRarity };
}

async function animateRolls(replyMessage, generated, user) {
    let emojiLine = "";
    for (let i = 0; i < generated.length; i++) {
        const charRolled = generated[i];
        emojiLine += `${rarityIcons[charRolled.rarity].emoji} `;

        await wait(200);
        await replyMessage.edit({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`🎲 Rolled ${i + 1}/10`)
                    .setColor(rarityIcons[charRolled.rarity].color)
                    .setAuthor({
                        name: user.username,
                        iconURL: user.displayAvatarURL(),
                    })
                    .setDescription(emojiLine),
            ],
        });
    }
}

async function processResults(user, generated) {
    const results = [];

    for (const char of generated) {
        const character = await GetCharacter(char.id);
        const collection = await AddCharacterToCollection(
            user,
            character.value,
            character.rarity
        );
        const rarityValue = GetRarityValue(character.rarity);

        const titleStatus = collection.isFirstTime
            ? "🆕 New!"
            : collection.isLevelUp
            ? "⬆️ Level Up!"
            : "🔁 Duplicate";

        results.push({ character, collection, rarityValue, titleStatus });
    }

    return results;
}

async function buildPagination(replyMessage, user, results) {
    const embeds = results.map(
        ({ character, collection, rarityValue, titleStatus }, i) =>
            GetCharacterEmbed(
                user,
                character,
                titleStatus,
                collection,
                rarityValue,
                i,
                results.length
            )
    );
    const finalEmbed = finalResultsEmbed(user, results);

    await replyMessage.edit({
        embeds: [embeds[0]],
        components: [GetPageButtons(true, embeds.length === 1, user, true)],
    });

    setPagination(replyMessage.id, {
        currentPage: 0,
        embeds,
        finalEmbed,
        userId: user.id,
    });

    // Timeout → auto show final results
    setTimeout(async () => {
        try {
            deletePagination(replyMessage.id);
            await replyMessage.edit({
                embeds: [finalEmbed],
                components: [],
            });
        } catch (err) {
            console.error("Failed to timeout pagination:", err);
        }
    }, 120000);
}

// =============================== EMBEDS ===============================

function failedEmbed(user, balance, cost) {
    return new EmbedBuilder()
        .setTitle(`Not enough ${currencyIcon.cube.emoji}`)
        .setColor("#ff0000")
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        .setDescription(
            `You have **${balance} ${currencyIcon.cube.emoji}**, but need **${cost} ${currencyIcon.cube.emoji}**.`
        );
}

function GetCharacterEmbed(
    user,
    character,
    status,
    collection,
    rarityValue,
    pageIndex,
    totalPages
) {
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
        .setThumbnail(rarityIcon.image)
        .setFooter({ text: `Page ${pageIndex + 1} / ${totalPages}` });
}

function finalResultsEmbed(user, results) {
    const embed = new EmbedBuilder()
        .setTitle("🎉 Roll Results (10x) 🎉")
        .setColor("#ffffff")
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });

    results.forEach(({ character, collection }) => {
        const icon = rarityIcons[character.rarity].emoji;
        const title = `${icon} **${character.label}** — \`${character.edition}\` — *${character.series}*`;

        let info;
        if (collection.isFirstTime) {
            info = "🆕 First time!";
        } else if (collection.isLevelUp) {
            const newLv = collection.character.level;
            const oldLv = Math.max(1, newLv - 1);
            info = `⬆️ Level Up! (Lv.${oldLv} → **Lv.${newLv}**)`;
        } else {
            const addValue = GetRarityValue(character.rarity).addValue;
            info = `🔁 Duplicate (+ \`${addValue}\` XP)`;
        }

        embed.addFields({ name: title, value: info });
    });

    return embed;
}

// =============================== PITY ===============================

async function RollCharacterForcedToSR() {
    for (let i = 0; i < 1000; i++) {
        const c = await RollCharacter();
        if (c.rarity === "sr" || c.rarity === "ssr") return c;
    }
}

// =============================== UTILS ===============================

const getUser = (target) => target.user || target.author;
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

async function safeReply(target, payload) {
    try {
        if (target.replied || target.deferred) {
            await target.followUp(payload);
        } else {
            await target.reply(payload);
        }
    } catch {}
}
