import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// -------------------- BUTTON BUILDERS --------------------

export function getPrevButton(disabled = false, user) {
    return new ButtonBuilder()
        .setCustomId(`prev_page|${user.id}`)
        .setLabel("◀️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled);
}

export function getNextButton(disabled = false, user) {
    return new ButtonBuilder()
        .setCustomId(`next_page|${user.id}`)
        .setLabel("▶️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled);
}

export function getPageButtons(isFirstPage, isLastPage, user) {
    const row = new ActionRowBuilder().addComponents(
        getPrevButton(isFirstPage, user),
        getNextButton(isLastPage, user)
    );

    return row;
}

const paginationStore = new Map();

export function setPagination(messageId, data) {
    paginationStore.set(messageId, data);
}

export function getPagination(messageId) {
    return paginationStore.get(messageId);
}

export function deletePagination(messageId) {
    paginationStore.delete(messageId);
}
