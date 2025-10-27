import {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from "discord.js";
import { deleteChannel, getChannel } from "#utils/userdata_handler.js";
import { getEmbedChannelNotOwned } from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { getUser } from "#utils/data_utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("deletechannel")
        .setDescription("Delete a channel")
        .addStringOption((option) =>
            option
                .setName("channel_name")
                .setRequired(true)
                .setDescription("Channel Name (unique Name)")
        ),

    name: "deletechannel",
    aliases: ["dch"],

    async execute(interaction) {
        const channame = interaction.options.getString("channel_name");
        await replyDeleteChannel(interaction, channame);
    },

    async executeMessage(message, args) {
        const channel_name = args ? args.join(" ") : null;
        await replyDeleteChannel(message, channel_name);
    },
    help: getFailedEmbed(),
};

// ------------------------------ MAIN ------------------------------

async function replyDeleteChannel(target, channame) {
    if (!channame) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }

    const user = await getUser(target);
    if (!user) {
        return message.reply("⚠️ Invalid user ID.");
    }

    // Check for multiple matches
    const matches = await getChannel(user, channame);
    if (matches == null || matches.length == 0) {
        return target.reply({ embeds: [getEmbedChannelNotOwned(channame)] });
    }
    if (matches.length > 1) {
        return target.reply({ embeds: [getMultipleMatchEmbed(matches)] });
    }
    const channel = matches[0];
    
    // Confirmations
    const row = getConfirmationRow(user.id);
    const reply = await target.reply({
        embeds: [getConfirmEmbed(channel.channel_name)],
        components: [row],
        fetchReply: true,
    });

    const collector = reply.createMessageComponentCollector({
        filter: (i) => i.user.id === user.id,
        time: 15000,
    });

    // Actual Deletion
    collector.on("collect", async (i) => {
        if (!i.isButton()) return;

        if (i.customId === `confirm_delete|${user.id}`) {
            await deleteChannel(user, channel);
            // use update or editReply safely
            await i.update({ embeds: [getChannelDeletedEmbed()], components: [] });
        } else if (i.customId === `cancel_delete|${user.id}`) {
            await i.update({
                embeds: [getChannelNotDeletedEmbed()],
                components: [],
            });
        }
    });
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("deletechannel")
        .withDescription(
            "Delete a channel of your own. **DELETION CAN'T BE UNDONE**"
        )
        .withAliase(["dch", "deletechannel"])
        .withExampleUsage("$deletechannel Ninomae Ina'nis")
        .withUsage("**/deletechannel** `[Channel Name]`")
        .build();
    return helpEmbed;
}

function getMultipleMatchEmbed(matches) {
    const multiMatch = matches.map((m) => m.channel_name).join("\n");
    return new EmbedBuilder()
        .setTitle("❌ Multiple Channels Found")
        .setDescription(`${multiMatch}`)
        .setColor("#f50000");
}

function getConfirmEmbed(channame) {
    return new EmbedBuilder()
        .setTitle("⚠️ Confirm Deletion")
        .setDescription(`Are you sure you want to delete **${channame}**?`)
        .setColor("#f5a500");
}

function getChannelDeletedEmbed() {
    return new EmbedBuilder()
        .setTitle("✅ Channel Deleted")
        .setColor("#f50000");
}

function getChannelNotDeletedEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ Channel Is Not Deleted")
        .setColor("#f50000");
}

// ------------------------------ HELPERS ------------------------------

function getConfirmationRow(userID) {
    const confirmButton = new ButtonBuilder()
        .setCustomId(`confirm_delete|${userID}`)
        .setLabel("Confirm Delete")
        .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
        .setCustomId(`cancel_delete|${userID}`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder().addComponents(confirmButton, cancelButton);
}
