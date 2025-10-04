const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { rarityIcons, currencyIcon } = require("../../utils/data_handler.js");
const {
    GetCharacters,
    GetCharacter,
    GetBanner,
} = require("../../utils/characterdata_handler.js");
const {
    AddCharacterToCollection,
    GetRarityValue,
    GetPlayerData,
    ReduceBalance,
} = require("../../utils/userdata_handler.js");
const { toCodeBlock } = require("../../utils/data_utils.js");

const COLOR_DEFAULT = "#6e6e6e";
const COST = 160;

module.exports = {
    data: new SlashCommandBuilder().setName("roll").setDescription("Roll once"),
    name: "roll",
    aliases: ["r"],

    RollCharacter,
    ReplyRoll,

    async execute(interaction) {
        await ReplyRoll(interaction);
    },

    async executeMessage(message) {
        await ReplyRoll(message);
    },
};

// =============================== MAIN ===============================

async function ReplyRoll(target) {
    const user = getUser(target);
    const player = await getPlayerOrFail(target, user);
    if (!player) return;

    const character = await RollCharacter();
    const rarityValue = GetRarityValue(character.rarity);

    const replyMessage = await sendEmbed(
        target,
        createEmbed(user, "🎲 Rolling...")
    );

    await wait(500);

    const collection = await AddCharacterToCollection(
        user,
        character.value,
        character.rarity
    );

    // Deduct cost only if successful
    await ReduceBalance(user, COST);

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
    await editEmbed(replyMessage, finalEmbed);
}

// =============================== PLAYER / CHECKS ===============================

async function getPlayerOrFail(target, user) {
    const player = await GetPlayerData(user);
    if (player.balance < COST) {
        await sendEmbed(target, failedEmbed(user, player, COST));
        return null;
    }
    return player;
}

// =============================== EMBEDS ===============================

function createEmbed(
    user,
    title,
    color = COLOR_DEFAULT,
    fields = [],
    image = null
) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });

    if (fields.length) embed.addFields(fields);
    if (image) embed.setImage(image);

    return embed;
}

function sendEmbed(target, embed, fetchReply = false) {
    return target.reply({ embeds: [embed], fetchReply });
}

function editEmbed(message, embed) {
    return message.edit({ embeds: [embed] });
}

function formatCharacterField(character) {
    return `${rarityIcons[character.rarity].emoji} **${character.label}** - \`${
        character.edition
    }\` - *${character.series}*`;
}

function failedEmbed(user, player, cost) {
    return createEmbed(
        user,
        `Not enough ${currencyIcon.cube.emoji}`,
        "#ff0000",
        [
            {
                name: "Balance",
                value: `You have **${player.balance}**, but need **${cost}**.`,
            },
        ]
    );
}

function getCharacterEmbed(user, character, status, collection, rarityValue) {
    const rarityIcon = rarityIcons[character.rarity];
    const fields = [
        { name: "Character", value: toCodeBlock(character.label) },
        { name: "Series", value: toCodeBlock(character.series) },
        { name: "Edition", value: toCodeBlock(character.edition) },
    ];

    // Add extra info field depending on duplicate/level-up/first-time
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

    return createEmbed(
        user,
        `${status} | Rolled`,
        rarityIcon.color,
        fields,
        character.image
    ).setThumbnail(rarityIcon.image);
}

// =============================== ROLL ===============================

async function RollCharacter() {
    const rarity = weightedPick({ ssr: 1, sr: 15, r: 84 });
    const candidates = await GetCharacters(null, null, null, rarity);
    const id = await weightedPickFromArray(candidates);
    return await GetCharacter(id);
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
    const { current_characters } = await GetBanner();
    const boosted = items.map((id) => ({
        id,
        weight: current_characters.includes(id) ? 2 : 1,
    }));

    let roll = Math.random() * boosted.reduce((sum, i) => sum + i.weight, 0);
    for (const item of boosted) {
        if (roll < item.weight) return item.id;
        roll -= item.weight;
    }
}

// =============================== UTIL ===============================

const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const getUser = (target) => target.user || target.author;
