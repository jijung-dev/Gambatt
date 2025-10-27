import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { currencyIcon } from "#utils/data_handler.js";
import { getPlayerData } from "#utils/userdata_handler.js";
import { getUser } from "#utils/data_utils.js";

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
        await replyBalance(interaction, user);
    },

    async executeMessage(message, args) {
        let user;

        if (!args?.[0]) {
            user = await getUser(message, args[0]);
        }
        await replyBalance(message, user);
    },
    help: getHelpEmbed(),
};

async function replyBalance(target, user) {
    if (!user) {
        return message.reply("⚠️ Invalid user ID.");
    }
    const embed2 = await getBalanceEmbed(user);
    return target.reply({
        embeds: [embed2],
    });
}

async function getBalanceEmbed(user) {
    const playerData = await getPlayerData(user);

    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username}'s balance`,
            iconURL: user.displayAvatarURL(),
        })
        .setTitle(`${playerData.balance} ${currencyIcon.cube.emoji}`)
        .setColor("#a700f5");
}

function getHelpEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("balance")
        .withDescription("View user current balance")
        .withAliase(["bal", "balance"])
        .withExampleUsage("$balance @JiJung")
        .withUsage("**/balance** `<@user | u:[user_id]>`")
        .build();
    return helpEmbed;
}
