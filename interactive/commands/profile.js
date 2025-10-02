const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Show user profile")
        .addUserOption((option) =>
            option
                .setName("user_id")
                .setDescription("user_id")
                .setRequired(false)
        ),
    name: "profile",
    aliases: ["p"],

    async execute(interaction) {
        const user = interaction.options.getUser("user_id") || interaction.user;
        await ReplyProfile(interaction, user);
    },

    async executeMessage(message, args) {
        let user;

        if (!args?.[0]) {
            user = message.author; 
        } else {
            const id = args[0].replace(/[<@!>]/g, "");
            user = await message.client.users.fetch(id).catch(() => null);
        }

        if (!user) {
            return message.reply("⚠️ Invalid user ID.");
        }
        await ReplyProfile(message, user);
    },
};

async function ReplyProfile(target, user) {
    if (!user) {
        user = target.user || target.author;
    }
    const embed2 = GetProfileEmbed(user);
    return target.reply({
        embeds: [embed2],
        //TODO: Button to collection, inventory
        // components: [
        //     new ActionRowBuilder().addComponents(select2),
        //     new ActionRowBuilder().addComponents(roll1, roll10),
        // ],
    });
}

function GetProfileEmbed(user) {
    //const rarityIcon = rarityIcons[character.rarity];

    return (
        new EmbedBuilder()
            .setAuthor({
                name: "Profile",
            })
            .setTitle(user.username)
            //TODO: Custom title
            .setDescription("titletitle")
            //TODO: Custom fav card command
            .addFields({
                name: "Top favorite card",
                value: "card \ncard\ncard",
                inline: false,
            })
            .setThumbnail(user.displayAvatarURL())
            .setColor("#a700f5")
    );
}
