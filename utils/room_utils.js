import { getUser } from "#utils/data_utils.js";
import { getRoom } from "#utils/roomdata_handler.js";
import { EmbedBuilder } from "discord.js";

export async function getRoomEmbed(target, roomID) {
    const roomInfo = await getRoom(roomID);
    if (!roomInfo) return null;

    const hostUser = await getUser(target, roomInfo.host.toString());

    let memberText = "*(No members)*";

    if (Array.isArray(roomInfo.member) && roomInfo.member.length > 0) {
        const users = await Promise.all(
            roomInfo.member.map((id) => getUser(target, id))
        );

        memberText = users
            .filter(Boolean)
            .map((u) => `- \`${u.displayName}\``)
            .join("\n");
    }

    const gameInfo = target.client.games.get(roomInfo.game);

    return new EmbedBuilder()
        .setTitle("Room Info")
        .setDescription(
            `RoomID: \`\`\`${roomInfo.id}\`\`\`\n` +
                `**Host:** \`${hostUser.displayName}\`\n` +
                `**Game:** \`${gameInfo?.name ?? "Nothing"}\``
        )
        .addFields({
            name: "Members:",
            value: memberText,
            inline: false,
        })
        .setColor("#00b0f4");
}

export async function getJoinedEmbed(roomInfo, userID) {
    if (!roomInfo || !userID) return null;

    return new EmbedBuilder()
        .setTitle("Room Joined")
        .setDescription(`RoomID: \`${roomInfo}\``)
        .setColor("#00b0f4");
}

export async function getLeaveedEmbed(roomInfo, userID) {
    if (!roomInfo || !userID) return null;

    if (roomInfo == "ROOM_CLOSED") {
        return new EmbedBuilder()
            .setTitle("Host Left")
            .setDescription(`Room closed`)
            .setColor("#00b0f4");
    }

    return new EmbedBuilder()
        .setTitle("Room Left")
        .setDescription(`RoomID: \`${roomInfo}\``)
        .setColor("#00b0f4");
}
