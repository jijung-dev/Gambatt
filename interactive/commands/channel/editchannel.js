import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "#utils/data_handler.js";
import { getCharacter } from "#utils/characterdata_handler.js";
import {
    checkNull,
    getUser,
    isAllowedImageDomain,
    parseArgs,
    renderXpBarEmoji,
} from "#utils/data_utils.js";
import {
    getChannel,
    GetCharacterMood,
    updateChannel,
} from "#utils/userdata_handler.js";
import {
    getEmbedChannelNotOwned,
    getEmbedNotAllowedLink,
} from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName("editchannel")
        .setDescription("Edit the channel")
        .addStringOption((option) =>
            option
                .setName("channel_name")
                .setRequired(true)
                .setDescription("Channel name")
        )
        .addStringOption((option) =>
            option
                .setName("channel_new_name")
                .setRequired(false)
                .setDescription("Channel new name")
        )
        .addStringOption((option) =>
            option
                .setName("color")
                .setRequired(false)
                .setDescription("Embed color hex color")
        )
        .addStringOption((option) =>
            option
                .setName("profile_picture")
                .setRequired(false)
                .setDescription("Direct image link")
        )
        .addStringOption((option) =>
            option
                .setName("banner_picture")
                .setRequired(false)
                .setDescription("Direct image link")
        ),

    name: "editchannel",
    aliases: ["ech"],

    async execute(interaction) {
        const channame = interaction.options.getString("channel_name");
        const channewname = interaction.options.getString("channel_new_name");
        const profile_picture =
            interaction.options.getString("profile_picture");
        const banner_picture = interaction.options.getString("banner_picture");
        const color = interaction.options.getString("color");

        await replyEditChannel(interaction, {
            channame,
            channewname,
            profile_picture,
            banner_picture,
            color,
        });
    },

    async executeMessage(message, args) {
        const { channel } = parseArgs(args);

        const characterValue = {
            channame: channel.channame,
            channewname: channel.channewname,
            profile_picture: channel.profile_picture,
            banner_picture: channel.banner_picture,
            color: channel.color,
        };
        await replyEditChannel(message, characterValue);
    },
    help: getFailedEmbed(),
    type: "Channel",
};

// ------------------------------ MAIN ------------------------------

async function replyEditChannel(
    target,
    { channame, channewname, profile_picture, banner_picture, color }
) {
    if (
        !channame ||
        !checkNull("or", channewname, profile_picture, banner_picture, color)
    ) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }

    // Image link domain validation
    if (
        (profile_picture && !isAllowedImageDomain(profile_picture)) ||
        (banner_picture && !isAllowedImageDomain(banner_picture))
    ) {
        return target.reply({ embeds: [getEmbedNotAllowedLink()] });
    }

    const user = await getUser(target);
    if (!user) {
        return target.reply("⚠️ Invalid user ID.");
    }
    // Check for multiple matches
    const matches = await getChannel(user, channame);
    if (matches == null) {
        return target.reply({ embeds: [getEmbedChannelNotOwned(channame)] });
    }
    if (matches.length > 1) {
        return target.reply({ embeds: [getMultipleMatchEmbed(matches)] });
    }
    const channel = matches[0];

    // Get any updates to channel
    const updates = {};
    if (channewname) updates.channel_name = channewname;
    if (profile_picture) updates.profile_picture = profile_picture;
    if (banner_picture) updates.banner_picture = banner_picture;
    if (color) updates.color = color;

    const newchannel = await updateChannel(user, channel, updates);

    const embed = await getChannelEmbed(user, newchannel);
    return target.reply({ embeds: [embed] });
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("editchannel")
        .withDescription("Edit channel properties")
        .withAliase(["ech", "editchannel"])
        .withExampleUsage(
            "$editchannel cn:Ninomae Ina'nis cnn:NiNoMaE INAFF ec:#ffffff pl:new profile picture bl:new banner picture"
        )
        .withUsage(
            "**/editchannel** `cn:[Channel Name]` `<cnn:[New Channel Name]>` `<ec:[#embed_color]>` `<pl:[profile_link.com]>` `<bl:[Banner image_link.com]>`"
        )
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

async function getChannelEmbed(user, channel) {
    const character = await getCharacter(channel.character_id);
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username}'s channel`,
            iconURL: user.displayAvatarURL(),
        })
        .setTitle("*Channel Edited*")
        .setDescription(`**${channel.channel_name}**`)
        .addFields(
            {
                name: "Owner",
                value: `${rarityIcon.emoji} ${character.label} - \`${
                    character.edition
                }\` - ${
                    character.series
                }\n**Current Mood**: \`${GetCharacterMood(channel.mood)}\``,
                inline: false,
            },
            {
                name: "Subscriber",
                value: `\`${channel.sub_count}\``,
                inline: true,
            },
            {
                name: "Views Average",
                value: `\`${(channel.sub_count / 100) * 10}\``,
                inline: true,
            },
            {
                name: "Stats",
                value: `Supa Rate - \`${channel.supa_rate}%\`\nGrowth Rate - \`${channel.growth_rate}%\`\nMood Down Rate - \`${channel.mood_down_rate}%\`\nStamina Cost Per Hour - \`${channel.stamina_cost_per_hour}/h\``,
                inline: false,
            },
            {
                name: "Gears",
                value: `CPU: \`${channel.gears.cpu}\`\nGPU: \`${channel.gears.gpu}\`\nMonitor: \`${channel.gears.monitor}\`\nKeyboard: \`${channel.gears.keyboard}\`\nMouse: \`${channel.gears.mouse}\``,
                inline: false,
            },
            {
                name: `Stamina : ${channel.stamina_current}/${channel.stamina_max}`,
                value: renderXpBarEmoji(
                    channel.stamina_current,
                    channel.stamina_max,
                    {
                        width: 8,
                        filled: "⬜",
                        empty: "⬛",
                        showNumbers: true,
                    }
                ),
                inline: false,
            }
        )
        .setImage(`${channel.banner_picture}`)
        .setThumbnail(`${channel.profile_picture}`)
        .setColor(channel.color);
}
