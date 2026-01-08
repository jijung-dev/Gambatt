/**
 * Fetches a user from a mention or defaults to the command author.
 *
 * @async
 * @param {import("discord.js").Message | import("discord.js").CommandInteraction} target - The source message or interaction.
 * @param {string|null} [mention=null] - Optional mention string (e.g., `<@123456>`).
 * @returns {Promise<import("discord.js").User>} The fetched user.
 */
export async function getUser(target, mention = null) {
    const id = mention?.replace(/[<@!>]/g, "");
    const metionUser = await target.client.users.fetch(id).catch(() => null);
    return metionUser || target.user || target.author;
}
