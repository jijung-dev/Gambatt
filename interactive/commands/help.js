import { HelpEmbedBuilder } from "#utils/HelpEmbedBuilder.js";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show command help")
        .addStringOption((option) =>
            option
                .setName("command")
                .setDescription("Command name or alias")
                .setRequired(false)
        ),

    name: "help",
    aliases: ["h"],

    async execute(interaction) {
        const commandName = interaction.options.getString("command");
        await showHelp(interaction, commandName);
    },

    async executeMessage(message, args) {
        await showHelp(message, args?.[0] || null);
    },

    help: null,
};

/* -------------------- Main Entry -------------------- */
async function showHelp(target, commandName) {
    const commands = target.client.commands;

    if (!commandName) {
        return sendCommandList(target, commands);
    }

    const command = findCommand(commands, commandName);
    if (!command) {
        return target.reply(`❌ No command found for \`${commandName}\`.`);
    }

    const embed =
        command.help ||
        command.default?.help ||
        buildFallbackHelpEmbed(command);

    return target.reply({ embeds: [embed] });
}

/* -------------------- Find Command by Name or Alias -------------------- */
function findCommand(commands, name) {
    const lower = name.toLowerCase();
    return commands.get(lower)?.default || commands.get(lower) || null;
}

/* -------------------- Command List Embed -------------------- */
function sendCommandList(target, commands) {
    const unique = new Map();

    for (const [name, cmdObj] of commands) {
        const cmd = cmdObj.default || cmdObj;
        if (!unique.has(cmd.name)) unique.set(cmd.name, cmd);
    }

    const description = Array.from(unique.values())
        .map(
            (cmd) =>
                `**/${cmd.name}**${
                    cmd.aliases?.length
                        ? ` (${[
                              ...(cmd.aliases?.map((a) => `\`${a}\``) || []),
                          ].join(", ")})`
                        : ""
                }: ${cmd.data?.description || "No description"}`
        )
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Command List")
        .setDescription("Type: `$help <command>` for more info!")
        .addFields({ name: "Commands", value: description, inline: false })
        .setFooter({ text: "Anything in <> is optional" })
        .setColor("#00BFFF");

    return target.reply({ embeds: [embed] });
}

/* -------------------- Fallback Help Embed -------------------- */
function buildFallbackHelpEmbed(cmd) {
    const description = cmd.data?.description || "No description available.";
    const example = cmd.example || `No example available for ${cmd.name}.`;

    return new HelpEmbedBuilder()
        .withName(cmd.name)
        .withDescription(description)
        .withAliase([cmd.name, ...(cmd.aliases || [])])
        .withExampleUsage(example)
        .withUsage("Missing Usage")
        .build();
}
