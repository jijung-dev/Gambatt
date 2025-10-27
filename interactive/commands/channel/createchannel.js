import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "#utils/data_handler.js";
import { getCharacter, hasCharacter } from "#utils/characterdata_handler.js";
import {
    checkNull,
    getUser,
    isAllowedImageDomain,
    parseArgs,
    renderXpBarEmoji,
} from "#utils/data_utils.js";
import {
    Channel,
    createChannel,
    getChannel,
    getCharacterFromCollection,
    GetCharacterMood,
    GetCharacterStat,
} from "#utils/userdata_handler.js";
import {
    getEmbedNotAllowedLink,
    getEmbedChannelAlreadyExists,
    getEmbedCharacterNotFound,
    getEmbedCharacterNotOwned,
} from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

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

        await replyCreateChannel(interaction, {
            channame,
            charvalue,
            profile_picture,
            banner_picture,
            color,
        });
    },

    async executeMessage(message, args) {
        const characterValue = parseArgs(args);

        await replyCreateChannel(message, characterValue);
    },

    help: getFailedEmbed(),
};

// ------------------------------ MAIN ------------------------------

async function replyCreateChannel(
    target,
    { channame, charvalue, profile_picture, banner_picture, color }
) {
    // Basic argument validation
    if (
        !checkNull("all", {
            channame,
            charvalue,
            profile_picture,
            banner_picture,
            color,
        })
    ) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }

    // Image link domain validation
    if (!isAllowedImageDomain(profile_picture, banner_picture)) {
        return target.reply({ embeds: [getEmbedNotAllowedLink()] });
    }

    // Character existence check
    if (!(await hasCharacter(charvalue))) {
        return target.reply({ embeds: [getEmbedCharacterNotFound(charvalue)] });
    }
    const character = await getCharacter(charvalue);

    const user = await getUser(target);
    if (!user) {
        return message.reply("⚠️ Invalid user ID.");
    }

    // Channel duplication check
    if ((await getChannel(user, channame)).length > 0) {
        return target.reply({
            embeds: [getEmbedChannelAlreadyExists(channame)],
        });
    }

    // Ownership and level check
    const charLevel = await getCharacterFromCollection(user, charvalue);
    if (charLevel.level == -1) {
        return target.reply({ embeds: [getEmbedCharacterNotOwned(charvalue)] });
    }

    // Character stat and channel creation
    const charStat = GetCharacterStat(character, charLevel.level);
    const newChannel = createChannelData(
        user,
        channame,
        charvalue,
        profile_picture,
        banner_picture,
        color,
        charStat
    );
    await createChannel(user, newChannel);

    // Success reply
    return target.reply({
        embeds: [getChannelEmbed(user, newChannel, character)],
    });
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("createchannel")
        .withDescription("Create a new channel with provided properties.")
        .withAliase(["cch", "createchannel"])
        .withExampleUsage(
            "$createchannel cn:Ninomae Ina'nis c:ninomae_inanis ec:#ffffff pl:profile bl:banner"
        )
        .withUsage(
            "**/createchannel** `cn:[Channel Name]` `c:[Character Value]` `ec:[Embed Color]` `pl:[Profile Image Link]` `bl:[Banner Image Link]`"
        )
        .build();
    return helpEmbed;
}

function getChannelEmbed(user, channel, character) {
    const rarityIcon = rarityIcons[character.rarity];

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

// ------------------------------ HELPERS ------------------------------

function createChannelData(
    user,
    channame,
    charvalue,
    profile_picture,
    banner_picture,
    color,
    charStat
) {
    return new Channel({
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
}
