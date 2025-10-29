import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons, currencyIcon } from "#utils/data_handler.js";
import {
    rollCharacter,
    rollCharacterFromRarity,
    weightedPick,
} from "#commands/roll/roll.js";
import {
    addCharacterToCollection,
    getPlayerData,
    getRarityValue,
    reduceBalance,
} from "#utils/userdata_handler.js";
import { getCharacter } from "#utils/characterdata_handler.js";
import { setPagination, deletePagination } from "#utils/PaginationStore.js";
import { getPageButtons } from "#utils/PaginationButtons.js";
import { COSTPERROLL, getUser, toCodeBlock, wait } from "#utils/data_utils.js";
import { startRoll, endRoll, isRolling } from "#utils/RollingStore.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

// =============================== COMMAND ===============================

export default {
    data: new SlashCommandBuilder()
        .setName("roll10")
        .setDescription("Roll 10 times"),
    name: "roll10",
    aliases: ["r10"],

    async execute(interaction) {
        await replyRoll10(interaction);
    },

    async executeMessage(message) {
        await replyRoll10(message);
    },
    help: getHelpEmbed(),
    type: "Roll",
};

// =============================== MAIN ===============================

export async function replyRoll10(target) {
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
    await reduceBalance(user, COSTPERROLL * 10);

    // 6. Build pagination
    await buildPagination(replyMessage, user, results);

    endRoll(user.id);
}

// =============================== EMBEDS ===============================

function getHelpEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("roll10")
        .withDescription(
            `Roll once. Each roll10 cost \`${COSTPERROLL * 10}\`${
                currencyIcon.cube.emoji
            }`
        )
        .withAliase(["r10", "roll10"])
        .build();
    return helpEmbed;
}

function getCharacterEmbed(user, character, charStatus, pageIndex, totalPages) {
    const rarityIcon = rarityIcons[character.rarity];
    const fields = [
        { name: "Character", value: toCodeBlock(character.label) },
        { name: "Series", value: toCodeBlock(character.series) },
        { name: "Edition", value: toCodeBlock(character.edition) },
    ];
    const rarityValue = getRarityValue(character.rarity);
    const titleStatus = charStatus.isFirstTime
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
        .setTitle(`Rolled | ${titleStatus}`)
        .setColor(rarityIcon.color)
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        .addFields(fields)
        .setImage(character.image)
        .setThumbnail(rarityIcon.image)
        .setFooter({
            text: `${character.value} - Page ${pageIndex + 1} / ${totalPages}`,
        });
}

function finalResultsEmbed(user, results) {
    const embed = new EmbedBuilder()
        .setTitle("🎉 Roll Results (10x) 🎉")
        .setColor("#ffffff")
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });

    results.forEach(({ character, charStatus }) => {
        const icon = rarityIcons[character.rarity].emoji;
        const title = `${icon} **${character.label}** — \`${character.edition}\` — *${character.series}*`;

        let info;
        if (charStatus.isFirstTime) {
            info = "🆕 First time!";
        } else if (charStatus.isLevelUp) {
            const newLv = charStatus.character.level;
            const oldLv = Math.max(1, newLv - 1);
            info = `⬆️ Level Up! (Lv.${oldLv} → **Lv.${newLv}**)`;
        } else {
            const addValue = getRarityValue(character.rarity).addValue;
            info = `🔁 Duplicate (+ \`${addValue}\` XP)`;
        }

        embed.addFields({ name: title, value: info });
    });

    return embed;
}

// =============================== HELPERS ===============================

async function getPlayerOrFail(target, user) {
    const player = await getPlayerData(user);
    if (player.balance < COSTPERROLL * 10) {
        await target.reply({
            embeds: [
                getEmbedNotEnoughBalance(player.balance, COSTPERROLL * 10),
            ],
        });
        return null;
    }
    return player;
}

async function performRolls() {
    const generated = [];
    const rarityRank = { r: 1, sr: 2, ssr: 3 };
    let highestRarity = "r";

    for (let i = 0; i < 10; i++) {
        const rarityRolled = weightedPick({ ssr: 2, sr: 19, r: 79 });
        generated.push(rarityRolled);

        if (rarityRank[rarityRolled] > rarityRank[highestRarity]) {
            highestRarity = rarityRolled;
        }
    }

    // Pity check: ensure SR/SSR
    const hasSR = generated.some((c) => c === "sr" || c === "ssr");
    if (!hasSR) {
        const rIndex = generated.findIndex((c) => c === "r");
        const forced = rollCharacterForcedToSR();
        generated[rIndex !== -1 ? rIndex : 0] = forced;
        highestRarity = forced;
    }

    return { generated, highestRarity };
}

async function animateRolls(replyMessage, generated, user) {
    let emojiLine = "";
    for (let i = 0; i < generated.length; i++) {
        const rarityRolled = generated[i];
        emojiLine += `${rarityIcons[rarityRolled].emoji} `;

        await wait(200);
        await replyMessage.edit({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`🎲 Rolled ${i + 1}/10`)
                    .setColor(rarityIcons[rarityRolled].color)
                    .setAuthor({
                        name: user.username,
                        iconURL: user.displayAvatarURL(),
                    })
                    .setDescription(emojiLine),
            ],
        });
    }
}

function rollCharacterForcedToSR() {
    for (let i = 0; i < 1000; i++) {
        const c = weightedPick({ ssr: 2, sr: 19, r: 79 });
        if (c === "sr" || c === "ssr") return c;
    }
}

async function processResults(user, generated) {
    const results = [];
    for (const rarity of generated) {
        const char = await rollCharacterFromRarity(rarity);
        const charStatus = await addCharacterToCollection(
            user,
            char.id,
            rarity
        );

        const character = await getCharacter(char);
        results.push({ character, charStatus });
    }
    return results;
}

async function buildPagination(replyMessage, user, results) {
    const embeds = results.map(({ character, charStatus }, i) =>
        getCharacterEmbed(user, character, charStatus, i, results.length)
    );
    const finalEmbed = finalResultsEmbed(user, results);

    await replyMessage.edit({
        embeds: [embeds[0]],
        components: [getPageButtons(true, embeds.length === 1, user, true)],
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
