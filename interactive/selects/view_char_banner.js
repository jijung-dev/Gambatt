import { StringSelectMenuBuilder } from "discord.js";
import { rarityIcons } from "#utils/data_handler.js";
import { getCharacter, getBanner } from "#utils/characterdata_handler.js";

export default {
    id: "view_char_banner",

    async execute(interaction, client) {
        const bannerCommand = client.commands.get("banner");

        const embed = await bannerCommand.GetBannerEmbed(interaction.values[0]);

        await interaction.update({
            embeds: [embed],
            components: interaction.message.components,
        });
    },
};

export async function ViewCharacterBanner(userId) {
    const banner = await getBanner();

    const characters = await Promise.all(
        banner.current_characters.map(getCharacter)
    );

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
