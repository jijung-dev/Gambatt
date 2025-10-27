import { ButtonBuilder, ButtonStyle } from "discord.js";
import { replyRoll10 } from "#commands/roll/roll10.js";

export default {
    id: "roll10",

    async execute(interaction, client) {
        await replyRoll10(interaction);
    },
};

export function getRoll10(userId) {
    return new ButtonBuilder()
        .setCustomId(`roll10|${userId}`)
        .setLabel("Roll X10")
        .setEmoji("🎲")
        .setStyle(ButtonStyle.Primary);
}
