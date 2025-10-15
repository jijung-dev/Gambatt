import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { rarityIcons } from "../../utils/data_handler.js";
import { GetCharacter } from "../../utils/characterdata_handler.js";
import {
    setPagination,
    deletePagination,
} from "../../utils/PaginationStore.js";
import { GetPageButtons } from "../../utils/PaginationButtons.js";
import {
    GetChannel,
    GetChannels,
    GetCharacterMood,
} from "../../utils/userdata_handler.js";
import { renderXpBarEmoji } from "../../utils/data_utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("viewchannel")
        .setDescription("View a channel")
        .addStringOption((option) =>
            option
                .setName("channel_name")
                .setDescription("Channel name")
                .setRequired(false)
        ),

    name: "viewchannel",
    aliases: ["vch"],

    async execute(interaction) {
        const channel_name = interaction.options.getString("channel_name");
        await ReplyChannel(interaction, channel_name);
    },

    async executeMessage(message, args) {
        const channel_name = args ? args.join(" ") : null;
        await ReplyChannel(message, channel_name);
    },
};

// ------------------------------ MAIN ------------------------------

async function ReplyChannel(target, channame) {
    // if (!channame) {
    //     return target.reply({
    //         content: "Use `.help viewchannel` for more info",
    //     });
    // }

    const user = target.user || target.author;
    let channels;

    if (!channame) {
        channels = await GetChannels(user);
    } else {
        channels = await GetChannel(user, channame);
    }

    if (!channels || channels.length === 0) {
        return target.reply({ embeds: [GetFailedEmbed()] });
    } else {
        return SendMatchList(user, target, channels);
    }
}

function GetFailedEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ No Channel Found")
        .setColor("#f50000");
}

async function SendMatchList(user, target, channelsMatch) {
    const embeds = await GetMatchListEmbeds(channelsMatch, user);
    let currentPage = 0;

    const reply = await target.reply({
        embeds: [embeds[currentPage]],
        components:
            embeds.length > 1
                ? [GetPageButtons(true, embeds.length === 1, user)]
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

async function GetMatchListEmbeds(channelsMatch, user) {
    const embeds = await Promise.all(
        channelsMatch.map((channel, i) =>
            GetChannelEmbed(user, channel, i, channelsMatch.length)
        )
    );
    return embeds;
}

async function GetChannelEmbed(user, channel, pageIndex, totalPages) {
    const character = await GetCharacter(channel.character_id);
    const rarityIcon = rarityIcons[character.rarity] || {
        image: "",
        color: "#ffffff",
    };

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
