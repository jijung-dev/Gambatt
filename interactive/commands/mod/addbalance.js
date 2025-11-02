import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { currencyIcon } from "#utils/data_handler.js";
import { getPlayerData, increaseBalance } from "#utils/userdata_handler.js";
import { getUser } from "#utils/data_utils.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName("addbalance")
        .setDescription("Add balance to user")
        .addUserOption((option) =>
            option
                .setName("user_id")
                .setDescription("user_id")
                .setRequired(true)
        )
        .addNumberOption((option) =>
            option.setName("amount").setDescription("amount").setRequired(true)
        ),
    name: "addbalance",
    aliases: [],

    async execute(interaction) {
        const user = interaction.options.getUser("user_id") || interaction.user;
        const amount = interaction.options.getNumber("amount");
        await replyAddBalance(interaction, user, amount);
    },

    async executeMessage(message, args) {
        let user;
        let amount;

        if (args?.[0]) {
            user = await getUser(message, args[0]);
        }
        if (args?.[1]) {
            amount = args[1];
        }
        await replyAddBalance(message, user, amount);
    },
    help: getHelpEmbed(),
    type: "Mod",
};

async function replyAddBalance(target, user, amount) {
    if (!user) {
        return target.reply("⚠️ Invalid user ID.");
    }
    if (!amount) {
        return target.reply({ embeds: [getHelpEmbed()] });
    }
    await increaseBalance(user, amount);

    const embed2 = await getAddBalanceEmbed(user, amount);
    return target.reply({
        embeds: [embed2],
    });
}

async function getAddBalanceEmbed(user, amount) {
    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username}'s balance`,
            iconURL: user.displayAvatarURL(),
        })
        .setTitle(
            `+ ${amount}${currencyIcon.cube.emoji}`
        )
        .setColor("#a700f5");
}

function getHelpEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("addbalance")
        .withDescription("Add balance to current user")
        .withAliase(["addbalance"])
        .withExampleUsage("$addbalance @JiJung 3000")
        .withUsage("**/addbalance** `@user | [user_id]` `[Amount]`")
        .build();
    return helpEmbed;
}
