import { MessageFlags } from "discord.js";
import { getPagination, deletePagination } from "../../utils/PaginationStore.js";

export default {
    id: "skip_roll",

    async execute(interaction) {
        const pagination = getPagination(interaction.message.id);
        if (!pagination) {
            return interaction.reply({
                content: "Pagination expired.",
                flags: MessageFlags.Ephemeral,
            });
        }

        deletePagination(interaction.message.id);

        return interaction.update({
            embeds: [pagination.finalEmbed],
            components: [], // remove all buttons
        });
    },
};
