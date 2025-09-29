const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    id: "roll10",
    GetRoll10,

    async execute(interaction, client) {
        await interaction.reply("Lmao");
    },
};

function GetRoll10() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("roll10")
            .setLabel("Roll X10")
            .setEmoji("🎲")
            .setStyle(ButtonStyle.Primary)
    );
}
