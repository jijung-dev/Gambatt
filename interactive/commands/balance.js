const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { currencyIcon } = require("../../utils/data_handler");
const { GetPlayerData } = require("../../utils/userdata_handler");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Show user profile")
        .addUserOption((option) =>
            option
                .setName("user_id")
                .setDescription("user_id")
                .setRequired(false)
        ),
    name: "balance",
    aliases: ["bal"],

    async execute(interaction) {
        const user = interaction.options.getUser("user_id") || interaction.user;
        await ReplyBalance(interaction, user);
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
        await ReplyBalance(message, user);
    },
};

async function ReplyBalance(target, user) {
    if (!user) {
        user = target.user || target.author;
    }
    const embed2 = await GetBalanceEmbed(user);
    return target.reply({
        embeds: [embed2],
    });
}

async function GetBalanceEmbed(user) {
    const playerData = await GetPlayerData(user);

    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username}\'s balance`,
            iconURL: user.displayAvatarURL(),
        })
        .setTitle(`${playerData.balance} ${currencyIcon.cube.emoji}`)
        .setColor("#a700f5");
}
