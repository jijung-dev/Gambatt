const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
    GetCharacter,
    rarityIcons,
    GetBanner,
    GetCharacters,
} = require("../../utils/data_handler");

module.exports = {
    data: new SlashCommandBuilder().setName("roll").setDescription("Roll once"),
    name: "roll",
    aliases: ["r"],

    RollCharacter,
    ReplyRoll,

    async execute(interaction) {
        await ReplyRoll(interaction, interaction.client);
    },

    async executeMessage(message, args) {
        await ReplyRoll(message, message.client);
    },
};

async function ReplyRoll(target, client) {
    const character = await RollCharacter();
    const rarityIcon = rarityIcons[character.rarity];
    const user = target.user || target.author;

    const loadingEmbed = new EmbedBuilder()
        .setTitle("🎲 Rolling...")
        .setColor("#6e6e6e")
        .setAuthor({
            name: user.username,
            iconURL: user.displayAvatarURL(),
        });
    const loadingEmbed2 = new EmbedBuilder()
        .setTitle("🎲 Rolled")
        .setDescription(rarityIcon.emoji)
        .setColor(rarityIcon.color)
        .setAuthor({
            name: user.username,
            iconURL: user.displayAvatarURL(),
        });

    const replyMessage = await target.reply({
        embeds: [loadingEmbed],
        fetchReply: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const replyMessage2 = await replyMessage.edit({
        embeds: [loadingEmbed2],
        fetchReply: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const resultEmbed = await GetCharacterEmbed(character, user);

    return replyMessage2.edit({
        embeds: [resultEmbed],
    });
}

async function GetCharacterEmbed(character, user) {
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setThumbnail(rarityIcon.image)
        .setTitle("Rolled")
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
        .setColor(rarityIcon.color)
        .setAuthor({
            name: user.username,
            iconURL: user.displayAvatarURL(),
        });
}

async function RollCharacter() {
    const rarityWeights = {
        ssr: 1,
        sr: 15,
        r: 84,
    };

    const charRarity = WeightedPick(rarityWeights);
    const allCharacter = await GetCharacters(null, null, null, charRarity);
    const character = await WeightedPickFromArray(allCharacter);
    return await GetCharacter(character);
}

function WeightedPick(weightMap) {
    const entries = Object.entries(weightMap);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);

    let roll = Math.random() * total;

    for (const [rarity, weight] of entries) {
        if (roll < weight) return rarity;
        roll -= weight;
    }
}

async function WeightedPickFromArray(items) {
    const banner = await GetBanner();

    const boostedItems = items.map((id) => ({
        id,
        weight: banner.current_characters.includes(id) ? 2 : 1,
    }));

    const total = boostedItems.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;

    for (const item of boostedItems) {
        if (roll < item.weight) {
            return item.id;
        }
        roll -= item.weight;
    }
}
