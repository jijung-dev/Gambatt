import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { currencyIcon } from "../../utils/data_handler.js";
import { GetPlayerData } from "../../utils/userdata_handler.js";
import { getUser } from "../../utils/data_utils.js";

export default {
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
            user = await getUser(message, args[0]);
        }
        await ReplyBalance(message, user);
    },
};

async function ReplyBalance(target, user) {
    if (!user) {
        return message.reply("⚠️ Invalid user ID.");
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
            name: `${user.username}'s balance`,
            iconURL: user.displayAvatarURL(),
        })
        .setTitle(`${playerData.balance} ${currencyIcon.cube.emoji}`)
        .setColor("#a700f5");
}
