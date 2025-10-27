import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// -------------------- BUTTON BUILDERS --------------------

function getPrevButton(disabled = false, user) {
    return new ButtonBuilder()
        .setCustomId(`prev_page|${user.id}`)
        .setLabel("◀️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled);
}

function getNextButton(disabled = false, user) {
    return new ButtonBuilder()
        .setCustomId(`next_page|${user.id}`)
        .setLabel("▶️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled);
}

function getSkipButton(user) {
    return new ButtonBuilder()
        .setCustomId(`skip_roll|${user.id}`)
        .setLabel("⏭️ Skip")
        .setStyle(ButtonStyle.Secondary);
}

function getPageButtons(isFirstPage, isLastPage, user, hasFinal = false) {
    const row = new ActionRowBuilder().addComponents(
        getPrevButton(isFirstPage, user),
        getNextButton(isLastPage, user)
    );

    if (hasFinal) {
        row.addComponents(getSkipButton(user));
    }

    return row;
}

// -------------------- EXPORTS --------------------

export { getPrevButton, getNextButton, getSkipButton, getPageButtons };
