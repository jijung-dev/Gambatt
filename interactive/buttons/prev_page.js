const { GetPageButtons } = require("../../utils/PaginationButtons");
const { getPagination } = require("../../utils/PaginationStore");

module.exports = {
    id: "prev_page",

    async execute(interaction) {
        const pagination = getPagination(interaction.message.id);
        if (!pagination) {
            return interaction.reply({
                content: "Pagination expired.",
                ephemeral: true,
            });
        }

        pagination.currentPage = Math.max(0, pagination.currentPage - 1);
        await interaction.update({
            embeds: [pagination.embeds[pagination.currentPage]],
            components: [
                GetPageButtons(
                    pagination.currentPage === 0,
                    pagination.currentPage === pagination.embeds.length - 1,
                    interaction.user
                ),
            ],
        });
    },
};
