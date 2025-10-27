import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
} from "discord.js";
import { rarityIcons } from "#utils/data_handler.js";
import { getCharacter, getBanner } from "#utils/characterdata_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("banner")
        .setDescription("Current Weekly Banner"),
    name: "banner",
    aliases: ["b"],

    async execute(interaction) {
        await Reply(interaction, interaction.client);
    },

    async executeMessage(message, args) {
        await Reply(message, message.client);
    },
};

// -------------------- Helpers --------------------
async function Reply(target, client) {
    return target.reply("No banner for now");
}
async function ReplyBanner(target, client) {
    const { getRoll10 } = client.buttons.get("roll10");
    const { getRoll } = client.buttons.get("roll");
    const { ViewCharacterBanner } = client.selects.get("view_char_banner");

    const banner = await getBanner();
    const embed2 = await GetBannerEmbed(banner.current_characters[0]);
    const userID = target.user?.id || target.author?.id;
    const select2 = await ViewCharacterBanner(userID);
    const roll1 = await getRoll(userID);
    const roll10 = await getRoll10(userID);

    return target.reply({
        embeds: [embed2],
        components: [
            new ActionRowBuilder().addComponents(select2),
            new ActionRowBuilder().addComponents(roll1, roll10),
        ],
    });
}

export async function GetBannerEmbed(characterValue) {
    const character = await getCharacter(characterValue);
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setThumbnail(rarityIcon.image)
        .setTitle("Weekly Banner")
        .addFields(
            { name: "Character", value: character.label, inline: false },
            { name: "Series", value: character.series, inline: false },
            { name: "Edition", value: character.edition, inline: false }
        )
        .setImage(character.image)
        .setColor(rarityIcon.color);
}
