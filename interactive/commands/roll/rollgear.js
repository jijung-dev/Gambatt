import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { currencyIcon, tierIcons, tierMap } from "#utils/data_handler.js";
import { getPlayerData, reduceBalance } from "#utils/userdata_handler.js";
import { COSTPERROLL, getUser, toCodeBlock, wait } from "#utils/data_utils.js";
import { getEmbedNotEnoughBalance } from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { endRoll, isRolling, startRoll } from "#utils/RollingStore.js";
import { getGear, getGears } from "#utils/itemdata_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("rollgear")
        .setDescription("Roll gear once"),
    name: "rollgear",
    aliases: ["rg"],

    async execute(interaction) {
        await replyRollGear(interaction);
    },

    async executeMessage(message) {
        await replyRollGear(message);
    },
    help: getHelpEmbed(),
    type: "Roll",
};

// =============================== MAIN ===============================

export async function replyRollGear(target) {
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
                "⛔ You already have an active rollgear in progress. Please wait until it finishes.",
            ephemeral: true,
        });
    }

    startRoll(user.id);

    const gearValue = await rollGear();
    const tierName = tierMap[gearValue.tier];
    const tierIcon = tierIcons[tierName];

    const replyMessage = await target.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle("🎲 Roringgu...")
                .setColor(tierIcon.color)
                .setAuthor({
                    name: user.username,
                    iconURL: user.displayAvatarURL(),
                }),
        ],
    });

    const gear = await getGear(gearValue.id);
    await wait(200);

	//TODO: addGearToInventory() and Inventory
    // const gearStatus = await addCharacterToCollection(
    //     user,
    //     gear.value,
    //     gear.rarity
    // );

    await reduceBalance(user, COSTPERROLL);

    const finalEmbed = getGearEmbed(user, gear);

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
        .withName("rollgear")
        .withDescription(
            `Roll once. Each roll gear cost \`${COSTPERROLL}\`${currencyIcon.cube.emoji}`
        )
        .withAliase(["rg", "rollgear"])
        .build();
    return helpEmbed;
}

function getGearEmbed(user, gear) {
    const tierName = tierMap[gear.tier];
    const tierIcon = tierIcons[tierName];
    const stats = [];

    if (gear.supa_rate !== 0) stats.push(`Supa Rate - \`${gear.supa_rate}%\``);
    if (gear.growth_rate !== 0)
        stats.push(`Growth Rate - \`${gear.growth_rate}%\``);
    if (gear.mood_down_rate !== 0)
        stats.push(`Mood Down Rate - \`${gear.mood_down_rate}%\``);
    if (gear.stamina_cost_per_hour !== 0)
        stats.push(
            `Stamina Cost Per Hour - \`${gear.stamina_cost_per_hour}/h\``
        );

    const statsValue =
        stats.length > 0 ? stats.join("\n") : "*No stats available*";

    return new EmbedBuilder()
        .setThumbnail(tierIcon.image)
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        .setTitle("Rolled")
        .addFields(
            {
                name: "Gear",
                value: toCodeBlock(gear.label),
                inline: false,
            },
            {
                name: "Stats",
                value: statsValue,
                inline: false,
            }
        )
        .setImage(gear.image)
        .setFooter({
            text: `${gear.id}`,
        })
        .setColor(tierIcon.color);

    // const rarityValue = getRarityValue(character.rarity);
    // const status = charStatus.isFirstTime
    //     ? "🆕 New!"
    //     : charStatus.isLevelUp
    //     ? "⬆️ Level Up!"
    //     : "🔁 Duplicate";

    // if (!charStatus.isFirstTime) {
    //     if (charStatus.isLevelUp) {
    //         fields.push({
    //             name: "Level Up",
    //             value: `Lv.${charStatus.character.level - 1} → **Lv.${
    //                 charStatus.character.level
    //             }**`,
    //         });
    //     } else {
    //         fields.push({
    //             name: "Bonus",
    //             value: `+ \`${rarityValue.addValue}\` xp`,
    //         });
    //     }
    // }
}

// =============================== ROLL ===============================
export async function rollGear() {
    const tier = weightedPick({
        1: 1,
        2: 3,
        3: 10,
        4: 21,
        5: 30,
        6: 35,
    });
    const id = await rollGearFromRarity(tier);

    return { id, tier };
}
export async function rollGearFromRarity(tier) {
    const candidates = await getGears(
        null,
        null,
        tier,
        null,
        null,
        null,
        null
    );
    const id = await weightedPickFromArray(candidates);

    return id;
}

export function weightedPick(weightMap) {
    const entries = Object.entries(weightMap);
    let rollgear = Math.random() * entries.reduce((sum, [, w]) => sum + w, 0);

    for (const [key, weight] of entries) {
        if (rollgear < weight) return key;
        rollgear -= weight;
    }
}
async function weightedPickFromArray(items) {
    if (!items || items.length === 0) return null;
    const rollgear = Math.floor(Math.random() * items.length);
    return items[rollgear];
}
