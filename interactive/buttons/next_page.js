import { MessageFlags } from "discord.js";
import { getPageButtons, getPagination } from "#utils/pageSystem.js";

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

        pagination.currentPage = Math.min(
            pagination.embeds.length - 1,
            pagination.currentPage + 1
        );

        await interaction.update({
            embeds: [pagination.embeds[pagination.currentPage]],
            components: [
                getPageButtons(
                    pagination.currentPage === 0,
                    pagination.currentPage === pagination.embeds.length - 1,
                    interaction.user
                ),
            ],
        });
    },
};
