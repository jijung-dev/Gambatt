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
    type: "Help",
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

    // Collect unique commands
    for (const [name, cmdObj] of commands) {
        const cmd = cmdObj.default || cmdObj;
        if (!unique.has(cmd.name)) unique.set(cmd.name, cmd);
    }

    // Group commands by type
    const grouped = {};
    for (const cmd of unique.values()) {
        const type = cmd.type || "Other";
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(cmd);
    }

    // Define desired order
    const typeOrder = ["Mod", "Other"];

    // Sort entries: types not in typeOrder appear first
    const sortedEntries = Object.entries(grouped).sort(([aType], [bType]) => {
        const aIndex = typeOrder.indexOf(aType);
        const bIndex = typeOrder.indexOf(bType);

        // Types not in the list → index -1
        if (aIndex === -1 && bIndex === -1) {
            return aType.localeCompare(bType); // both not listed → alphabetical
        } else if (aIndex === -1) {
            return -1; // a not listed → comes first
        } else if (bIndex === -1) {
            return 1; // b not listed → comes first
        } else {
            return aIndex - bIndex; // both listed → use array order
        }
    });

    // Build fields by type
    const fields = sortedEntries
        .filter(([type]) => type !== "Help")
        .map(([type, cmds]) => {
            const value = cmds.map((cmd) => `\`${cmd.name}\``).join(" ");
            return { name: `${type} Commands`, value, inline: false };
        });

    const embed = new EmbedBuilder()
        .setTitle("📜 Command List")
        .setDescription("Use `/help <command>` for more info!")
        .addFields(fields)
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
