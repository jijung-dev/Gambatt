const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { ReplyRoll } = require("../commands/roll");

module.exports = {
    id: "roll",
    GetRoll,

    async execute(interaction, client) {
        await ReplyRoll(interaction, client);
    },
};
function GetRoll(userId) {
    return new ButtonBuilder()
        .setCustomId(`roll|${userId}`)
        .setLabel("Roll")
        .setEmoji("🎲")
        .setStyle(ButtonStyle.Primary);
}
