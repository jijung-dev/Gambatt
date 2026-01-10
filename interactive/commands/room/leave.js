import { SlashCommandBuilder } from "discord.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { ErrorMessage, getFailedToLeaveEmbed } from "#utils/errorembeds.js";
import { isInRoom, removeMember } from "#utils/roomdata_handler.js";
import { getLeaveedEmbed } from "#utils/room_utils.js";
import { getUser } from "#utils/data_utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Leave a room"),
    name: "leave",
    aliases: ["l"],

    async execute(interaction) {
        const leaveedEmbed = await getLeaveEmbed(interaction);
        return interaction.reply({ embeds: [leaveedEmbed] });
    },

    async executeMessage(message, arg) {
        const leaveedEmbed = await getLeaveEmbed(message);
        return message.reply({ embeds: [leaveedEmbed] });
    },

    help: getHelpEmbed(),
    type: "Room",
};

async function getLeaveEmbed(target) {
    const user = await getUser(target);

    if (!(await isInRoom(user.id))) return getFailedToLeaveEmbed();

    const success = await removeMember(user.id);

    if (!success) {
        console.log("[leave]" + ErrorMessage);
        return target.reply(ErrorMessage);
    }

    const leaveedEmbed = await getLeaveedEmbed(success, user.id);
    return leaveedEmbed;
}

function getHelpEmbed() {
    return new HelpEmbedBuilder()
        .withName("leave")
        .withDescription("Leave a room")
        .withAliase(["leave"])
        .withExampleUsage("$leave")
        .withUsage("**/leave**")
        .build();
}
