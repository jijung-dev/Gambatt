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

export const ErrorMessage = {
    content: "There was an error while executing this command!",
    flags: MessageFlags.Ephemeral,
};
