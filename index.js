const fs = require("node:fs");
const path = require("node:path");
const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { clientId, token, prefix = "." } = require("./config.json");

// Create client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
    ],
});

// Storage Objects
client.commands = new Map();
client.selects = new Map();
client.buttons = new Map();

/* -------------------- Helper: Recursively Collect JS Files -------------------- */
function getFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((file) =>
        file.isDirectory()
            ? getFiles(path.join(dir, file.name))
            : file.name.endsWith(".js")
            ? path.join(dir, file.name)
            : []
    );
}

/* -------------------- Load Commands -------------------- */
const commandFiles = getFiles(path.join(__dirname, "interactive", "commands"));
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

/* -------------------- Load Selects -------------------- */
const selectFiles = getFiles(path.join(__dirname, "interactive", "selects"));
for (const file of selectFiles) {
    const select = require(file);
    if (select.id) client.selects.set(select.id, select);
}

/* -------------------- Load Buttons -------------------- */
const buttonFiles = getFiles(path.join(__dirname, "interactive", "buttons"));
for (const file of buttonFiles) {
    const button = require(file);
    if (button.id) client.buttons.set(button.id, button);
}

/* -------------------- Deploy Slash Commands -------------------- */
async function deploySlashCommands() {
    const rest = new REST().setToken(token);
    try {
        console.log(`Deploying ${slashCommandsJSON.length} slash commands...`);
        await rest.put(Routes.applicationCommands(clientId), {
            body: slashCommandsJSON,
        });
        console.log("✅ Slash commands registered globally.");
    } catch (error) {
        console.error("Error deploying slash commands:", error);
    }
}

/* -------------------- Load Events -------------------- */
const eventFiles = fs
    .readdirSync(path.join(__dirname, "events"))
    .filter((file) => file.endsWith(".js"));
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
