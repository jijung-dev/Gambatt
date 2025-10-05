import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { LoadCharacterData } from "./utils/characterdata_handler.js";

// ESM replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON config
const configPath = path.join(__dirname, "config.json");
const rawData = fs.readFileSync(configPath, "utf-8");
const { clientId, guildId, token, prefix = "." } = JSON.parse(rawData);

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
    const commandURL = pathToFileURL(file).href;
    const importedModule = await import(commandURL);
    const command = importedModule.default || importedModule;
    if (!command || !command.name) continue;

    if (command.name) {
        client.commands.set(command.name, {
            ...importedModule,
            default: command, // default handler
        });
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
    const selectURL = pathToFileURL(file).href;
    const importedModule = await import(selectURL);
    const select = importedModule.default || importedModule;
    if (!select || !select.id) continue;

    // Store all exports (default + named) together
    client.selects.set(select.id, {
        ...importedModule,
        default: select, // default handler
    });
}

/* -------------------- Load Buttons -------------------- */
const buttonFiles = getFiles(path.join(__dirname, "interactive", "buttons"));
for (const file of buttonFiles) {
    const buttonURL = pathToFileURL(file).href;
    const importedModule = await import(buttonURL);
    const button = importedModule.default || importedModule;
    if (!button || !button.id) continue;

    // Store all exports (default + named) together
    client.buttons.set(button.id, {
        ...importedModule,
        default: button, // default handler
    });
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
    const eventURL = pathToFileURL(path.join(__dirname, "events", file)).href;
    const { default: event } = await import(eventURL);
    if (!event) continue;

    if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
    }
}

/* -------------------- Startup -------------------- */
(async () => {
    await deploySlashCommands();
    await LoadCharacterData();
    client.login(token);
})();
