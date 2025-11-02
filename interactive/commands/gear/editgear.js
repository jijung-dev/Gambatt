import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { tierIcons, tierMap } from "#utils/data_handler.js";
import {
    checkNull,
    isAllowedImageDomain,
    parseArgs,
    toCodeBlock,
} from "#utils/data_utils.js";
import {
    getEmbedGearNotFound,
    getEmbedNotAllowedLink,
} from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { editGear, hasGear } from "#utils/itemdata_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("editgear")
        .setDescription("Edit an existing gear in the database.")
        .addStringOption((option) =>
            option
                .setName("gearid")
                .setRequired(true)
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
                .setName("image_link")
                .setRequired(false)
                .setDescription("Gear Image")
        )
        .addNumberOption((option) =>
            option
                .setName("tier")
                .setRequired(false)
                .setDescription("Tier of the gear")
        )
        .addNumberOption((option) =>
            option
                .setName("growth_rate")
                .setRequired(false)
                .setDescription("growth_rate of the gear")
        )
        .addNumberOption((option) =>
            option
                .setName("mood_down_rate")
                .setRequired(false)
                .setDescription("mood_down_rate of the gear")
        )
        .addNumberOption((option) =>
            option
                .setName("supa_rate")
                .setRequired(false)
                .setDescription("supa_rate of the gear")
        )
        .addNumberOption((option) =>
            option
                .setName("stamina_cost_per_hour")
                .setRequired(false)
                .setDescription("stamina_cost_per_hour of the gear")
        ),

    name: "editgear",
    aliases: ["eg"],

    async execute(interaction) {
        const gearid = interaction.options.getString("gearid");
        const gearname = interaction.options.getString("gearname");
        const tier = interaction.options.getNumber("tier");
        const image_link = interaction.options.getString("image_link");
        const growth_rate = interaction.options.getNumber("growth_rate");
        const mood_down_rate = interaction.options.getNumber("mood_down_rate");
        const supa_rate = interaction.options.getNumber("supa_rate");
        const stamina_cost_per_hour = interaction.options.getNumber(
            "stamina_cost_per_hour"
        );

        await replyEditGear(interaction, {
            gearid,
            gearname,
            tier,
            image_link,
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
            image_link: gear.image_link,
            growth_rate: gear.growth_rate,
            mood_down_rate: gear.mood_down_rate,
            supa_rate: gear.supa_rate,
            stamina_cost_per_hour: gear.stamina_cost_per_hour,
        };

        await replyEditGear(message, gearValue);
    },
    help: getFailedEmbed(),
    type: "Gear",
};

// ------------------------------ MAIN ------------------------------

async function replyEditGear(
    target,
    {
        gearid,
        gearname,
        tier,
        image_link,
        growth_rate,
        mood_down_rate,
        supa_rate,
        stamina_cost_per_hour,
    }
) {
    if (
        !gearid ||
        !checkNull(
            "or",
            gearname,
            tier,
            image_link,
            growth_rate,
            mood_down_rate,
            supa_rate,
            stamina_cost_per_hour
        )
    ) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }
    if (!(await hasGear(gearid))) {
        return target.reply({ embeds: [getEmbedGearNotFound(gearid)] });
    }
    if (image_link && !isAllowedImageDomain(image_link)) {
        return target.reply({ embeds: [getEmbedNotAllowedLink()] });
    }

    const updates = {};
    if (gearname) updates.label = gearname;
    if (tier) updates.tier = tier;
    if (image_link) updates.image = image_link;
    if (growth_rate) updates.growth_rate = growth_rate;
    if (mood_down_rate) updates.mood_down_rate = mood_down_rate;
    if (supa_rate) updates.supa_rate = supa_rate;
    if (stamina_cost_per_hour)
        updates.stamina_cost_per_hour = stamina_cost_per_hour;

    const gear = await editGear(gearid, updates);

    return target.reply({
        embeds: [getEditGearEmbed(gear)],
    });
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("editgear")
        .withDescription("Edit an existing gear")
        .withAliase(["eg", "editgear"])
        .withExampleUsage(
            "$editgear gi:gt730_gpu gn:NVIDIA GeForce GT 730 t:2 l:image_link gr:3 mdr:-10"
        )
        .withUsage(
            "**/editgear** `gi:[gearid_type]` `<gn:[Gear Name]>` `<t:[Tier]>` `<l:[image_link.com]>` `<gr:[Growth Rate]>` `<mdr:[Mood Down Rate]>` `<sr:[Supa Rate]>` `<scph:[Stamina Cost Per Hour]>`"
        )
        .build();
    return helpEmbed;
}

function getEditGearEmbed(gear) {
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
        .setTitle("✅ Edited Gear")
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
            text: `${gear.id}`,
        })
        .setColor(tierIcon.color);
}
