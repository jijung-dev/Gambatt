import { ButtonBuilder, ButtonStyle } from "discord.js";
import { ReplyRoll } from "../commands/roll.js";

export default {
    id: "roll",

    async execute(interaction, client) {
        await ReplyRoll(interaction);
    },
};

export function GetRoll(userId) {
    return new ButtonBuilder()
        .setCustomId(`roll|${userId}`)
        .setLabel("Roll")
        .setEmoji("🎲")
        .setStyle(ButtonStyle.Primary);
}
