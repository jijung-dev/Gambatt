import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import {
    ErrorMessage,
    getFailedToLeaveEmbed,
    getMissingArgumentEmbed,
} from "#utils/errorembeds.js";
import { changeGame, getUserRoom } from "#utils/roomdata_handler.js";
import { getUser } from "#utils/data_utils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("choose")
        .setDescription("Choose a game to start")
        .addStringOption((option) =>
            option
                .setName("game_id")
                .setDescription("GameID to start playing")
                .setRequired(true)
        ),
    name: "choose",
    aliases: ["c"],

    async execute(interaction) {
        const gameID = interaction.options.getString("game_id");

        const chooseGameEmbed = await getChooseGameEmbed(interaction, gameID);
        return interaction.reply({ embeds: [chooseGameEmbed] });
    },

    async executeMessage(message, arg) {
        const gameID = arg?.[0];
        if (!gameID)
            return message.reply({
                embeds: [getMissingArgumentEmbed()],
            });

        const chooseGameEmbed = await getChooseGameEmbed(message, gameID);
        return message.reply({ embeds: [chooseGameEmbed] });
    },

    help: getHelpEmbed(),
    type: "Room",
};

async function getChooseGameEmbed(target, gameID) {
    const user = await getUser(target);
    const currentRoom = await getUserRoom(user.id);

    if (!currentRoom) {
        console.log("[choose]" + ErrorMessage);
        return target.reply(ErrorMessage);
    }
    if (currentRoom == "NO_ROOM") {
        return getFailedToLeaveEmbed();
    }

    const success = await changeGame(currentRoom.id, gameID);

    if (!success) {
        console.log("[choose]" + ErrorMessage);
        return target.reply(ErrorMessage);
    }

    const chooseGameEmbed = new EmbedBuilder()
        .setTitle("Game Chosen")
        .setDescription(`Game: \`${gameID}\``)
        .setColor("#00b0f4");
    return chooseGameEmbed;
}

function getHelpEmbed() {
    return new HelpEmbedBuilder()
        .withName("choose")
        .withDescription("Choose a game to play")
        .withAliase(["choose", "c"])
        .withExampleUsage("$choose 123456")
        .withUsage("**/choose** `[game_id]`")
        .build();
}
