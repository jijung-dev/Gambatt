import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
} from "discord.js";
import { rarityIcons } from "../../utils/data_handler.js";
import { GetCharacter, GetBanner } from "../../utils/characterdata_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("banner")
        .setDescription("Current Weekly Banner"),
    name: "banner",
    aliases: ["b"],

    async execute(interaction) {
        await ReplyBanner(interaction, interaction.client);
    },

    async executeMessage(message, args) {
        await ReplyBanner(message, message.client);
    },
};

// -------------------- Helpers --------------------
async function ReplyBanner(target, client) {
    const { GetRoll10 } = client.buttons.get("roll10");
    const { GetRoll } = client.buttons.get("roll");
    const { ViewCharacterBanner } = client.selects.get("view_char_banner");

    const banner = await GetBanner();
    const embed2 = await GetBannerEmbed(banner.current_characters[0]);
    const userID = target.user?.id || target.author?.id;
    const select2 = await ViewCharacterBanner(userID);
    const roll1 = await GetRoll(userID);
    const roll10 = await GetRoll10(userID);

    return target.reply({
        embeds: [embed2],
        components: [
            new ActionRowBuilder().addComponents(select2),
            new ActionRowBuilder().addComponents(roll1, roll10),
        ],
    });
}

export async function GetBannerEmbed(characterValue) {
    const character = await GetCharacter(characterValue);
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
