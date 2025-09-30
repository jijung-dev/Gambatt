const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function GetPrevButton(disabled = false) {
    return new ButtonBuilder()
        .setCustomId("prev_page")
        .setLabel("◀️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled);
}

function GetNextButton(disabled = false) {
    return new ButtonBuilder()
        .setCustomId("next_page")
        .setLabel("▶️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled);
}

function GetPageButtons(isFirstPage, isLastPage) {
    return new ActionRowBuilder().addComponents(
        GetPrevButton(isFirstPage),
        GetNextButton(isLastPage)
    );
}

module.exports = { GetPrevButton, GetNextButton, GetPageButtons };
