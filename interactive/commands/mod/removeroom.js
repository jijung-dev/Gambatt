import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import {
    ErrorMessage,
    getFailedToGetRoomEmbed,
    getMissingArgumentEmbed,
} from "#utils/errorembeds.js";
import { destroyRoom, getRoom } from "#utils/roomdata_handler.js";

export default {
    data: new SlashCommandBuilder()
        .setName("removeroom")
        .setDescription("Remove a room")
        .addStringOption((option) =>
            option
                .setName("room_id")
                .setDescription("Room ID to remove")
                .setRequired(true)
        ),
    name: "removeroom",
    aliases: ["rr"],

    async execute(interaction) {
        const roomID = interaction.options.getString("room_id");

        const remove_roomedEmbed = await getRemoveRoomEmbed(
            interaction,
            roomID
        );
        return interaction.reply({ embeds: [remove_roomedEmbed] });
    },

    async executeMessage(message, arg) {
        const roomID = arg?.[0];
        if (!roomID)
            return message.reply({
                embeds: [getMissingArgumentEmbed()],
            });

        const remove_roomedEmbed = await getRemoveRoomEmbed(message, roomID);
        return message.reply({ embeds: [remove_roomedEmbed] });
    },

    help: getHelpEmbed(),
    type: "Mod",
};

async function getRemoveRoomEmbed(target, roomID) {
    if (!(await getRoom(roomID))) return getFailedToGetRoomEmbed(roomID);

    const success = await destroyRoom(roomID);

    if (!success) {
        console.log("[removeroom]" + ErrorMessage);
        return target.reply(ErrorMessage);
    }

    const remove_roomedEmbed = new EmbedBuilder()
        .setTitle("Room Removed")
        .setDescription(`RoomID: \`${roomID}\``)
        .setColor("#f50000");
    return remove_roomedEmbed;
}

function getHelpEmbed() {
    return new HelpEmbedBuilder()
        .withName("removeroom")
        .withDescription("Remove a room")
        .withAliase(["removeroom", "rr"])
        .withExampleUsage("$removeroom 123456")
        .withUsage("**/removeroom** `[room_id]`")
        .build();
}
