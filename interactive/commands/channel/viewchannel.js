import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "#utils/data_handler.js";
import { getCharacter } from "#utils/characterdata_handler.js";
import { setPagination, deletePagination } from "#utils/PaginationStore.js";
import { getPageButtons } from "#utils/PaginationButtons.js";
import {
    getChannel,
    getChannels,
    GetCharacterMood,
} from "#utils/userdata_handler.js";
import { getUser, parseArgs, renderXpBarEmoji } from "#utils/data_utils.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName("viewchannel")
        .setDescription("View a channel")
        .addStringOption((option) =>
            option
                .setName("channel_name")
                .setDescription("Channel name")
                .setRequired(false)
        )
        .addUserOption((option) =>
            option
                .setName("user_id")
                .setDescription("user_id")
                .setRequired(false)
        ),

    name: "viewchannel",
    aliases: ["vch"],

    async execute(interaction) {
        const channame = interaction.options.getString("channel_name");
        const mention = interaction.options.getString("user_id");
        await replyChannel(interaction, { channame, mention });
    },

    async executeMessage(message, args) {
        const channel = parseArgs(args);
        await replyChannel(message, channel);
    },
    help: getHelpEmbed(),
};

// ------------------------------ MAIN ------------------------------

async function replyChannel(target, { channame, mention }) {
    const user = await getUser(target, mention);
    if (!user) {
        return message.reply("⚠️ Invalid user ID.");
    }

    let channels;

    if (!channame) {
        channels = await getChannels(user);
    } else {
        channels = await getChannel(user, channame);
    }

    if (!channels || channels.length === 0) {
        return target.reply({ embeds: [getFailedEmbed(user)] });
    } else {
        return sendMatchList(user, target, channels);
    }
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed(user) {
    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username}'s channels`,
            iconURL: user.displayAvatarURL(),
        })
        .setDescription("Empty")
        .setColor("#858585");
}

function getHelpEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("viewchannel")
        .withDescription("View a channel stats and properties")
        .withAliase(["vch", "viewchannel"])
        .withExampleUsage("$viewchannel @JiJung cn:Ninomae Ina'nis")
        .withUsage(
            "**/viewchannel** `<@user | u:[user_id]>` `cn:[Channel Name]`"
        )
        .build();
    return helpEmbed;
}

async function sendMatchList(user, target, channelsMatch) {
    const embeds = await getMatchListEmbeds(channelsMatch, user);
    let currentPage = 0;

    const reply = await target.reply({
        embeds: [embeds[currentPage]],
        components:
            embeds.length > 1
                ? [getPageButtons(true, embeds.length === 1, user)]
                : [],
        fetchReply: true,
    });

    if (embeds.length > 1) {
        setPagination(reply.id, { currentPage, embeds });

        setTimeout(async () => {
            deletePagination(reply.id);
            try {
                await reply.edit({ components: [] });
            } catch {}
        }, 120000); // 2 minutes
    }
}

async function getMatchListEmbeds(channelsMatch, user) {
    const embeds = await Promise.all(
        channelsMatch.map((channel, i) =>
            getChannelEmbed(user, channel, i, channelsMatch.length)
        )
    );
    return embeds;
}

async function getChannelEmbed(user, channel, pageIndex, totalPages) {
    const character = await getCharacter(channel.character_id);
    const rarityIcon = rarityIcons[character.rarity];

    return new EmbedBuilder()
        .setAuthor({
            name: `${user.username}'s channel`,
            iconURL: user.displayAvatarURL(),
        })
        .setTitle(`**${channel.channel_name}**`)
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
        .setColor(channel.color)
        .setFooter({ text: `Page ${pageIndex + 1} / ${totalPages}` });
}
