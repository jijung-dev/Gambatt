import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// -------------------- BUTTON BUILDERS --------------------

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

function GetSkipButton(user) {
    return new ButtonBuilder()
        .setCustomId(`skip_roll|${user.id}`)
        .setLabel("⏭️ Skip")
        .setStyle(ButtonStyle.Secondary);
}

function GetPageButtons(isFirstPage, isLastPage, user, hasFinal = false) {
    const row = new ActionRowBuilder().addComponents(
        GetPrevButton(isFirstPage, user),
        GetNextButton(isLastPage, user)
    );

    if (hasFinal) {
        row.addComponents(GetSkipButton(user));
    }

    return row;
}

// -------------------- EXPORTS --------------------

export { GetPrevButton, GetNextButton, GetSkipButton, GetPageButtons };
