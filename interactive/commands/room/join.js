import { SlashCommandBuilder } from "discord.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import {
    ErrorMessage,
    getFailedToGetRoomEmbed,
    getFailedToJoinEmbed,
    getMissingArgumentEmbed,
} from "#utils/errorembeds.js";
import { addMember, getRoom, isInRoom } from "#utils/roomdata_handler.js";
import { getJoinedEmbed } from "#utils/room_utils.js";
import { getUser } from "#utils/data_utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("join")
        .setDescription("Join a room")
        .addStringOption((option) =>
            option
                .setName("room_id")
                .setDescription("Room ID to join")
                .setRequired(true)
        ),
    name: "join",
    aliases: ["j"],

    async execute(interaction) {
        const roomID = interaction.options.getString("room_id");

        const joinedEmbed = await getJoinEmbed(interaction, roomID);
        return interaction.reply({ embeds: [joinedEmbed] });
    },

    async executeMessage(message, arg) {
        const roomID = arg?.[0];
        if (!roomID)
            return message.reply({
                embeds: [getMissingArgumentEmbed()],
            });

        const joinedEmbed = await getJoinEmbed(message, roomID);
        return message.reply({ embeds: [joinedEmbed] });
    },

    help: getHelpEmbed(),
    type: "Room",
};

async function getJoinEmbed(target, roomID) {
    const user = await getUser(target);

    if (!(await getRoom(roomID))) return getFailedToGetRoomEmbed(roomID);
    if (await isInRoom(user.id)) return getFailedToJoinEmbed();

    const success = await addMember(roomID, user.id);

    if (!success) {
        console.log("[join]" + ErrorMessage);
        return target.reply(ErrorMessage);
    }

    const joinedEmbed = await getJoinedEmbed(success, user.id);
    return joinedEmbed;
}

function getHelpEmbed() {
    return new HelpEmbedBuilder()
        .withName("join")
        .withDescription("Join a room")
        .withAliase(["join"])
        .withExampleUsage("$join 123456")
        .withUsage("**/join** `[room_id]`")
        .build();
}
