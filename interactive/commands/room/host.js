import { SlashCommandBuilder } from "discord.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { ErrorMessage, getFailedToHostEmbed } from "#utils/errorembeds.js";
import { createRoom, getRoom, isInRoom } from "#utils/roomdata_handler.js";
import { getRoomEmbed } from "#utils/room_utils.js";
import { getUser } from "#utils/data_utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("host")
        .setDescription("Host a room"),
    name: "host",
    aliases: [],

    async execute(interaction) {
        const createdEmbed = await getHostEmbed(interaction);
        return interaction.reply({
            embeds: [createdEmbed],
        });
    },

    async executeMessage(message, arg) {
        const createdEmbed = await getHostEmbed(message);
        return message.reply({
            embeds: [createdEmbed],
        });
    },

    help: getHelpEmbed(),
    type: "Room",
};

async function getHostEmbed(target) {
    const user = await getUser(target);

    if (await isInRoom(user.id)) return getFailedToHostEmbed();

    const success = await createRoom(user.id);

    if (!success) {
        console.log("[host]" + ErrorMessage);
        return target.reply(ErrorMessage);
    }

    const createdEmbed = await getRoomEmbed(target, success);
    return createdEmbed;
}

function getHelpEmbed() {
    return new HelpEmbedBuilder()
        .withName("host")
        .withDescription("Host a room")
        .withAliase(["host"])
        .withExampleUsage("$host")
        .withUsage("**/host**")
        .build();
}
