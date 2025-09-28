const fs = require("node:fs");
const path = require("node:path");
const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { clientId, token, prefix = "." } = require("./config.json");

// Create client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages
    ]
});

// Command storage
client.commands = new Map();

/* -------------------- Load Commands -------------------- */
function getFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap(file =>
        file.isDirectory()
            ? getFiles(path.join(dir, file.name))
            : file.name.endsWith(".js")
            ? path.join(dir, file.name)
            : []
    );
}

const commandFiles = getFiles(path.join(__dirname, "commands"));
const slashCommandsJSON = [];

for (const file of commandFiles) {
    const command = require(file);

    if (command.name) {
        client.commands.set(command.name, command);

        if (command.aliases && Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
                client.commands.set(alias, command);
            }
        }
    }

    if (command.data) {
        slashCommandsJSON.push(command.data.toJSON());
    }
}

/* -------------------- Deploy Slash Commands Globally with Auto-Delete -------------------- */
async function deploySlashCommands() {
    const rest = new REST().setToken(token);
    try {
        console.log(`Deploying ${slashCommandsJSON.length} slash commands...`);
        await rest.put(Routes.applicationCommands(clientId), { body: slashCommandsJSON });
        console.log("✅ Slash commands registered globally.");
    } catch (error) {
        console.error("Error deploying slash commands:", error);
    }
}

/* -------------------- Load Events -------------------- */
const eventFiles = fs.readdirSync(path.join(__dirname, "events")).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
    const event = require(path.join(__dirname, "events", file));

    if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
    }
}

/* -------------------- Startup -------------------- */
(async () => {
    await deploySlashCommands();
    client.login(token);
})();
