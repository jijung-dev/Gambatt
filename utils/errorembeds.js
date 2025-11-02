import { Embed, EmbedBuilder } from "discord.js";
import { currencyIcon } from "#utils/data_handler.js";

/**
 * Get a failed embed for a channel that already exist.
 * @param  {string} channelName - Channel name to show in embed.
 * @returns {Embed}
 */
export function getEmbedChannelAlreadyExists(channelName) {
    return new EmbedBuilder()
        .setTitle("❌ A channel with that name already exists")
        .setDescription(`\`${channelName}\``)
        .setColor("#f50000");
}

/**
 * Get a failed embed for a channel that doesn't exist or you don't own.
 * @param  {string} channelName - Channel name to show in embed.
 * @returns {Embed}
 */
export function getEmbedChannelNotOwned(channame) {
    return new EmbedBuilder()
        .setTitle("❌ You don't have that channel")
        .setDescription(`\`${channame}\``)
        .setColor("#f50000");
}

/**
 * Get a failed embed for a character that already exist.
 * @param  {string} characterId - Character value to show in embed.
 * @returns {Embed}
 */
export function getEmbedCharacterAlreadyExist(characterId) {
    return new EmbedBuilder()
        .setTitle("❌ A Character with that value is already exists")
        .setDescription(`\`${characterId}\``)
        .setColor("#f50000");
}

/**
 * Get a failed embed for a character that doesn't exist.
 * @param  {string} characterId - Character value to show in embed.
 * @returns {Embed}
 */
export function getEmbedCharacterNotFound(characterId) {
    return new EmbedBuilder()
        .setTitle("❌ Character not found")
        .setDescription(`\`${characterId}\``)
        .setColor("#f50000");
}

/**
 * Get a failed embed for a character is not own by the user.
 * @param  {string} characterId - Character value to show in embed.
 * @returns {Embed}
 */
export function getEmbedCharacterNotOwned(characterId) {
    return new EmbedBuilder()
        .setTitle("❌ You don't own this character")
        .setDescription(`\`${characterId}\``)
        .setColor("#f50000");
}

/**
 * Get a failed embed for a character that already exist.
 * @param  {string} gearId - gear value to show in embed.
 * @returns {Embed}
 */
export function getEmbedGearAlreadyExist(gearId) {
    return new EmbedBuilder()
        .setTitle("❌ A Gear with that value is already exists")
        .setDescription(`\`${gearId}\``)
        .setColor("#f50000");
}

/**
 * Get a failed embed for a character that doesn't exist.
 * @param  {string} gearId - gear value to show in embed.
 * @returns {Embed}
 */
export function getEmbedGearNotFound(gearId) {
    return new EmbedBuilder()
        .setTitle("❌ Gear not found")
        .setDescription(`\`${gearId}\``)
        .setColor("#f50000");
}

/**
 * Get a failed embed for a character is not own by the user.
 * @param  {string} gearId - gear value to show in embed.
 * @returns {Embed}
 */
export function getEmbedGearNotOwned(gearId) {
    return new EmbedBuilder()
        .setTitle("❌ You don't own this gear")
        .setDescription(`\`${gearId}\``)
        .setColor("#f50000");
}

/**
 * Get a failed embed for link that is now allowed.
 * @returns {Embed}
 */
export function getEmbedNotAllowedLink() {
    return new EmbedBuilder()
        .setTitle("❌ Not allowed link")
        .setDescription(
            "Only links from [Imgur](https://imgur.com/upload) or [Imgchest](https://imgchest.com/upload) are allowed."
        )
        .setColor("#f50000");
}

/**
 * Get a failed embed for insufficient balance.
 * @param {number} balance - The player balance.
 * @param {number} cost - The cost.
 * @returns {Embed}
 */
export function getEmbedNotEnoughBalance(balance, cost) {
    return new EmbedBuilder()
        .setTitle(`Not enough ${currencyIcon.cube.emoji}`)
        .addFields([
            {
                name: "Balance",
                value: `You have **${balance} ${currencyIcon.cube.emoji}**, but need **${cost} ${currencyIcon.cube.emoji}**.`,
            },
        ])
        .setColor("#ff0000");
}
