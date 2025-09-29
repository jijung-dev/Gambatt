const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
    GetCharacter,
    rarityIcons,
    GetBanner,
} = require("../../utils/data_handler");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("banner")
        .setDescription("Current Weekly Banner"),
    name: "banner",
    aliases: ["b"],

    GetBannerEmbed,

    async execute(interaction) {
        await ReplyBanner(interaction, interaction.client);
    },

    async executeMessage(message, args) {
        await ReplyBanner(message, message.client);
    },
};

async function ReplyBanner(target, client) {
    const { GetRoll10 } = client.buttons.get("roll10");
    const { ViewCharacterBanner } = client.selects.get("view_char_banner");

    const banner = await GetBanner();
    const embed2 = await GetBannerEmbed(banner.current_characters[0]);
    const select2 = await ViewCharacterBanner();

    return target.reply({
        embeds: [embed2],
        components: [select2, GetRoll10()],
    });
}

async function GetBannerEmbed(characterValue) {
    const character = await GetCharacter(characterValue);
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setThumbnail(rarityIcon.image)
        .setTitle("Weekly Banner")
        .addFields(
            { name: "Character", value: character.label, inline: false },
            { name: "Series", value: character.series, inline: false },
            {
                name: "Edition",
                value: character.edition,
                inline: false,
            }
        )
        .setImage(character.image)
        .setColor(character.rarity === "ssr" ? "#FFD700" : "#C0C0C0"); // ✅ Optional: gold for SSR, silver for SR
}
