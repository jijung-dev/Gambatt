import { SlashCommandBuilder } from "discord.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { ErrorMessage, getFailedToLeaveEmbed } from "#utils/errorembeds.js";
import { getUserRoom } from "#utils/roomdata_handler.js";
import { getUser } from "#utils/data_utils.js";
import { getRoomEmbed } from "#utils/room_utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("currentroom")
        .setDescription("View current room"),

    name: "currentroom",
    aliases: ["cr"],

    async execute(interaction) {
        const currentRoomEmbed = await getCurrentRoomEmbed(interaction);
        return interaction.reply({ embeds: [currentRoomEmbed] });
    },

    async executeMessage(message, arg) {
        const currentRoomEmbed = await getCurrentRoomEmbed(message);
        return message.reply({ embeds: [currentRoomEmbed] });
    },

    help: getHelpEmbed(),
    type: "Mod",
};

async function getCurrentRoomEmbed(target) {
    const user = await getUser(target);
    const currentRoom = await getUserRoom(user.id);

    if (!currentRoom) {
        console.log("[currentroom]" + ErrorMessage);
        return target.reply(ErrorMessage);
    }
    if (currentRoom == "NO_ROOM") {
        return getFailedToLeaveEmbed();
    }
    const currentRoomEmbed = await getRoomEmbed(target, currentRoom.id);
    return currentRoomEmbed;
}

function getHelpEmbed() {
    return new HelpEmbedBuilder()
        .withName("currentroom")
        .withDescription("view current room")
        .withAliase(["currentroom", "cr"])
        .withExampleUsage("$currentroom")
        .withUsage("**/currentroom**")
        .build();
}
