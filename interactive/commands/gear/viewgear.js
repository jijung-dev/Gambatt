import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { setPagination, deletePagination } from "#utils/PaginationStore.js";
import { getPageButtons } from "#utils/PaginationButtons.js";
import {
    checkNull,
    getUser,
    parseArgs,
    toCodeBlock,
} from "#utils/data_utils.js";
import { getEmbedGearNotFound } from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { getGear, getGears } from "#utils/itemdata_handler.js";
import { tierIcons, tierMap } from "#utils/data_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("viewgear")
        .setDescription("View gear")
        .addStringOption((option) =>
            option
                .setName("gearid")
                .setRequired(false)
                .setDescription("Gear key (unique ID)")
        )
        .addStringOption((option) =>
            option
                .setName("gearname")
                .setRequired(false)
                .setDescription("Gear display name")
        )
        .addStringOption((option) =>
            option
                .setName("tier")
                .setRequired(false)
                .setDescription("Tier of the gear")
        )
        .addStringOption((option) =>
            option
                .setName("growth_rate")
                .setRequired(false)
                .setDescription("growth_rate of the gear")
        )
        .addStringOption((option) =>
            option
                .setName("mood_down_rate")
                .setRequired(false)
                .setDescription("mood_down_rate of the gear")
        )
        .addStringOption((option) =>
            option
                .setName("supa_rate")
                .setRequired(false)
                .setDescription("supa_rate of the gear")
        )
        .addStringOption((option) =>
            option
                .setName("stamina_cost_per_hour")
                .setRequired(false)
                .setDescription("stamina_cost_per_hour of the gear")
        ),

    name: "viewgear",
    aliases: ["vg"],

    async execute(interaction) {
        const gearid = interaction.options.getString("gearid");
        const gearname = interaction.options.getString("gearname");
        const tier = interaction.options.getString("tier");
        const growth_rate = interaction.options.getString("growth_rate");
        const mood_down_rate = interaction.options.getString("mood_down_rate");
        const supa_rate = interaction.options.getString("supa_rate");
        const stamina_cost_per_hour = interaction.options.getString(
            "stamina_cost_per_hour"
        );

        await replyViewGear(interaction, {
            gearid,
            gearname,
            tier,
            growth_rate,
            mood_down_rate,
            supa_rate,
            stamina_cost_per_hour,
        });
    },

    async executeMessage(message, args) {
        const { gear } = parseArgs(args);
        
        const gearValue = {
            gearid: gear.gearid,
            gearname: gear.gearname,
            tier: gear.tier,
            growth_rate: gear.growth_rate,
            mood_down_rate: gear.mood_down_rate,
            supa_rate: gear.supa_rate,
            stamina_cost_per_hour: gear.stamina_cost_per_hour,
        };

        await replyViewGear(message, gearValue);
    },
    help: getFailedEmbed(),
    type: "Gear",
};

// ------------------------------ MAIN ------------------------------

async function replyViewGear(
    target,
    {
        gearid,
        gearname,
        tier,
        growth_rate,
        mood_down_rate,
        supa_rate,
        stamina_cost_per_hour,
    }
) {
    if (
        !checkNull("or", {
            gearid,
            gearname,
            tier,
            growth_rate,
            mood_down_rate,
            supa_rate,
            stamina_cost_per_hour,
        })
    ) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }

    const chars = await getGears(
        gearid,
        gearname,
        tier,
        growth_rate,
        mood_down_rate,
        supa_rate,
        stamina_cost_per_hour
    );

    if (chars.length === 0) {
        return target.reply({ embeds: [getEmbedGearNotFound()] });
    } else {
        return sendMatchList(target, chars);
    }
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("viewgear")
        .withDescription("View existing gears")
        .withAliase(["vg", "viewgear"])
        .withExampleUsage(
            "$viewgear gi:gt730_gpu gn:NVIDIA GT730 t:>=3,<=5 gr:<9 sr:>2 mdr:1 scph:<=10"
        )
        .withUsage(
            "**/addgear** `<gi:[gearid_type]>` `<gn:[Gear Name]>` `<t:[#Tier]>` `<gr:[#Growth Rate]>` `<mdr:[#Mood Down Rate]>` `<sr:[#Supa Rate]>` `<scph:[#Stamina Cost/Hr]>`"
        )
        .build();
    return helpEmbed;
}

async function sendMatchList(target, gearsMatch) {
    const user = await getUser(target);
    if (!user) {
        return target.reply("⚠️ Invalid user ID.");
    }
    const embeds = await getMatchListEmbeds(gearsMatch);
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
        }, 120000);
    }
}

async function getMatchListEmbeds(gearsMatch) {
    const entries = await Promise.all(gearsMatch.map(getGear));
    return entries.map((gear, i) => getGearEmbed(gear, i, entries.length));
}

function getGearEmbed(gear, pageIndex, totalPages) {
    const tierName = tierMap[gear.tier];
    const tierIcon = tierIcons[tierName];
    const stats = [];

    if (gear.supa_rate !== 0) stats.push(`Supa Rate - \`${gear.supa_rate}%\``);
    if (gear.growth_rate !== 0)
        stats.push(`Growth Rate - \`${gear.growth_rate}%\``);
    if (gear.mood_down_rate !== 0)
        stats.push(`Mood Down Rate - \`${gear.mood_down_rate}%\``);
    if (gear.stamina_cost_per_hour !== 0)
        stats.push(
            `Stamina Cost Per Hour - \`${gear.stamina_cost_per_hour}/h\``
        );

    const statsValue =
        stats.length > 0 ? stats.join("\n") : "*No stats available*";

    return new EmbedBuilder()
        .setThumbnail(tierIcon.image)
        .setTitle("Gear Info")
        .addFields(
            {
                name: "Gear",
                value: toCodeBlock(gear.label),
                inline: false,
            },
            {
                name: "Stats",
                value: statsValue,
                inline: false,
            }
        )
        .setImage(gear.image)
        .setFooter({
            text: `${gear.id} - Page ${pageIndex + 1} / ${totalPages}`,
        })
        .setColor(tierIcon.color);
}
