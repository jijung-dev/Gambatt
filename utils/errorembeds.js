import { MessageFlags, Embed, EmbedBuilder } from "discord.js";
// import { currencyIcon } from "#utils/data_handler.js";

// /**
//  * Get a failed embed for a channel that already exist.
//  * @param  {string} channelName - Channel name to show in embed.
//  * @returns {Embed}
//  */
// export function getEmbedFailed() {
//     return new EmbedBuilder()
//         .setTitle("❌ A channel with that name already exists")
//         .setDescription(`\`${channelName}\``)
//         .setColor("#f50000");
// }

/**
 * Get a failed embed for missing arguments.
 * @returns {Embed}
 */
export function getMissingArgumentEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ You missing some arguemnts")
        .setDescription(`Use \`/help\` for more info.`)
        .setColor("#f50000");
}
/**
 * Get a failed embed for a room that doesn't exist.
 * @param  {string} roomID - Room ID that doesn't exist.
 * @returns {Embed}
 */
export function getFailedToGetRoomEmbed(roomID) {
    return new EmbedBuilder()
        .setTitle("❌ That room doesn't exist")
        .setDescription(`RoomID: \`${roomID}\``)
        .setColor("#f50000");
}

/**
 * Get a failed embed for when you already in a room.
 * @returns {Embed}
 */
export function getFailedToJoinEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ You already in a room. Leave the room if you in one")
        .setDescription(`Use \`/leave\` to leave the room`)
        .setColor("#f50000");
}

/**
 * Get a failed embed for leaving non-existing room.
 * @returns {Embed}
 */
export function getFailedToLeaveEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ You are not in a room right now")
        .setDescription(
            `Use \`/join\` to join a room or \`/host\` to host one.`
        )
        .setColor("#f50000");
}

/**
 * Get a failed embed for host a room when you already in a room.
 * @returns {Embed}
 */
export function getFailedToHostEmbed() {
    return new EmbedBuilder()
        .setTitle("❌ You already in a room. Leave before u can host")
        .setDescription(`Use \`/leave\` to leave the room`)
        .setColor("#f50000");
}

export const ErrorMessage = {
    content: "There was an error while executing this command!",
    flags: MessageFlags.Ephemeral,
};
