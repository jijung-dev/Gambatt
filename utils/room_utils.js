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

    return new EmbedBuilder()
        .setTitle("Room Info")
        .setDescription(
            `RoomID: \`${roomInfo.id}\`\n\n` +
                `**Host:** \`${hostUser.displayName}\``
        )
        .addFields({
            name: "Members:",
            value: memberText,
            inline: false,
        })
        .setColor("#00b0f4");
}

export async function getJoinedEmbed(target, roomID, userID) {
    if (!roomID || !userID) return null;

    const joinUser = await getUser(target, userID);

    return new EmbedBuilder()
        .setAuthor({
            name: joinUser.displayName,
        })
        .setTitle("Room Joined")
        .setDescription(`RoomID: \`${roomID}\``)
        .setColor("#00b0f4");
}

export async function getLeaveedEmbed(target, roomID, userID) {
    if (!roomID || !userID) return null;

    const leaveUser = await getUser(target, userID);

    return new EmbedBuilder()
        .setAuthor({
            name: leaveUser.displayName,
        })
        .setTitle("Room Left")
        .setDescription(`RoomID: \`${roomID}\``)
        .setColor("#00b0f4");
}
