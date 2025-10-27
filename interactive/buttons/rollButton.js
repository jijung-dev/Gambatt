import { ButtonBuilder, ButtonStyle } from "discord.js";
import { replyRoll } from "#commands/roll/roll.js";

export default {
    id: "roll",

    async execute(interaction, client) {
        await replyRoll(interaction);
    },
};

export function getRoll(userId) {
    return new ButtonBuilder()
        .setCustomId(`roll|${userId}`)
        .setLabel("Roll")
        .setEmoji("🎲")
        .setStyle(ButtonStyle.Primary);
}
