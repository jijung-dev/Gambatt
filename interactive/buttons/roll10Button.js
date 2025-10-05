import { ButtonBuilder, ButtonStyle } from "discord.js";
import { ReplyRoll10 } from "../commands/roll10.js";

export default {
    id: "roll10",

    async execute(interaction, client) {
        await ReplyRoll10(interaction);
    },
};

export function GetRoll10(userId) {
    return new ButtonBuilder()
        .setCustomId(`roll10|${userId}`)
        .setLabel("Roll X10")
        .setEmoji("🎲")
        .setStyle(ButtonStyle.Primary);
}
