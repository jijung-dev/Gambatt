const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { rarityIcons, currencyIcon } = require("../../utils/data_handler.js");
const { RollCharacter } = require("./roll.js");
const {
    AddCharacterToCollection,
    GetPlayerData,
    GetRarityValue,
    ReduceBalance,
} = require("../../utils/userdata_handler");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roll10")
        .setDescription("Roll 10 times"),
    name: "roll10",
    aliases: ["r10"],
    ReplyRoll10,

    async execute(interaction) {
        await ReplyRoll10(interaction);
    },

    async executeMessage(message) {
        await ReplyRoll10(message);
    },
};

// =============================== MAIN ===============================

async function ReplyRoll10(target) {
    const user = getUser(target);
    const player = await GetPlayerData(user);

    const totalCost = 160 * 10;
    if (player.balance < totalCost) {
        return sendEmbed(target, failedEmbed(user, player.balance, totalCost));
    }

    await ReduceBalance(user, totalCost);

    const replyMessage = await sendEmbed(
        target,
        createEmbed(user, "🎲 Rolling..."),
        true
    );

    const generated = [];
    let emojiLine = "";

    for (let i = 0; i < 10; i++) {
        const character = await RollCharacter();
        generated.push(character);
        emojiLine += `${rarityIcons[character.rarity].emoji} `;

        await wait(300);
        await editEmbed(
            replyMessage,
            createEmbed(
                user,
                `🎲 Rolled ${i + 1}/10`,
                rarityIcons[character.rarity].color,
                emojiLine
            )
        );
    }

    const hasSR = generated.some(
        (c) => c.rarity === "sr" || c.rarity === "ssr"
    );
    if (!hasSR) {
        const rIndex = generated.findIndex((c) => c.rarity === "r");
        const forced = await RollCharacterForcedToSR();
        generated[rIndex !== -1 ? rIndex : 0] = forced;
    }

    const results = [];
    for (const char of generated) {
        const addResult = await AddCharacterToCollection(
            user,
            char.value,
            char.rarity
        );
        results.push({ character: char, result: addResult });
    }

    await wait(500);
    await editEmbed(replyMessage, finalResultsEmbed(user, results));
}

// =============================== EMBEDS ===============================

function createEmbed(user, title, color = "#6e6e6e", description = null) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });

    if (description) embed.setDescription(description);
    return embed;
}

function sendEmbed(target, embed, fetchReply = false) {
    return target.reply({ embeds: [embed], fetchReply });
}

function editEmbed(message, embed) {
    return message.edit({ embeds: [embed] });
}

function failedEmbed(user, balance, cost) {
    return createEmbed(
        user,
        `Not enough ${currencyIcon.cube.emoji}`,
        "#ff0000",
        `You have **${balance} ${currencyIcon.cube.emoji}**, but need **${cost} ${currencyIcon.cube.emoji}**.`
    );
}

function finalResultsEmbed(user, results) {
    const embed = new EmbedBuilder()
        .setTitle("🎉 Roll Results (10x) 🎉")
        .setColor("#ffffff")
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });

    results.forEach(({ character, result }) => {
        const icon = rarityIcons[character.rarity].emoji;
        const title = `${icon} **${character.label}** — \`${character.edition}\` — *${character.series}*`;

        let info;
        if (result.isFirstTime) {
            info = "🆕 First time!";
        } else if (result.isLevelUp) {
            const newLv = result.character.level;
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
    return {
        value: "FORCED_SR",
        label: "Forced SR",
        series: "Pity",
        edition: "Pity",
        rarity: "sr",
        image: null,
    };
}

// =============================== UTILS ===============================

const getUser = (target) => target.user || target.author;
const wait = (ms) => new Promise((res) => setTimeout(res, ms));
