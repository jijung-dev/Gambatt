const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
    rarityIcons,
} = require("../../utils/data_handler");
const { RollCharacter } = require("./roll");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roll10")
        .setDescription("Roll 10 times"),
    name: "roll10",
    aliases: ["r10"],
    ReplyRoll10,

    async execute(interaction) {
        await ReplyRoll10(interaction, interaction.client);
    },

    async executeMessage(message, args) {
        await ReplyRoll10(message, message.client);
    },
};

async function ReplyRoll10(target, client) {
    const user = target.user || target.author;

    const loadingEmbed = new EmbedBuilder()
        .setTitle("🎲 Rolling...")
        .setColor("#6e6e6e")
        .setAuthor({
            name: user.username,
            iconURL: user.displayAvatarURL(),
        });

    const replyMessage = await target.reply({
        embeds: [loadingEmbed],
        fetchReply: true,
    });

    let characters = [];
    let emojiDesc = ""; // accumulate emojis here

    for (let index = 0; index < 10; index++) {
        const character = await RollCharacter();
        characters.push(character);

        const rarityIcon = rarityIcons[character.rarity];
        emojiDesc += `${rarityIcon.emoji} `; // append emoji

        const rollingResult = new EmbedBuilder()
            .setTitle(`🎲 Rolled ${index + 1}/10`)
            .setDescription(emojiDesc)
            .setColor(rarityIcon.color)
            .setAuthor({
                name: user.username,
                iconURL: user.displayAvatarURL(),
            });

        await new Promise((resolve) => setTimeout(resolve, 500));
        await replyMessage.edit({ embeds: [rollingResult] });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const finalEmbed = new EmbedBuilder()
        .setTitle("🎉 Roll Results (10x)")
        .setColor("#ffffff")
        .setAuthor({
            name: user.username,
            iconURL: user.displayAvatarURL(),
        })
        .setDescription(
            characters
                .map(
                    (c) =>
                        `${rarityIcons[c.rarity].emoji} **${c.label}** - \`${
                            c.edition
                        }\` - *${c.series}*`
                )
                .join("\n")
        );

    return replyMessage.edit({ embeds: [finalEmbed] });

    // const resultEmbed = await GetCharacterEmbed(character, user);

    // return replyMessage2.edit({
    //     embeds: [resultEmbed],
    // });
}

// async function GetCharacterEmbed(character, user) {
//     const rarityIcon = rarityIcons[character.rarity];

//     return new EmbedBuilder()
//         .setThumbnail(rarityIcon.image)
//         .setTitle("Rolled")
//         .addFields(
//             { name: "Character", value: character.label, inline: false },
//             { name: "Series", value: character.series, inline: false },
//             {
//                 name: "Edition",
//                 value: character.edition,
//                 inline: false,
//             }
//         )
//         .setImage(character.image)
//         .setColor(rarityIcon.color)
//         .setAuthor({
//             name: user.username,
//             iconURL: user.displayAvatarURL(),
//         });
// }
