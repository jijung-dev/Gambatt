import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "../../utils/data_handler.js";
import { GetCharacter } from "../../utils/characterdata_handler.js";
import { renderXpBarEmoji } from "../../utils/data_utils.js";
import {
    GetCharacterMood,
    UpdateChannel,
} from "../../utils/userdata_handler.js";

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

        await ReplyEditChannel(interaction, {
            channame,
            channewname,
            profile_picture,
            banner_picture,
            color,
        });
    },

    async executeMessage(message, args) {
        const characterValue = parseEditChannelArgs(args);
        await ReplyEditChannel(message, characterValue);
    },
};

// ------------------------------ MAIN ------------------------------

async function ReplyEditChannel(
    target,
    { channame, channewname, profile_picture, banner_picture, color }
) {
    if (!channame) {
        return target.reply({ embeds: [GetFailedEmbed()] });
    }
    const user = target.user || target.author;

    const updates = {};
    if (channewname) updates.channel_name = channewname;
    if (profile_picture) updates.profile_picture = profile_picture;
    if (banner_picture) updates.banner_picture = banner_picture;
    if (color) updates.color = color;

    const matches = await UpdateChannel(user, channame, updates);

    if (matches == null) {
        return target.reply({ embeds: [GetFailedEmbedNotOwned(channame)] });
    }
    if (matches.length > 1) {
        return target.reply({ embeds: [GetMultipleMatchEmbed(matches)] });
    }

    const embed = await GetChannelEmbed(user, matches);
    return target.reply({ embeds: [embed] });
}

function GetFailedEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ Missing arguments")
        .setDescription(
            "```$editchannel Ninomae Ina'nis n:New name ec:New color pl:New profile picture bl:new banner picture```"
        )
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

async function GetChannelEmbed(user, channel) {
    const character = await GetCharacter(channel.character_id);
    const rarityIcon = rarityIcons[character.rarity] || {
        image: "",
        color: "#ffffff",
    };
    console.log(channel.channel_name);

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

// ------------------------------ ARG PARSER ------------------------------

function parseEditChannelArgs(args) {
    let channameParts = [];
    let channewnameParts = [];
    let profile_picture = null;
    let banner_picture = null;
    let color = null;

    let mode = null; // track if we’re currently collecting for series/edition

    for (const part of args) {
        if (part.startsWith("n:")) {
            mode = "new_name";
            channewnameParts.push(part.slice(2));
        } else if (part.startsWith("pl:")) {
            mode = null;
            profile_picture = part.slice(3);
        } else if (part.startsWith("bl:")) {
            mode = null;
            banner_picture = part.slice(3);
        } else if (part.startsWith("ec:")) {
            mode = null;
            color = part.slice(3);
        } else {
            // If we are in a mode, keep appending to that
            if (mode === "new_name") {
                channewnameParts.push(part);
            } else {
                channameParts.push(part);
            }
        }
    }

    const channame = channameParts.join(" ").trim() || null;
    const channewname = channewnameParts.length
        ? channewnameParts.join(" ").trim()
        : null;

    return { channame, channewname, profile_picture, banner_picture, color };
}
