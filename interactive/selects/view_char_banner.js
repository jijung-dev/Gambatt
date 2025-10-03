const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const {
    rarityIcons,
} = require("../../utils/data_handler");
const { GetCharacter, GetBanner } = require("../../utils/characterdata_handler");

module.exports = {
    id: "view_char_banner",
    ViewCharacterBanner,

    async execute(interaction, client) {
        const bannerCommand = client.commands.get("banner");
        if (!bannerCommand) return;

        const { GetBannerEmbed } = bannerCommand;
        const embed2 = await GetBannerEmbed(interaction.values[0]);

        await interaction.update({
            embeds: [embed2],
            components: interaction.message.components,
        });
    },
};

async function ViewCharacterBanner(userId) {
    const banner = await GetBanner();

    const characters = [];
    for (const charValue of banner.current_characters) {
        const character = await GetCharacter(charValue);
        characters.push(character);
    }

    return new StringSelectMenuBuilder()
        .setCustomId(`view_char_banner|${userId}`)
        .setPlaceholder("View other character in the banner")
        .addOptions(
            characters.map((c) => ({
                label: c.label,
                value: c.value,
                emoji: { id: rarityIcons[c.rarity].id },
            }))
        );
}
