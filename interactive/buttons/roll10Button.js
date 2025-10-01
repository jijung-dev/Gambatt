const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { ReplyRoll10 } = require("../commands/roll10");

module.exports = {
    id: "roll10",
    GetRoll10,

    async execute(interaction, client) {
        await ReplyRoll10(interaction, client);
    },
};

function GetRoll10() {
    return new ButtonBuilder()
        .setCustomId("roll10")
        .setLabel("Roll X10")
        .setEmoji("🎲")
        .setStyle(ButtonStyle.Primary);
}
