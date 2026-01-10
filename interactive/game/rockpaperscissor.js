import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";

export default {
    id: "rps",
    name: "Rock Paper Scissors",
    minPlayers: 2,
    maxPlayers: 2,

    async canStart(room) {
        // host + 1 member
        return Array.isArray(room.member) && room.member.length === 1;
    },

    async start(room, interaction) {
        const players = [room.host.slice(1), ...room.member];

        const roomId = String(room.id);

        interaction.client.gameStates.set(roomId, {
            game: "rps",
            players,
            choices: {},
        });

        // Send one embed per player
        for (const playerId of players) {
            const embed = new EmbedBuilder()
                .setTitle("🪨 Rock Paper Scissors")
                .setDescription(`<@${playerId}>, choose your move!`)
                .setColor("#ff9800");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`rps_rock|${playerId}|${room.id}`)
                    .setLabel("🪨 Rock")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`rps_paper|${playerId}|${room.id}`)
                    .setLabel("📄 Paper")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`rps_scissors|${playerId}|${room.id}`)
                    .setLabel("✂️ Scissors")
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.channel.send({
                embeds: [embed],
                components: [row],
            });
        }
    },
};
