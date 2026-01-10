/**
 * Fetches a user from a mention or defaults to the command author.
 *
 * @async
 * @param {import("discord.js").Message | import("discord.js").CommandInteraction} target - The source message or interaction.
 * @param {string|null} [mention=null] - Optional mention string (e.g., `<@123456>`).
 * @returns {Promise<import("discord.js").User>} The fetched user.
 */
export async function getUser(target, mention = null) {
    // If mention is provided, resolve it explicitly
    if (typeof mention === "string") {
        const id = mention.replace(/[<@!>]/g, "");
        if (/^\d+$/.test(id)) {
            const user = await target.client.users.fetch(id).catch(() => null);
            if (user) return user;
        }
    }
    if (target.user) return target.user;
    if (target.author) return target.author;
    return null;
}
