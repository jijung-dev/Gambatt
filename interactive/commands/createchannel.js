import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "../../utils/data_handler.js";
import { GetCharacter } from "../../utils/characterdata_handler.js";
import { renderXpBarEmoji } from "../../utils/data_utils.js";
import {
    Channel,
    CreateChannel,
    GetChannel,
    GetCharacterFromCollection,
    GetCharacterMood,
    GetCharacterStat,
} from "../../utils/userdata_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("createchannel")
        .setDescription("Create a new channel")
        .addStringOption((option) =>
            option
                .setName("channel_name")
                .setRequired(true)
                .setDescription("Channel Name (unique Name)")
        )
        .addStringOption((option) =>
            option
                .setName("charvalue")
                .setRequired(true)
                .setDescription("Character ID (rikka_takanashi)")
        )
        .addStringOption((option) =>
            option
                .setName("color")
                .setRequired(true)
                .setDescription("Embed color hex color")
        )
        .addStringOption((option) =>
            option
                .setName("profile_picture")
                .setRequired(true)
                .setDescription("Direct image link")
        )
        .addStringOption((option) =>
            option
                .setName("banner_picture")
                .setRequired(true)
                .setDescription("Direct image link")
        ),

    name: "createchannel",
    aliases: ["cch"],

    async execute(interaction) {
        const channame = interaction.options.getString("channel_name");
        const charvalue = interaction.options.getString("charvalue");
        const profile_picture =
            interaction.options.getString("profile_picture");
        const banner_picture = interaction.options.getString("banner_picture");
        const color = interaction.options.getString("color");

        await ReplyCreateChannel(interaction, {
            channame,
            charvalue,
            profile_picture,
            banner_picture,
            color,
        });
    },

    async executeMessage(message, args) {
        const characterValue = parseAddCharArgs(args);

        await ReplyCreateChannel(message, characterValue);
    },
};

// ------------------------------ MAIN ------------------------------

async function ReplyCreateChannel(
    target,
    { channame, charvalue, profile_picture, banner_picture, color }
) {
    const character = await GetCharacter(charvalue);
    if (
        !channame ||
        !charvalue ||
        !profile_picture ||
        !banner_picture ||
        !color ||
        !character
    ) {
        return target.reply({ embeds: [GetFailedEmbed()] });
    }
    const user = target.user || target.author;

    if ((await GetChannel(user, channame)).length > 0) {
        return target.reply({ embeds: [GetFailedEmbedAlreadyOwn(channame)] });
    }

    const charLevel = await GetCharacterFromCollection(user, charvalue);
    if (charLevel.level == -1)
        return target.reply({ embeds: [GetFailedEmbedNotOwned(charvalue)] });

    const charStat = GetCharacterStat(character, charLevel.level);

    const newChannel = new Channel({
        user_id: user.id,
        channel_name: channame,
        profile_picture: profile_picture,
        banner_picture: banner_picture,
        mood: 0,
        color: color,
        character_id: charvalue,
        sub_count: 0,
        growth_rate: charStat.growth_rate,
        mood_down_rate: charStat.mood_down_rate,
        supa_rate: charStat.supa_rate,
        stamina_current: charStat.stamina_max,
        stamina_max: charStat.stamina_max,
        stamina_cost_per_hour: charStat.stamina_cost_per_hour,
        gears: null,
    });
    await CreateChannel(user, newChannel);

    return target.reply({
        embeds: [GetChannelEmbed(user, newChannel, character)],
    });
}

function GetFailedEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ Missing arguments")
        .setDescription(
            "```$createchannel n:Ninomae Ina'nis c:ninomae_inanis ec:#ffffff pl:profile picture link bl:banner picture link```"
        )
        .setColor("#f50000");
}
function GetFailedEmbedNotOwned(character_id) {
    return new EmbedBuilder()
        .setTitle("❌ You don't own that character")
        .setDescription(`\`${character_id}\``)
        .setColor("#f50000");
}
function GetFailedEmbedAlreadyOwn(channame) {
    return new EmbedBuilder()
        .setTitle("❌ You already have a channel with that name")
        .setDescription(`\`${channame}\``)
        .setColor("#f50000");
}

function GetChannelEmbed(user, channel, character) {
    const rarityIcon = rarityIcons[character.rarity] || {
        image: "",
        color: "#ffffff",
    };

    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username}'s channel`,
            iconURL: user.displayAvatarURL(),
        })
        .setTitle("*New Channel Created*")
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
                    { width: 8, filled: "⬜", empty: "⬛", showNumbers: true }
                ),
                inline: false,
            }
        )
        .setImage(`${channel.banner_picture}`)
        .setThumbnail(`${channel.profile_picture}`)
        .setColor(channel.color);
}

// ------------------------------ ARG PARSER ------------------------------

function parseAddCharArgs(args) {
    let channelnameParts = [];
    let charvalue = null;
    let profile_picture = null;
    let banner_picture = null;
    let color = null;

    let mode = null;

    for (const part of args) {
        if (part.startsWith("n:")) {
            mode = "channel_name";
            channelnameParts.push(part.slice(2));
        } else if (part.startsWith("c:")) {
            mode = null;
            charvalue = part.slice(2);
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
            if (mode === "channel_name") channelnameParts.push(part);
        }
    }

    const channame = channelnameParts.join(" ").trim() || null;

    return { channame, charvalue, profile_picture, banner_picture, color };
}
