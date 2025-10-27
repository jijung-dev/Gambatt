import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser } from "#utils/data_utils.js";

export default {
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
            user = await getUser(message, args[0]);
        }
        await ReplyProfile(message, user);
    },
};

// -------------------- Helpers --------------------
async function ReplyProfile(target, user) {
    if (!user) {
        return message.reply("⚠️ Invalid user ID.");
    }
    const embed2 = GetProfileEmbed(user);
    return target.reply({
        embeds: [embed2],
        // TODO: Button to collection, inventory
        // components: [
        //     new ActionRowBuilder().addComponents(select2),
        //     new ActionRowBuilder().addComponents(roll1, roll10),
        // ],
    });
}

function GetProfileEmbed(user) {
    return new EmbedBuilder()
        .setAuthor({ name: "Profile" })
        .setTitle(user.username)
        .setDescription("titletitle") // TODO: Custom title
        .addFields({
            name: "Top favorite card",
            value: "card \ncard\ncard", // TODO: Custom fav card command
            inline: false,
        })
        .setThumbnail(user.displayAvatarURL())
        .setColor("#a700f5");
}
