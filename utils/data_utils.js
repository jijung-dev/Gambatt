const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const { token } = require("../config.json");

async function getUser(userID) {
    return await client.users.fetch(userID);
}
function toCodeBlock(string) {
    return `\`\`\`${string}\`\`\``;
}
function renderXpBarEmoji(current, total, opts = {}) {
    const { width = 10, filled = "▰", empty = "▱", showNumbers = true } = opts;

    if (total <= 0)
        return (
            filled.repeat(width) + (showNumbers ? ` (${current}/${total})` : "")
        );

    const ratio = Math.max(0, Math.min(1, current / total));
    const filledCount = Math.round(ratio * width);
    const emptyCount = width - filledCount;

    const bar = filled.repeat(filledCount) + empty.repeat(emptyCount);
    return showNumbers ? `${bar}` : bar;
}

module.exports = { getUser, toCodeBlock, renderXpBarEmoji };
client.login(token);
