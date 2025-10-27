import { MessageFlags } from "discord.js";
import { getPageButtons } from "#utils/PaginationButtons.js";
import { getPagination } from "#utils/PaginationStore.js";

export default {
    id: "next_page",

    async execute(interaction) {
        const pagination = getPagination(interaction.message.id);
        if (!pagination) {
            return interaction.reply({
                content: "Pagination expired.",
                flags: MessageFlags.Ephemeral,
            });
        }

        if (pagination.currentPage < pagination.embeds.length - 1) {
            pagination.currentPage++;

            return interaction.update({
                embeds: [pagination.embeds[pagination.currentPage]],
                components: [
                    getPageButtons(
                        pagination.currentPage === 0,
                        pagination.currentPage === pagination.embeds.length - 1,
                        interaction.user,
                        Boolean(pagination.finalEmbed)
                    ),
                ],
            });
        }
    },
};
