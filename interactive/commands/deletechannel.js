import {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from "discord.js";
import { DeleteChannel } from "../../utils/userdata_handler.js";

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
        await ReplyDeleteChannel(interaction, channame);
    },

    async executeMessage(message, args) {
        const channel_name = args ? args.join(" ") : null;
        await ReplyDeleteChannel(message, channel_name);
    },
};

// ------------------------------ MAIN ------------------------------

async function ReplyDeleteChannel(target, channame) {
    if (!channame) {
        return target.reply({ embeds: [GetFailedEmbed()] });
    }

    const user = target.user || target.author;
    const matches = await DeleteChannel(user, channame, { checkonly: true });

    if (matches == null) {
        return target.reply({ embeds: [GetFailedEmbedNotOwned(channame)] });
    }
    if (matches.length > 1) {
        return target.reply({ embeds: [GetMultipleMatchEmbed(matches)] });
    }

    const confirmButton = new ButtonBuilder()
        .setCustomId(`confirm_delete|${user.id}`)
        .setLabel("Confirm Delete")
        .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
        .setCustomId(`cancel_delete|${user.id}`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(
        confirmButton,
        cancelButton
    );

    const reply = await target.reply({
        embeds: [GetConfirmEmbed(matches.channel_name)],
        components: [row],
        fetchReply: true,
    });

    const collector = reply.createMessageComponentCollector({
        filter: (i) => i.user.id === user.id,
        time: 15000,
    });

    collector.on("collect", async (i) => {
        if (!i.isButton()) return;

        if (i.customId === `confirm_delete|${user.id}`) {
            await DeleteChannel(user, channame);
            // use update or editReply safely
            await i.update({ embeds: [GetChannelEmbed()], components: [] });
        } else if (i.customId === `cancel_delete|${user.id}`) {
            await i.update({
                content: "❌ Deletion cancelled",
                embeds: [],
                components: [],
            });
        }
    });
}

// ------------------------------ EMBEDS ------------------------------

function GetFailedEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ Missing arguments")
        .setDescription("```$deletechannel Ninomae Ina'nis```")
        .setColor("#f50000");
}

function GetFailedEmbedNotOwned(channame) {
    return new EmbedBuilder()
        .setTitle("❌ You don't have that channel")
        .setDescription(`\`${channame}\``)
        .setColor("#f50000");
}

function GetMultipleMatchEmbed(matches) {
    const multiMatch = matches.map((m) => m.channel_name).join("\n");
    return new EmbedBuilder()
        .setTitle("❌ Multiple Channels Found")
        .setDescription(`${multiMatch}`)
        .setColor("#f50000");
}

function GetConfirmEmbed(channame) {
    return new EmbedBuilder()
        .setTitle("⚠️ Confirm Deletion")
        .setDescription(`Are you sure you want to delete **${channame}**?`)
        .setColor("#f5a500");
}

function GetChannelEmbed() {
    return new EmbedBuilder()
        .setTitle("✅ Channel Deleted")
        .setColor("#f50000");
}
