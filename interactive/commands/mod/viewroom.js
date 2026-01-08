import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { getFailedToGetRoomEmbed } from "#utils/errorembeds.js";
import { getRoom, getAllRooms } from "#utils/roomdata_handler.js";
import { getRoomEmbed } from "#utils/room_utils.js";
import { getUser } from "#utils/data_utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("viewroom")
        .setDescription("View active rooms")
        .addStringOption((option) =>
            option
                .setName("room_id")
                .setDescription("Room ID to view")
                .setRequired(false)
        ),
    name: "viewroom",
    aliases: ["vr"],

    async execute(interaction) {
        const roomID = interaction.options.getString("room_id");
        const embed = await getViewRoomEmbed(interaction, roomID);
        return interaction.reply({ embeds: [embed] });
    },

    async executeMessage(message, arg) {
        const roomID = arg?.[0];
        const embed = await getViewRoomEmbed(message, roomID);
        return message.reply({ embeds: [embed] });
    },

    help: getHelpEmbed(),
    type: "Room",
};

async function getViewRoomEmbed(target, roomID) {
    if (roomID) {
        const room = await getRoom(roomID);
        if (!room) return getFailedToGetRoomEmbed(roomID);
        return await getRoomEmbed(target, roomID);
    }

    const rooms = await getAllRooms();
    return await buildAllRoomsEmbed(target, rooms);
}

async function buildAllRoomsEmbed(target, rooms) {
    const embed = new EmbedBuilder()
        .setTitle(`Active Rooms (${rooms.length})`)
        .setColor("#00ff9c");

    if (!rooms || rooms.length === 0) {
        embed.setDescription("No active rooms.");
        return embed;
    }

    for (const room of rooms) {
        const user = await getUser(target, room.host.toString());
        const hostName = user?.displayName ?? "Unknown User";

        embed.addFields({
            name: `RoomID: \`${room.id}\``,
            value: `Host: \`${hostName}\`\nMember: \`${
                room.member.length ?? 0
            }\``,
            inline: false,
        });
    }

    return embed;
}

function getHelpEmbed() {
    return new HelpEmbedBuilder()
        .withName("viewroom")
        .withDescription("View active rooms or a specific room")
        .withAliase(["viewroom", "vr"])
        .withExampleUsage("$viewroom\n$viewroom 123456")
        .withUsage("**/viewroom** `[room_id]`")
        .build();
}
