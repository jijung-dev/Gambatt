const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function GetPrevButton(disabled = false, user) {
    return new ButtonBuilder()
        .setCustomId(`prev_page|${user.id}`)
        .setLabel("◀️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled);
}

function GetNextButton(disabled = false, user) {
    return new ButtonBuilder()
        .setCustomId(`next_page|${user.id}`)
        .setLabel("▶️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled);
}

function GetPageButtons(isFirstPage, isLastPage, user) {
    return new ActionRowBuilder().addComponents(
        GetPrevButton(isFirstPage, user),
        GetNextButton(isLastPage, user)
    );
}

module.exports = { GetPrevButton, GetNextButton, GetPageButtons };
