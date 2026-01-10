import { SlashCommandBuilder } from "discord.js";
import { getUserRoom } from "#utils/roomdata_handler.js";
import { getUser } from "#utils/data_utils.js";
import {
    ErrorMessage,
    getFailedNotEnoughPlayerEmbed,
    getFailedToGetGameEmbed,
    getFailedToStartGameEmbed,
} from "#utils/errorembeds.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("Start the selected game"),

    name: "start",
    aliases: ["s"],

    async execute(interaction) {
        const embed = await handleStart(interaction);
        if (!embed) return;
        return interaction.reply({ embeds: [embed] });
    },

    async executeMessage(message) {
        const embed = await handleStart(message);
        if (!embed) return;
        return message.reply({ embeds: [embed] });
    },

    help: getHelpEmbed(),
    type: "Room",
};

async function handleStart(target) {
    const user = await getUser(target);
    const room = await getUserRoom(user.id);

    if (!room || room === "NO_ROOM") {
        console.log("[start]" + ErrorMessage);
        return target.reply(ErrorMessage);
    }

    if (!room.game || room.game === -1) {
        return getFailedToStartGameEmbed();
    }

    const game = target.client.games.get(room.game);

    if (!game) {
        return getFailedToGetGameEmbed(room.game);
    }

    const canStart = await game.canStart(room);
    if (!canStart) {
        return getFailedNotEnoughPlayerEmbed(game);
    }

    await game.start(room, target);
    return null;
}

function getHelpEmbed() {
    return new HelpEmbedBuilder()
        .withName("start")
        .withDescription("Start the selected game")
        .withAliase(["start", "s"])
        .withExampleUsage("$start")
        .withUsage("**/start**")
        .build();
}
