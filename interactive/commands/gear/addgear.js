import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { tierIcons, tierMap } from "#utils/data_handler.js";
import {
    checkNull,
    isAllowedImageDomain,
    parseArgs,
    toCodeBlock,
} from "#utils/data_utils.js";
import {
    getEmbedGearAlreadyExist,
    getEmbedNotAllowedLink,
} from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { addGear, hasGear } from "#utils/itemdata_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("addgear")
        .setDescription("Add a new gear to the database.")
        .addStringOption((option) =>
            option
                .setName("gearid")
                .setRequired(true)
                .setDescription("Gear key (unique ID)")
        )
        .addStringOption((option) =>
            option
                .setName("gearname")
                .setRequired(true)
                .setDescription("Gear display name")
        )
        .addStringOption((option) =>
            option
                .setName("image_link")
                .setRequired(true)
                .setDescription("Gear Image")
        )
        .addNumberOption((option) =>
            option
                .setName("tier")
                .setRequired(true)
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

    name: "addgear",
    aliases: ["ag"],

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

        await replyAddGear(interaction, {
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

        await replyAddGear(message, gearValue);
    },
    help: getFailedEmbed(),
    type: "Gear",
};

// ------------------------------ MAIN ------------------------------

async function replyAddGear(
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
        !checkNull("all", { gearid, gearname, tier, image_link }) &&
        !checkNull("or", {
            growth_rate,
            mood_down_rate,
            supa_rate,
            stamina_cost_per_hour,
        })
    ) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }

    if (await hasGear(gearid)) {
        return target.reply({
            embeds: [getEmbedGearAlreadyExist(gearid)],
        });
    }

    if (!isAllowedImageDomain(image_link)) {
        return target.reply({
            embeds: [getEmbedNotAllowedLink()],
        });
    }

    const gear = await addGear({
        id: gearid,
        label: gearname,
        tier: tier,
        image: image_link,
        growth_rate: growth_rate || 0,
        mood_down_rate: mood_down_rate || 0,
        supa_rate: supa_rate || 0,
        stamina_cost_per_hour: stamina_cost_per_hour || 0,
    });

    return target.reply({
        embeds: [getGearEmbed(gear)],
    });
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("addgear")
        .withDescription("Create a new gear with provided properties.")
        .withAliase(["ag", "addgear"])
        .withExampleUsage(
            "$addgear gi:gt730_gpu gn:NVIDIA GeForce GT 730 t:2 l:image_link gr:3 mdr:-10"
        )
        .withUsage(
            "**/addgear** `gi:[gearid_type]` `gn:[Gear Name]` `t:[Tier]` `l:[image_link.com]` `<gr:[Growth Rate]>` `<mdr:[Mood Down Rate]>` `<sr:[Supa Rate]>` `<scph:[Stamina Cost Per Hour]>`"
        )
        .build();
    return helpEmbed;
}

function getGearEmbed(gear) {
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
        .setTitle("✅ Added Gear")
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
