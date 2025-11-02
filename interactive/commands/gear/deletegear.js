import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getEmbedGearNotFound } from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { hasGear, removeGear } from "#utils/itemdata_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("deletegear")
        .setDescription("Remove an existing gear in the database.")
        .addStringOption((option) =>
            option
                .setName("gearid")
                .setRequired(true)
                .setDescription("Gear key (unique ID)")
        ),

    name: "deletegear",
    aliases: ["dg"],

    async execute(interaction) {
        const gearid = interaction.options.getString("gearid");

        await replyDeleteGear(interaction, gearid);
    },

    async executeMessage(message, args) {
        const gearid = args?.[0];
        await replyDeleteGear(message, gearid);
    },
    help: getFailedEmbed(),
    type: "Gear",
};

// ------------------------------ MAIN ------------------------------

async function replyDeleteGear(target, gearid) {
    if (!gearid) {
        return target.reply({ embeds: [getFailedEmbed()] });
    }
    if (!(await hasGear(gearid))) {
        return target.reply({ embeds: [getEmbedGearNotFound(gearid)] });
    }

    await removeGear(gearid);

    return target.reply({ embeds: [getDeleteGearEmbed(gearid)] });
}

// ------------------------------ EMBEDS ------------------------------

function getFailedEmbed() {
    const helpEmbed = new HelpEmbedBuilder()
        .withName("deletegear")
        .withDescription(
            "Delete an existing gear. **DELETION CAN'T BE UNDONE**"
        )
        .withAliase(["dg", "deletegear"])
        .withExampleUsage("$deletegear gt730_gpu")
        .withUsage("**/deletegear** `[gearid_type]`")
        .build();
    return helpEmbed;
}

function getDeleteGearEmbed(gear) {
    return new EmbedBuilder()
        .setTitle("✅ Removed Gear")
        .setDescription(`\`${gear}\``)
        .setColor("#f50000");
}
