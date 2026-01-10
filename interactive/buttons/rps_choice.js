import { EmbedBuilder } from "discord.js";

export default {
    id: "rps",

    async execute(interaction, client) {
        const [action, ownerId, roomId] = interaction.customId.split("|");
        const choice = action.replace("rps_", "");

        const state = client.gameStates.get(roomId);
        // Always ACK the interaction
        await interaction.deferUpdate();

        if (!state || state.game !== "rps") {
            return;
        }

        // Save choice
        state.choices[ownerId] = choice;

        // Disable buttons after player chooses
        try {
            const disabledComponents = interaction.message.components.map(
                (row) => ({
                    ...row.toJSON(),
                    components: row.components.map((button) => ({
                        ...button.toJSON(),
                        disabled: true,
                    })),
                })
            );

            await interaction.editReply({
                components: disabledComponents,
            });
        } catch (e) {
            // message already edited or deleted, safe to ignore
        }

        // Wait until both players choose
        if (Object.keys(state.choices).length < 2) return;

        const [p1, p2] = state.players;
        const c1 = state.choices[p1];
        const c2 = state.choices[p2];

        let resultText;
        if (c1 === c2) {
            resultText = "🤝 **It's a tie!**";
        } else if (
            (c1 === "rock" && c2 === "scissors") ||
            (c1 === "paper" && c2 === "rock") ||
            (c1 === "scissors" && c2 === "paper")
        ) {
            resultText = `🏆 <@${p1}> **wins!**`;
        } else {
            resultText = `🏆 <@${p2}> **wins!**`;
        }

        const resultEmbed = new EmbedBuilder()
            .setTitle("🪨 Rock Paper Scissors — Result")
            .setDescription(
                `<@${p1}> chose **${c1}**\n` +
                    `<@${p2}> chose **${c2}**\n\n` +
                    resultText
            )
            .setColor("#4caf50");

        await interaction.channel.send({
            embeds: [resultEmbed],
        });

        // Cleanup
        client.gameStates.delete(roomId);
    },
};
